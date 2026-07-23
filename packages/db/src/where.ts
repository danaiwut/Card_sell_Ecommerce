import { dayKey } from "./dates";
import type { JsonClient } from "./json-client";
import type { ModelName, RelationDef } from "./schema";
import { NESTED_FILTER_RELATIONS, RELATIONS } from "./schema";

export type WhereInput = Record<string, unknown>;

function compareValues(field: string, actual: unknown, expected: unknown): boolean {
  if (expected === undefined) return true;
  if (expected === null) return actual === null || actual === undefined;

  if (typeof expected === "object" && expected !== null && !Array.isArray(expected)) {
    const filter = expected as Record<string, unknown>;
    if ("equals" in filter) return compareValues(field, actual, filter.equals);
    if ("in" in filter && Array.isArray(filter.in)) {
      return filter.in.some((v) => compareValues(field, actual, v));
    }
    if ("notIn" in filter && Array.isArray(filter.notIn)) {
      return !filter.notIn.some((v) => compareValues(field, actual, v));
    }
    if ("gte" in filter) {
      const a = coerceComparable(actual);
      const b = coerceComparable(filter.gte);
      return a !== null && b !== null && a >= b;
    }
    if ("gt" in filter) {
      const a = coerceComparable(actual);
      const b = coerceComparable(filter.gt);
      return a !== null && b !== null && a > b;
    }
    if ("lte" in filter) {
      const a = coerceComparable(actual);
      const b = coerceComparable(filter.lte);
      return a !== null && b !== null && a <= b;
    }
    if ("lt" in filter) {
      const a = coerceComparable(actual);
      const b = coerceComparable(filter.lt);
      return a !== null && b !== null && a < b;
    }
    if ("not" in filter) return !compareValues(field, actual, filter.not);
    if ("contains" in filter) {
      return String(actual ?? "")
        .toLowerCase()
        .includes(String(filter.contains).toLowerCase());
    }
    if ("startsWith" in filter) {
      return String(actual ?? "")
        .toLowerCase()
        .startsWith(String(filter.startsWith).toLowerCase());
    }
    if ("endsWith" in filter) {
      return String(actual ?? "")
        .toLowerCase()
        .endsWith(String(filter.endsWith).toLowerCase());
    }
    if ("mode" in filter && "equals" in filter) {
      return compareValues(field, actual, filter.equals);
    }
  }

  if (field === "day" && (actual instanceof Date || typeof actual === "string")) {
    const actualDay = dayKey(actual as Date | string);
    const expectedDay =
      expected instanceof Date ? dayKey(expected) : typeof expected === "string" ? dayKey(expected) : String(expected);
    return actualDay === expectedDay;
  }

  if (actual instanceof Date && (expected instanceof Date || typeof expected === "string")) {
    return actual.getTime() === new Date(expected as string | Date).getTime();
  }

  return actual === expected;
}

function coerceComparable(value: unknown): number | string | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const t = Date.parse(value);
    if (!Number.isNaN(t) && /^\d{4}-\d{2}-\d{2}/.test(value)) return t;
    return value;
  }
  return null;
}

function matchScalarWhere(record: Record<string, unknown>, where: WhereInput): boolean {
  for (const [key, value] of Object.entries(where)) {
    if (key === "AND" && Array.isArray(value)) {
      if (!value.every((part) => matchScalarWhere(record, part as WhereInput))) return false;
      continue;
    }
    if (key === "OR" && Array.isArray(value)) {
      if (!value.some((part) => matchScalarWhere(record, part as WhereInput))) return false;
      continue;
    }
    if (key === "NOT") {
      if (matchScalarWhere(record, value as WhereInput)) return false;
      continue;
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value) && !isOperatorObject(value)) {
      continue;
    }
    if (!compareValues(key, record[key], value)) return false;
  }
  return true;
}

function isOperatorObject(value: object): boolean {
  const keys = Object.keys(value);
  const ops = new Set([
    "equals",
    "in",
    "notIn",
    "gte",
    "gt",
    "lte",
    "lt",
    "not",
    "contains",
    "startsWith",
    "endsWith",
    "mode",
  ]);
  return keys.some((k) => ops.has(k));
}

