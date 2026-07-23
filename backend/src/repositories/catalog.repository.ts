import type { CategoryDto, CatalogItemDto, Paginated, ProductDto } from "@cardverse/shared";
import { JsonRepository } from "../data/json-repository.js";
import { dataFilePath } from "../data/paths.js";
import type { CatalogItemRecord, ProductRecord } from "../models/catalog.js";
import { CategoryRepository } from "./category.repository.js";
import { createEntityId } from "../utils/id.js";

function toCategoryDto(record: {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
  emoji: string;
}): CategoryDto {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    nameTh: record.nameTh,
    emoji: record.emoji,
  };
}

export class CatalogRepository {
  private readonly catalogItems = new JsonRepository<CatalogItemRecord>(dataFilePath("catalog-items.json"));
  private readonly products = new JsonRepository<ProductRecord>(dataFilePath("products.json"));

  constructor(private readonly categories: CategoryRepository) {}

  async listCatalogItems(params: {
    q?: string;
    category?: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<CatalogItemDto>> {
    const [options, rows] = await Promise.all([
      this.categories.listCatalogOptions(),
      this.catalogItems.findAll({ sort: { field: "name", direction: "asc" } }),
    ]);

    const categoryIds =
      params.category == null
        ? null
        : new Set(options.categories.filter((category) => category.slug === params.category).map((category) => category.id));

    const filtered = rows.filter((item) => {
      if (categoryIds && !categoryIds.has(item.categoryId)) return false;
      if (params.q) {
        const term = params.q.toLowerCase();
        return (
          item.name.toLowerCase().includes(term) ||
          item.slug.toLowerCase().includes(term)
        );
      }
      return true;
    });

    const paginated = this.catalogItems.pagination(filtered, params.page, params.pageSize);
    return {
      ...paginated,
      items: paginated.items.map((item) => this.serializeCatalogItem(item, options)),
    };
  }

  async getCatalogItem(slugOrId: string): Promise<CatalogItemDto | null> {
    const [options, rows] = await Promise.all([
      this.categories.listCatalogOptions(),
      this.catalogItems.findAll(),
    ]);
    const item = rows.find((row) => row.slug === slugOrId || row.id === slugOrId);
    if (!item) return null;
    return this.serializeCatalogItem(item, options);
  }

  async createCatalogItem(input: {
    name: string;
    categoryId: string;
    subcategoryId?: string;
    brandId?: string;
    setId?: string;
    rarity?: CatalogItemRecord["rarity"];
    cardNumber?: string;
    imageUrl?: string;
    images?: string[];
  }): Promise<CatalogItemDto> {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const item = await this.catalogItems.create({
      id: createEntityId("catalog", slug),
      slug,
      name: input.name,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId ?? null,
      brandId: input.brandId ?? null,
      setId: input.setId ?? null,
      rarity: input.rarity ?? null,
      cardNumber: input.cardNumber ?? null,
      imageUrl: input.imageUrl ?? null,
      images: input.images ?? [],
    });
    const options = await this.categories.listCatalogOptions();
    return this.serializeCatalogItem(item, options);
  }

  async listProducts(where: {
    q?: string;
    category?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    pageSize: number;
    sort?: "newest" | "price_asc" | "price_desc" | "popular";
  }): Promise<Paginated<ProductDto>> {
    const [options, catalogRows, productRows] = await Promise.all([
      this.categories.listCatalogOptions(),
      this.catalogItems.findAll(),
      this.products.findAll(),
    ]);
    const catalogById = new Map(catalogRows.map((item) => [item.id, item] as const));

    const filtered = productRows.filter((product) => {
      if (where.type && product.type !== where.type) return false;
      if (where.q) {
        const term = where.q.toLowerCase();
        const matchesText =
          product.name.toLowerCase().includes(term) ||
          (product.subtitle ?? "").toLowerCase().includes(term);
        if (!matchesText) return false;
      }
      if (where.minPrice != null && product.price < Math.round(where.minPrice * 100)) return false;
      if (where.maxPrice != null && product.price > Math.round(where.maxPrice * 100)) return false;
      if (where.category) {
        const catalogItem = product.catalogItemId ? catalogById.get(product.catalogItemId) : null;
        const category = catalogItem
          ? options.categories.find((entry) => entry.id === catalogItem.categoryId)
          : null;
        if (category?.slug !== where.category) return false;
      }
      return true;
    });

    filtered.sort(
      where.sort === "price_asc"
        ? (a, b) => a.price - b.price
        : where.sort === "price_desc"
          ? (a, b) => b.price - a.price
          : where.sort === "popular"
            ? (a, b) => b.soldCount - a.soldCount
            : (a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
    );

    const paginated = this.products.pagination(filtered, where.page, where.pageSize);
    return {
      ...paginated,
      items: paginated.items.map((item) => this.serializeProduct(item, catalogById, options)),
    };
  }

  async home() {
    const [categories, catalogRows, products] = await Promise.all([
      this.categories.listCategories(),
      this.catalogItems.findAll(),
      this.products.findAll(),
    ]);
    const catalogById = new Map(catalogRows.map((item) => [item.id, item] as const));
    const options = await this.categories.listCatalogOptions();
    const serialized = (rows: ProductRecord[]) =>
      rows.slice(0, 8).map((item) => this.serializeProduct(item, catalogById, options));

    const trending = products
      .filter((row) => row.isTrending)
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    const newArrival = products
      .filter((row) => row.isNewArrival)
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    const preOrder = products
      .filter((row) => row.isPreOrder)
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    const featured = products
      .filter((row) => row.isFeatured)
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    const expensive = [...products].filter((row) => row.stock > 0).sort((a, b) => b.price - a.price);
    const popular = [...products].filter((row) => row.stock > 0).sort((a, b) => b.soldCount - a.soldCount);

    return {
      categories: categories.slice(0, 8).map((item) => toCategoryDto(item)),
      trending: serialized(trending),
      newArrival: serialized(newArrival),
      preOrder: serialized(preOrder),
      featured: serialized(featured),
      topExpensive: serialized(expensive.slice(0, 2)),
      topSelling: serialized(popular.slice(0, 2)),
    };
  }

  async detail(slug: string) {
    const [options, catalogRows, products] = await Promise.all([
      this.categories.listCatalogOptions(),
      this.catalogItems.findAll(),
      this.products.findAll(),
    ]);
    const catalogById = new Map(catalogRows.map((item) => [item.id, item] as const));
    const current = products.find((row) => row.slug === slug || row.id === slug);
    if (!current) return null;
    const related = products.filter((row) => row.id !== current.id).slice(0, 5);

    return {
      product: this.serializeProduct(current, catalogById, options),
      releaseDate: null,
      description: current.description,
      related: related.map((row) => this.serializeProduct(row, catalogById, options)),
    };
  }

  private serializeCatalogItem(
    item: CatalogItemRecord,
    options: Awaited<ReturnType<CategoryRepository["listCatalogOptions"]>>,
  ): CatalogItemDto {
    const category = options.categories.find((entry) => entry.id === item.categoryId);
    const subcategory = options.subcategories.find((entry) => entry.id === item.subcategoryId);
    const brand = options.brands.find((entry) => entry.id === item.brandId);
    const set = options.sets.find((entry) => entry.id === item.setId);

    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      rarity: item.rarity,
      cardNumber: item.cardNumber,
      imageUrl: item.imageUrl,
      category: category
        ? {
            id: category.id,
            slug: category.slug,
            name: category.name,
            nameTh: category.nameTh,
            emoji: category.emoji,
          }
        : {
            id: item.categoryId,
            slug: item.categoryId,
            name: "Unknown",
            nameTh: "Unknown",
            emoji: "❓",
          },
      subcategoryName: subcategory?.name ?? null,
      brandName: brand?.name ?? null,
      setName: set?.name ?? null,
    };
  }

  private serializeProduct(
    item: ProductRecord,
    catalogById: Map<string, CatalogItemRecord>,
    options: Awaited<ReturnType<CategoryRepository["listCatalogOptions"]>>,
  ): ProductDto {
    const catalogItem = item.catalogItemId ? catalogById.get(item.catalogItemId) ?? null : null;
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      subtitle: item.subtitle,
      type: item.type,
      price: Math.round(item.price) / 100,
      stock: item.stock,
      imageUrl: item.imageUrl,
      images: item.images,
      isPreOrder: item.isPreOrder,
      rarity: item.rarity,
      soldCount: item.soldCount,
      catalogItem: catalogItem ? this.serializeCatalogItem(catalogItem, options) : null,
    };
  }
}
