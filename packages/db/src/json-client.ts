import { AsyncLock } from "./async-lock";
import { bootstrapJsonData } from "./bootstrap";
import { hydrateDates, serializeDates } from "./dates";
import { JsonRepository, type JsonRecord } from "./json-repository";
import { ModelDelegate } from "./model-delegate";
import { dataFilePath } from "./paths";
import {
  ALL_MODELS,
  DATE_FIELDS,
  MODEL_FILES,
  RELATIONS,
  type ModelName,
} from "./schema";
import type {
  Address,
  Brand,
  CardSet,
  Cart,
  CartItem,
  CatalogItem,
  Category,
  CollectionItem,
  Coupon,
  Listing,
  ListingOffer,
  MarketplaceOrder,
  NewsPost,
  Notification,
  Order,
  OrderItem,
  PlatformSetting,
  PricePoint,
  Product,
  SellerReview,
  ProductReview,
  Shipment,
  ShipmentEvent,
  Subcategory,
  TopUpRequest,
  Trade,
  User,
  Wallet,
  WalletTransaction,
  WithdrawalRequest,
} from "./models";

interface TxState {
  overlays: Map<ModelName, JsonRecord[]>;
  dirty: Set<ModelName>;
}

export class JsonClient {
  private readonly repos = new Map<ModelName, JsonRepository<JsonRecord>>();
  private readonly globalLock = new AsyncLock();
  private txState: TxState | null = null;
  private bootstrapped = false;
  /** Allows nested reads/writes within the same locked operation. */
  private lockDepth = 0;

  readonly user = new ModelDelegate<User>(this, "user");
  readonly wallet = new ModelDelegate<Wallet>(this, "wallet");
  readonly walletTransaction = new ModelDelegate<WalletTransaction>(this, "walletTransaction");
  readonly withdrawalRequest = new ModelDelegate<WithdrawalRequest>(this, "withdrawalRequest");
  readonly topUpRequest = new ModelDelegate<TopUpRequest>(this, "topUpRequest");
  readonly address = new ModelDelegate<Address>(this, "address");
  readonly category = new ModelDelegate<Category>(this, "category");
  readonly subcategory = new ModelDelegate<Subcategory>(this, "subcategory");
  readonly brand = new ModelDelegate<Brand>(this, "brand");
  readonly cardSet = new ModelDelegate<CardSet>(this, "cardSet");
  readonly catalogItem = new ModelDelegate<CatalogItem>(this, "catalogItem");
  readonly product = new ModelDelegate<Product>(this, "product");
  readonly cart = new ModelDelegate<Cart>(this, "cart");
  readonly cartItem = new ModelDelegate<CartItem>(this, "cartItem");
  readonly order = new ModelDelegate<Order>(this, "order");
  readonly orderItem = new ModelDelegate<OrderItem>(this, "orderItem");
  readonly coupon = new ModelDelegate<Coupon>(this, "coupon");
  readonly listing = new ModelDelegate<Listing>(this, "listing");
  readonly listingOffer = new ModelDelegate<ListingOffer>(this, "listingOffer");
  readonly marketplaceOrder = new ModelDelegate<MarketplaceOrder>(this, "marketplaceOrder");
  readonly trade = new ModelDelegate<Trade>(this, "trade");
  readonly pricePoint = new ModelDelegate<PricePoint>(this, "pricePoint");
  readonly sellerReview = new ModelDelegate<SellerReview>(this, "sellerReview");
  readonly productReview = new ModelDelegate<ProductReview>(this, "productReview");
  readonly shipment = new ModelDelegate<Shipment>(this, "shipment");
  readonly shipmentEvent = new ModelDelegate<ShipmentEvent>(this, "shipmentEvent");
  readonly collectionItem = new ModelDelegate<CollectionItem>(this, "collectionItem");
  readonly notification = new ModelDelegate<Notification>(this, "notification");
  readonly newsPost = new ModelDelegate<NewsPost>(this, "newsPost");
  readonly platformSetting = new ModelDelegate<PlatformSetting>(this, "platformSetting");

  constructor(private readonly parentTxState: TxState | null = null) {
    this.txState = parentTxState;
    for (const model of ALL_MODELS) {
      this.repos.set(model, new JsonRepository<JsonRecord>(dataFilePath(MODEL_FILES[model])));
    }
  }

  async $connect(): Promise<void> {
    if (this.bootstrapped) return;
    await bootstrapJsonData();
    this.bootstrapped = true;
  }