export async function matchWhere(
  client: JsonClient,
  model: ModelName,
  record: Record<string, unknown>,
  where?: WhereInput,
): Promise<boolean> {
  if (!where) return true;

  for (const [key, value] of Object.entries(where)) {
    if (key === "AND" && Array.isArray(value)) {
      for (const part of value) {
        if (!(await matchWhere(client, model, record, part as WhereInput))) return false;
      }
      continue;
    }
    if (key === "OR" && Array.isArray(value)) {
      const any = await Promise.all(
        (value as WhereInput[]).map((part) => matchWhere(client, model, record, part)),
      );
      if (!any.some(Boolean)) return false;
      continue;
    }
    if (key === "NOT") {
      if (await matchWhere(client, model, record, value as WhereInput)) return false;
      continue;
    }

    const nestedFilters = NESTED_FILTER_RELATIONS[model];
    if (nestedFilters?.[key] && typeof value === "object" && value !== null) {
      const rel = nestedFilters[key];
      const fk = record[rel.fk];
      if (typeof fk !== "string") return false;
      const related = await client.findUniqueInternal(rel.model, { where: { id: fk } });
      if (!related) return false;
      if (!(await matchWhere(client, rel.model, related, value as WhereInput))) return false;
      continue;
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value) && !isOperatorObject(value)) {
      continue;
    }

    if (!compareValues(key, record[key], value)) return false;
  }

  return matchScalarWhere(record, where);
}

export function resolveUniqueWhere(
  model: ModelName,
  where: WhereInput,
): { fields: readonly string[]; values: unknown[] } | null {
  for (const [name, fields] of Object.entries(where)) {
    if (typeof where[name] === "object" && where[name] !== null && !Array.isArray(where[name])) {
      const composite = where[name] as Record<string, unknown>;
      const values = fields as unknown as string[];
      if (Array.isArray(fields)) {
        return {
          fields,
          values: (fields as readonly string[]).map((f) => composite[f]),
        };
      }
    }
  }

  for (const [field, value] of Object.entries(where)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { fields: [field], values: [value] };
    }
  }

  return null;
}

export function recordMatchesUnique(
  _model: ModelName,
  record: Record<string, unknown>,
  where: WhereInput,
): boolean {
  for (const [, expected] of Object.entries(where)) {
    if (typeof expected === "object" && expected !== null && !Array.isArray(expected) && !isOperatorObject(expected)) {
      for (const [field, val] of Object.entries(expected as Record<string, unknown>)) {
        if (!compareValues(field, record[field], val)) return false;
      }
      continue;
    }
  }

  for (const [field, expected] of Object.entries(where)) {
    if (typeof expected === "object" && expected !== null && !Array.isArray(expected)) {
      if (isOperatorObject(expected)) {
        if (!compareValues(field, record[field], expected)) return false;
      }
      continue;
    }
    if (!compareValues(field, record[field], expected)) return false;
  }
  return true;
}

export function sortRecords(
  records: Record<string, unknown>[],
  orderBy?: Record<string, "asc" | "desc" | undefined> | Array<Record<string, "asc" | "desc" | undefined>>,
): Record<string, unknown>[] {
  if (!orderBy) return records;
  const rules = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...records].sort((a, b) => {
    for (const rule of rules) {
      for (const [field, direction] of Object.entries(rule)) {
        const left = a[field];
        const right = b[field];
        if (left === right) continue;
        if (left == null) return direction === "asc" ? -1 : 1;
        if (right == null) return direction === "asc" ? 1 : -1;
        let cmp: number;
        if (typeof left === "boolean" && typeof right === "boolean") {
          cmp = Number(left) - Number(right);
        } else if (left instanceof Date && right instanceof Date) {
          cmp = left.getTime() - right.getTime();
        } else if (typeof left === "number" && typeof right === "number") {
          cmp = left - right;
        } else {
          cmp = String(left).localeCompare(String(right), "en", { numeric: true, sensitivity: "base" });
        }
        if (cmp !== 0) return direction === "asc" ? cmp : -cmp;
      }
    }
    return 0;
  });
}

export function getRelation(model: ModelName, name: string): RelationDef | undefined {
  return RELATIONS[model]?.[name];
}
