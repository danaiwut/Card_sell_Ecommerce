import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { serializeProduct, catalogItemInclude, toBaht } from "../common/serializers";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async get(userId: string) {
    const cart = await this.ensureCart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: { include: { catalogItem: { include: catalogItemInclude } } } },
      orderBy: { createdAt: "asc" },
    });

    const lines = items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      product: serializeProduct(i.product),
      lineTotal: toBaht(i.product.price * i.quantity),
    }));
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

    return { items: lines, subtotal, shipping: 0, total: subtotal };
  }

  async add(
    userId: string,
    productId: string,
    quantity: number,
    mode: "add" | "set" = "add",
  ) {
    const cart = await this.ensureCart(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException("Product not found");
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: mode === "set" ? { quantity } : { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity },
    });
    return this.get(userId);
  }

  async setQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.ensureCart(userId);
    if (quantity <= 0) {
      await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    } else {
      await this.prisma.cartItem.updateMany({
        where: { id: itemId, cartId: cart.id },
        data: { quantity },
      });
    }
    return this.get(userId);
  }

  async remove(userId: string, itemId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.get(userId);
  }

  async clear(userId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.get(userId);
  }
}