  async $disconnect(): Promise<void> {
    return;
  }

  async $executeRaw(_query: TemplateStringsArray | string, ..._values: unknown[]): Promise<number> {
    return 0;
  }

  async $transaction<T>(fn: (tx: JsonClient) => Promise<T>): Promise<T>;
  async $transaction<T extends readonly unknown[] | []>(promises: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
  async $transaction(arg: unknown): Promise<unknown> {
    if (typeof arg === "function") {
      return this.globalLock.runExclusive(async () => {
        const txState: TxState = { overlays: new Map(), dirty: new Set() };
        const tx = new JsonClient(txState);
        try {
          const result = await (arg as (tx: JsonClient) => Promise<unknown>)(tx);
          await tx.flushTx();
          return result;
        } catch (err) {
          txState.overlays.clear();
          txState.dirty.clear();
          throw err;
        }
      });
    }
    return this.globalLock.runExclusive(() => Promise.all(arg as Promise<unknown>[]));
  }

  runRead<T>(task: () => Promise<T>): Promise<T> {
    if (this.txState) return task();
    if (this.lockDepth > 0) return task();
    return this.globalLock.runExclusive(async () => {
      this.lockDepth += 1;
      try {
        return await task();
      } finally {
        this.lockDepth -= 1;
      }
    });
  }

  runWrite<T>(task: () => Promise<T>): Promise<T> {
    if (this.txState) return task();
    if (this.lockDepth > 0) return task();
    return this.globalLock.runExclusive(async () => {
      this.lockDepth += 1;
      try {
        return await task();
      } finally {
        this.lockDepth -= 1;
      }
    });
  }

  async readModelRaw(model: ModelName): Promise<JsonRecord[]> {
    if (this.txState) {
      if (!this.txState.overlays.has(model)) {
        const rows = await this.repos.get(model)!.readAll();
        this.txState.overlays.set(model, structuredClone(rows));
      }
      return structuredClone(this.txState.overlays.get(model)!);
    }
    return this.repos.get(model)!.readAll();
  }

  async writeModelRaw(model: ModelName, rows: JsonRecord[]): Promise<void> {
    if (this.txState) {
      this.txState.overlays.set(model, structuredClone(rows));
      this.txState.dirty.add(model);
      return;
    }
    await this.repos.get(model)!.writeAll(rows);
  }

  async flushTx(): Promise<void> {
    if (!this.txState) return;
    for (const model of this.txState.dirty) {
      const rows = this.txState.overlays.get(model);
      if (rows) await this.repos.get(model)!.writeAll(rows);
    }
    this.txState.dirty.clear();
  }

  hydrateRecord(model: ModelName, record: Record<string, unknown>): Record<string, unknown> {
    const dateFields = DATE_FIELDS[model] ?? [];
    return hydrateDates(record, dateFields);
  }

  serializeRecord(model: ModelName, record: Record<string, unknown>): Record<string, unknown> {
    const dateFields = DATE_FIELDS[model] ?? [];
    return serializeDates(record, dateFields);
  }

  async findUniqueInternal(model: ModelName, args: { where: Record<string, unknown> }) {
    return this.getDelegate(model).findUnique(args);
  }

  getDelegate(model: ModelName): ModelDelegate {
    return this[modelToDelegate(model)] as unknown as ModelDelegate;
  }

  async processNestedCreates(
    parentModel: ModelName,
    parentRecord: Record<string, unknown>,
    nested: Record<string, { create?: unknown; createMany?: unknown }>,
  ): Promise<void> {
    for (const [relationName, op] of Object.entries(nested)) {
      const rel = RELATIONS[parentModel]?.[relationName];
      if (!rel || rel.kind !== "one-to-many") continue;

      const creates = op.createMany
        ? (op.createMany as { data: Record<string, unknown>[] }).data
        : op.create
          ? [op.create as Record<string, unknown>]
          : [];

      for (const item of creates) {
        const fkValue =
          rel.reverse && (rel.fk === "orderId" || rel.fk === "marketplaceOrderId")
            ? parentRecord.id
            : parentRecord.id;
        await this.getDelegate(rel.model).create({
          data: { ...item, [rel.fk]: fkValue },
        });
      }
    }
  }
}

function modelToDelegate(model: ModelName): keyof JsonClient {
  return model as keyof JsonClient;
}

export { JsonClient as PrismaClient };
