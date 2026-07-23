import type { JsonClient } from "./json-client";
import type { ModelName, RelationDef } from "./schema";
import { RELATIONS } from "./schema";
import { sortRecords } from "./where";

export type IncludeInput = Record<string, boolean | IncludeArgs>;
export type SelectInput = Record<string, boolean | SelectArgs>;

export interface IncludeArgs {
  include?: IncludeInput;
  select?: SelectInput;
  orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;
  where?: Record<string, unknown>;
  take?: number;
}

export interface SelectArgs {
  select?: SelectInput;
}

export async function applyInclude(
  client: JsonClient,
  model: ModelName,
  record: Record<string, unknown>,
  include?: IncludeInput,
  select?: SelectInput,
): Promise<Record<string, unknown>> {
  let result = { ...record };

  if (select) {
    result = applySelect(result, select);
  }

  if (!include) return result;

  for (const [key, spec] of Object.entries(include)) {
    if (key === "_count") {
      result._count = await applyCount(client, model, record, spec as { select?: Record<string, boolean> });
      continue;
    }

    const rel = RELATIONS[model]?.[key];
    if (!rel) continue;

    const args = spec === true ? {} : (spec as IncludeArgs);
    const related = await loadRelation(client, rel, record, args);
    result[key] = related;
  }

  return result;
}

async function applyCount(
  client: JsonClient,
  model: ModelName,
  record: Record<string, unknown>,
  spec: { select?: Record<string, boolean> },
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const selections = spec.select ?? {};
  for (const [field, enabled] of Object.entries(selections)) {
    if (!enabled) continue;
    const rel = RELATIONS[model]?.[field];
    if (!rel) {
      counts[field] = 0;
      continue;
    }
    const rows = await loadRelationRows(client, rel, record, {});
    counts[field] = rows.length;
  }
  return counts;
}

function applySelect(record: Record<string, unknown>, select: SelectInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(select)) {
    if (spec === true) {
      out[key] = record[key];
    } else if (typeof spec === "object" && spec.select) {
      const nested = record[key];
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        out[key] = applySelect(nested as Record<string, unknown>, spec.select);
      }
    }
  }
  return out;
}

async function loadRelation(
  client: JsonClient,
  rel: RelationDef,
  record: Record<string, unknown>,
  args: IncludeArgs,
): Promise<unknown> {
  const rows = await loadRelationRows(client, rel, record, args);

  if (rel.kind === "many-to-one") {
    const row = rows[0] ?? null;
    if (!row) return null;
    return applyInclude(client, rel.model, row, args.include, args.select);
  }

  if (rel.kind === "one-to-one") {
    const row = rows[0] ?? null;
    if (!row) return null;
    return applyInclude(client, rel.model, row, args.include, args.select);
  }

  let list = rows;
  if (args.orderBy) list = sortRecords(list, args.orderBy);
  if (args.take != null) list = list.slice(0, args.take);

  const mapped = await Promise.all(
    list.map((row) => applyInclude(client, rel.model, row, args.include, args.select)),
  );
  return mapped;
}

async function loadRelationRows(
  client: JsonClient,
  rel: RelationDef,
  record: Record<string, unknown>,
  args: IncludeArgs,
): Promise<Record<string, unknown>[]> {
  const all = await client.readModelRaw(rel.model);

  if (rel.reverse) {
    let rows = all.filter((row) => row[rel.fk] === record.id);
    if (args.where) {
      rows = rows.filter((row) => matchSimpleWhere(row, args.where!));
    }
    return rows;
  }

  if (rel.kind === "many-to-one" || rel.kind === "one-to-one") {
    const fk = record[rel.fk];
    if (typeof fk !== "string") return [];
    const row = all.find((r) => r.id === fk);
    return row ? [row] : [];
  }

  let rows = all.filter((row) => row[rel.fk] === record.id);
  if (args.where) {
    rows = rows.filter((row) => matchSimpleWhere(row, args.where!));
  }
  return rows;
}

function matchSimpleWhere(record: Record<string, unknown>, where: Record<string, unknown>): boolean {
  for (const [key, expected] of Object.entries(where)) {
    if (typeof expected === "object" && expected !== null && "in" in (expected as object)) {
      const list = (expected as { in: unknown[] }).in;
      if (!list.includes(record[key])) return false;
    } else if (record[key] !== expected) {
      return false;
    }
  }
  return true;
}

export async function applyResultShape(
  client: JsonClient,
  model: ModelName,
  records: Record<string, unknown>[],
  args: { include?: IncludeInput; select?: SelectInput },
): Promise<Record<string, unknown>[]> {
  return Promise.all(records.map((r) => applyInclude(client, model, r, args.include, args.select)));
}
