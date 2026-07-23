/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JsonClient } from "./json-client";
import type { JsonRecord } from "./json-repository";
import type { JsonResult } from "./models";
import type { ModelName } from "./schema";
import { DATE_FIELDS, MODEL_DEFAULTS } from "./schema";
import { hydrateDates, serializeDates } from "./dates";
import { newId } from "./id";
import { applyResultShape, type IncludeArgs, type IncludeInput, type SelectInput } from "./include";
import { matchWhere, recordMatchesUnique, sortRecords } from "./where";

type QueryArgs = {
  where?: Record<string, unknown>;
  include?: IncludeInput;
  select?: SelectInput;
  orderBy?: Record<string, "asc" | "desc" | undefined> | Array<Record<string, "asc" | "desc" | undefined>>;
  skip?: number;
  take?: number;
};

export class ModelDelegate<T = JsonResult<Record<string, unknown>>> {
  constructor(
    private readonly client: JsonClient,
    private readonly model: ModelName,
  ) {}

  findUnique(args: QueryArgs & { where: Record<string, unknown> }): Promise<JsonResult<T> | null> {
    return this.client.runRead(async () => {
      const rows = await this.client.readModelRaw(this.model);
      const hit = rows.find((row) => recordMatchesUnique(this.model, row, args.where));
      if (!hit) return null;
      const hydrated = this.client.hydrateRecord(this.model, hit);
      const [shaped] = await applyResultShape(this.client, this.model, [hydrated], args);
      return shaped as JsonResult<T>;
    }) as Promise<JsonResult<T> | null>;
  }

  findFirst(args: QueryArgs = {}): Promise<JsonResult<T> | null> {
    return this.findMany({ ...args, take: 1 }).then((rows) => rows[0] ?? null);
  }

  findMany(args: QueryArgs = {}): Promise<JsonResult<T>[]> {
    return this.client.runRead(async () => {
      let rows = await this.client.readModelRaw(this.model);
      const filtered: Record<string, unknown>[] = [];
      for (const row of rows) {
        if (await matchWhere(this.client, this.model, row, args.where)) filtered.push(row);
      }
      rows = sortRecords(filtered, args.orderBy) as JsonRecord[];
      if (args.skip) rows = rows.slice(args.skip);
      if (args.take != null) rows = rows.slice(0, args.take);
      const hydrated = rows.map((row) => this.client.hydrateRecord(this.model, row));
      return applyResultShape(this.client, this.model, hydrated, args) as Promise<JsonResult<T>[]>;
    }) as Promise<JsonResult<T>[]>;
  }

  create(args: { data: Record<string, unknown>; include?: IncludeInput; select?: SelectInput }): Promise<JsonResult<T>> {
    return this.client.runWrite(async () => {
      const rows = await this.client.readModelRaw(this.model);
      const now = new Date().toISOString();
      const dateFields = DATE_FIELDS[this.model] ?? [];
      const defaults = MODEL_DEFAULTS[this.model] ?? {};

      const { nested, flat } = splitNestedData(args.data);
      const record: Record<string, unknown> = serializeDates(
        {
          ...defaults,
          ...flat,
          id: (flat.id as string | undefined) ?? newId(),
          ...(dateFields.includes("createdAt") ? { createdAt: now } : {}),
          ...(dateFields.includes("updatedAt") ? { updatedAt: now } : {}),
        },
        dateFields,
      );

      rows.push(record as JsonRecord);
      await this.client.writeModelRaw(this.model, rows as JsonRecord[]);
      await this.client.processNestedCreates(this.model, record, nested);

      const hydrated = this.client.hydrateRecord(this.model, record);
      const [shaped] = await applyResultShape(this.client, this.model, [hydrated], args);
      return shaped as JsonResult<T>;
    }) as Promise<JsonResult<T>>;
  }

  createMany(args: { data: Record<string, unknown>[]; skipDuplicates?: boolean }): Promise<{ count: number }> {
    return this.client.runWrite(async () => {
      let count = 0;
      for (const item of args.data) {
        try {
          await this.create({ data: item });
          count += 1;
        } catch (err) {
          if (!args.skipDuplicates) throw err;
        }
      }
      return { count };
    });
  }

  update(args: { where: Record<string, unknown>; data: Record<string, unknown>; include?: IncludeInput }): Promise<JsonResult<T>> {
    return this.client.runWrite(async () => {
      const rows = await this.client.readModelRaw(this.model);
      const index = rows.findIndex((row) => recordMatchesUnique(this.model, row, args.where));
      if (index < 0) throw new Error(`${this.model} record not found`);
      const current = rows[index];
      const { nested, flat } = splitNestedData(args.data);
      const updated = this.applyPatch(current, flat);
      rows[index] = updated as JsonRecord;
      await this.client.writeModelRaw(this.model, rows as JsonRecord[]);
      await this.client.processNestedCreates(this.model, updated, nested);

      const hydrated = this.client.hydrateRecord(this.model, updated);
      const [shaped] = await applyResultShape(this.client, this.model, [hydrated], args);
      return shaped as JsonResult<T>;
    }) as Promise<JsonResult<T>>;
  }

