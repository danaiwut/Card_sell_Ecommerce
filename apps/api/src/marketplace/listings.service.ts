import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import type { CreateListingInput, CreateOfferInput, MarketplaceQuery, RejectOfferInput } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  catalogItemInclude,
  serializeListing,
  serializeListingOffer,
  toBaht,
  toSatang,
} from "../common/serializers";

const offerInclude = {
  buyer: true,
  listing: {
    include: {
      catalogItem: { include: catalogItemInclude },
      seller: true,
    },
  },
} as const;

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: MarketplaceQuery) {
    const where: any = { status: "ACTIVE" };
    if (query.category) where.catalogItem = { category: { slug: query.category } };
    if (query.rarity) {
      where.catalogItem = { ...(where.catalogItem ?? {}), rarity: query.rarity };
    }
    if (query.q) {
      where.catalogItem = {
        ...(where.catalogItem ?? {}),
        name: { contains: query.q, mode: "insensitive" },
      };
    }
    if (query.minPrice != null || query.maxPrice != null) {
      where.price = {};
      if (query.minPrice != null) where.price.gte = toSatang(query.minPrice);
      if (query.maxPrice != null) where.price.lte = toSatang(query.maxPrice);
    }
    if (query.minSellerRating != null) {
      where.seller = { sellerRating: { gte: query.minSellerRating } };
    }

    const orderBy =
      query.sort === "price_desc"
        ? { price: "desc" as const }
        : query.sort === "newest"
          ? { createdAt: "desc" as const }
          : { price: "asc" as const };

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: { catalogItem: { include: catalogItemInclude }, seller: true },
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items.map(serializeListing),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async byCatalogItem(catalogItemId: string) {
    const items = await this.prisma.listing.findMany({
      where: { catalogItemId, status: "ACTIVE" },
      include: { catalogItem: { include: catalogItemInclude }, seller: true },
      orderBy: { price: "asc" },
      take: 50,
    });
    return items.map(serializeListing);
  }

  async mine(sellerId: string) {
    const items = await this.prisma.listing.findMany({
      where: { sellerId },
      include: { catalogItem: { include: catalogItemInclude }, seller: true },
      orderBy: { createdAt: "desc" },
    });
    return items.map(serializeListing);
  }

  async create(sellerId: string, input: CreateListingInput) {
    const catalogItem = await this.prisma.catalogItem.findUnique({
      where: { id: input.catalogItemId },
    });
    if (!catalogItem) {
      throw new BadRequestException("เลือกการ์ดจาก catalog ที่มีอยู่เท่านั้น");
    }

    if (process.env.STRIPE_SECRET_KEY) {
      const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
      if (!seller?.stripeConnectOnboarded) {
        throw new ForbiddenException(
          "ต้องเชื่อมต่อบัญชีรับเงิน (Stripe Connect) ก่อนลงขาย",
        );
      }
    }

    const listing = await this.prisma.listing.create({
      data: {
        catalogItemId: input.catalogItemId,
        sellerId,
        itemType: input.itemType,
        price: toSatang(input.price),
        condition: input.condition ?? "NEAR_MINT",
        grade: input.itemType === "SINGLE_CARD" ? input.grade : null,
        imageUrls: input.imageUrls ?? [],
        quantity: input.quantity,
        description: input.description,
      },
      include: { catalogItem: { include: catalogItemInclude }, seller: true },
    });
    return serializeListing(listing);
  }

  async cancel(sellerId: string, id: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException("ไม่ใช่ประกาศของคุณ");
    }
    if (listing.status === "SOLD") {
      throw new BadRequestException("ไม่สามารถยกเลิกประกาศที่ขายแล้วได้");
    }
    const activeOrder = await this.prisma.marketplaceOrder.findFirst({
      where: {
        listingId: id,
        status: { in: ["PENDING_PAYMENT", "PAID_HELD", "SHIPPED", "DELIVERED", "DISPUTED"] },
      },
    });
    if (activeOrder) {
      throw new BadRequestException("มีคำสั่งซื้อที่กำลังดำเนินการอยู่ ไม่สามารถยกเลิกประกาศได้");
    }
    await this.prisma.listing.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return { ok: true };
  }

  async incomingOffers(sellerId: string) {
    const offers = await this.prisma.listingOffer.findMany({
      where: { listing: { sellerId } },
      include: offerInclude,
      orderBy: { createdAt: "desc" },
    });
    return offers.map(serializeListingOffer);
  }

  async myOffers(buyerId: string) {
    const offers = await this.prisma.listingOffer.findMany({
      where: { buyerId },
      include: offerInclude,
      orderBy: { createdAt: "desc" },
    });
    return offers.map(serializeListingOffer);
  }

  async createOffer(buyerId: string, listingId: string, input: CreateOfferInput) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { catalogItem: true, seller: true },
    });
    if (!listing || listing.status !== "ACTIVE") {
      throw new NotFoundException("Listing not found");
    }
    if (listing.sellerId === buyerId) {
      throw new BadRequestException("ไม่สามารถเสนอราคากับประกาศของตัวเอง");
    }

    const amount = toSatang(input.amount);
    if (amount >= listing.price) {
      throw new BadRequestException("ราคาที่เสนอต้องต่ำกว่าราคาปิดการขาย");
    }

    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
    const offer = await this.prisma.listingOffer.create({
      data: {
        listingId,
        buyerId,
        amount,
        message: input.message,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: listing.sellerId,
        type: "MARKETPLACE_SALE",
        title: "มีข้อเสนอราคาใหม่",
        body: `${buyer?.displayName ?? "ผู้ซื้อ"} เสนอราคา ฿${toBaht(amount).toLocaleString()} สำหรับ ${listing.catalogItem.name}`,
        link: "/account/offers",
      },
    });

    return {
      id: offer.id,
      amount: toBaht(offer.amount),
      message: offer.message,
      status: offer.status,
      listingId: offer.listingId,
    };
  }

  async acceptOffer(sellerId: string, offerId: string) {
    const offer = await this.prisma.listingOffer.findUnique({
      where: { id: offerId },
      include: {
        buyer: true,
        listing: { include: { catalogItem: true } },
      },
    });
    if (!offer) throw new NotFoundException("Offer not found");
    if (offer.listing.sellerId !== sellerId) {
      throw new ForbiddenException("ไม่ใช่ข้อเสนอของประกาศคุณ");
    }
    if (offer.status !== "PENDING") {
      throw new BadRequestException("ข้อเสนอนี้ดำเนินการไปแล้ว");
    }
    if (offer.listing.status !== "ACTIVE") {
      throw new BadRequestException("ประกาศนี้ปิดแล้ว");
    }

    await this.prisma.$transaction([
      this.prisma.listingOffer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" },
      }),
      this.prisma.listingOffer.updateMany({
        where: {
          listingId: offer.listingId,
          id: { not: offerId },
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
          rejectReason: "มีข้อเสนออื่นที่ผู้ขายยอมรับแล้ว",
        },
      }),
    ]);

    await this.prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: "MARKETPLACE_SALE",
        title: "ข้อเสนอราคาได้รับการยอมรับ",
        body: `คุณสามารถซื้อ ${offer.listing.catalogItem.name} ในราคา ฿${toBaht(offer.amount).toLocaleString()} ได้แล้ว`,
        link: `/marketplace/${offer.listing.catalogItemId}?offer=${offerId}`,
      },
    });

    return { ok: true, offerId };
  }

  async rejectOffer(sellerId: string, offerId: string, input: RejectOfferInput) {
    const offer = await this.prisma.listingOffer.findUnique({
      where: { id: offerId },
      include: {
        buyer: true,
        listing: { include: { catalogItem: true } },
      },
    });
    if (!offer) throw new NotFoundException("Offer not found");
    if (offer.listing.sellerId !== sellerId) {
      throw new ForbiddenException("ไม่ใช่ข้อเสนอของประกาศคุณ");
    }
    if (offer.status !== "PENDING") {
      throw new BadRequestException("ข้อเสนอนี้ดำเนินการไปแล้ว");
    }

    await this.prisma.listingOffer.update({
      where: { id: offerId },
      data: { status: "REJECTED", rejectReason: input.reason },
    });

    await this.prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: "MARKETPLACE_SALE",
        title: "ข้อเสนอราคาถูกปฏิเสธ",
        body: `ผู้ขายปฏิเสธข้อเสนอสำหรับ ${offer.listing.catalogItem.name}: ${input.reason}`,
        link: `/marketplace/${offer.listing.catalogItemId}`,
      },
    });

    return { ok: true };
  }
}