  updateMany(args: { where?: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }> {
    return this.client.runWrite(async () => {
      const rows = await this.client.readModelRaw(this.model);
      let count = 0;
      const next = await Promise.all(
        rows.map(async (row) => {
          if (!(await matchWhere(this.client, this.model, row, args.where))) return row;
          count += 1;
          const { flat } = splitNestedData(args.data);
          return this.applyPatch(row, flat);
        }),
      );
      await this.client.writeModelRaw(this.model, next as JsonRecord[]);
      return { count };
    });
  }

  delete(args: { where: Record<string, unknown> }): Promise<JsonResult<T>> {
    return this.client.runWrite(async () => {
      const rows = await this.client.readModelRaw(this.model);
      const index = rows.findIndex((row) => recordMatchesUnique(this.model, row, args.where));
      if (index < 0) throw new Error(`${this.model} record not found`);
      const [removed] = rows.splice(index, 1);
      await this.client.writeModelRaw(this.model, rows);
      return this.client.hydrateRecord(this.model, removed) as JsonResult<T>;
    }) as Promise<JsonResult<T>>;
  }

  deleteMany(args: { where?: Record<string, unknown> }): Promise<{ count: number }> {
    return this.client.runWrite(async () => {
      const rows = await this.client.readModelRaw(this.model);
      const kept: Record<string, unknown>[] = [];
      let count = 0;
      for (const row of rows) {
        if (await matchWhere(this.client, this.model, row, args.where)) {
          count += 1;
        } else {
          kept.push(row);
        }
      }
      await this.client.writeModelRaw(this.model, kept as JsonRecord[]);
      return { count };
    });
  }

  count(args: { where?: Record<string, unknown> } = {}): Promise<number> {
    return this.findMany({ where: args.where }).then((rows) => rows.length);
  }

  upsert(args: {
    where: Record<string, unknown>;
    create: Record<string, unknown>;
    update: Record<string, unknown>;
    include?: IncludeInput;
  }): Promise<JsonResult<T>> {
    return this.client.runWrite(async () => {
      const rows = await this.client.readModelRaw(this.model);
      const index = rows.findIndex((row) => recordMatchesUnique(this.model, row, args.where));
      if (index >= 0) {
        const current = rows[index];
        const { nested, flat } = splitNestedData(args.update);
        const updated = this.applyPatch(current, flat);
        rows[index] = updated as JsonRecord;
        await this.client.writeModelRaw(this.model, rows as JsonRecord[]);
        await this.client.processNestedCreates(this.model, updated, nested);
        const hydrated = this.client.hydrateRecord(this.model, updated);
        const [shaped] = await applyResultShape(this.client, this.model, [hydrated], args);
        return shaped as JsonResult<T>;
      }
      return this.create({ data: { ...args.create, ...flattenWhere(args.where) }, include: args.include });
    }) as Promise<JsonResult<T>>;
  }

  aggregate(args: {
    where?: Record<string, unknown>;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
    _count?: boolean | Record<string, boolean>;
  }): Promise<any> {
    return this.findMany({ where: args.where }).then((rows) => {
      const result: Record<string, unknown> = {};
      if (args._count === true) {
        result._count = rows.length;
      } else if (args._count && typeof args._count === "object") {
        result._count = {};
        for (const [field, enabled] of Object.entries(args._count)) {
          if (!enabled) continue;
          (result._count as Record<string, number>)[field] = rows.filter((r) => r[field] != null).length;
        }
      }
      if (args._sum) {
        result._sum = {};
        for (const [field, enabled] of Object.entries(args._sum)) {
          if (!enabled) continue;
          (result._sum as Record<string, number | null>)[field] = rows.reduce(
            (sum, row) => sum + Number(row[field] ?? 0),
            0,
          );
        }
      }
      if (args._avg) {
        result._avg = {};
        for (const [field, enabled] of Object.entries(args._avg)) {
          if (!enabled) continue;
          const nums = rows.map((r) => Number(r[field])).filter((n) => !Number.isNaN(n));
          (result._avg as Record<string, number | null>)[field] =
            nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
        }
      }
      return result;
    });
  }

  private applyPatch(current: Record<string, unknown>, data: Record<string, unknown>): Record<string, unknown> {
    const dateFields = DATE_FIELDS[this.model] ?? [];
    const next = { ...current };
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        const op = value as Record<string, unknown>;
        if ("increment" in op) {
          next[key] = Number(next[key] ?? 0) + Number(op.increment);
          continue;
        }
        if ("decrement" in op) {
          next[key] = Number(next[key] ?? 0) - Number(op.decrement);
          continue;
        }
        if ("multiply" in op) {
          next[key] = Number(next[key] ?? 0) * Number(op.multiply);
          continue;
        }
        if ("divide" in op) {
          next[key] = Number(next[key] ?? 0) / Number(op.divide);
          continue;
        }
        if ("set" in op) {
          next[key] = op.set;
          continue;
        }
      }
      next[key] = value instanceof Date ? value.toISOString() : value;
    }
    if (dateFields.includes("updatedAt")) {
      next.updatedAt = new Date().toISOString();
    }
    return serializeDates(next, dateFields);
  }
}

function splitNestedData(data: Record<string, unknown>) {
  const nested: Record<string, { create?: unknown; createMany?: unknown }> = {};
  const flat: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      const obj = value as Record<string, unknown>;
      if ("create" in obj || "createMany" in obj) {
        nested[key] = obj as { create?: unknown; createMany?: unknown };
        continue;
      }
    }
    flat[key] = value;
  }
  return { nested, flat };
}

function flattenWhere(where: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(where)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(out, value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export { splitNestedData };
