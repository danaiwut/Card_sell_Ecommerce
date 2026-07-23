import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AsyncLock } from "../utils/async-lock.js";
import type {
  JsonPaginationResult,
  JsonQueryOptions,
  JsonRecord,
  JsonSearchOptions,
  JsonSortByField,
} from "../types/json.js";

type CreateInput<T extends JsonRecord> = Omit<T, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export class JsonRepository<T extends JsonRecord> {
  private readonly lock = new AsyncLock();

  constructor(
    private readonly filePath: string,
    private readonly defaultRecords: readonly T[] = [],
  ) {}

  async seedIfEmpty(records: readonly T[]): Promise<void> {
    await this.lock.runExclusive(async () => {
      await this.ensureFile();
      const existing = await this.readUnsafe();
      if (existing.length > 0) return;
      await this.writeUnsafe(records);
    });
  }

  async create(input: CreateInput<T>): Promise<T> {
    return this.lock.runExclusive(async () => {
      const rows = await this.readUnsafe();
      const now = new Date().toISOString();
      const record = {
        ...input,
        id: input.id ?? randomUUID(),
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      } as T;
      rows.push(record);
      await this.writeUnsafe(rows);
      return record;
    });
  }

  async update(id: string, patch: Partial<Omit<T, "id">>): Promise<T | null> {
    return this.lock.runExclusive(async () => {
      const rows = await this.readUnsafe();
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return null;
      const current = rows[index];
      const updated = {
        ...current,
        ...patch,
        id: current.id,
        updatedAt: new Date().toISOString(),
      } as T;
      rows[index] = updated;
      await this.writeUnsafe(rows);
      return updated;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.lock.runExclusive(async () => {
      const rows = await this.readUnsafe();
      const next = rows.filter((row) => row.id !== id);
      if (next.length === rows.length) return false;
      await this.writeUnsafe(next);
      return true;
    });
  }

  async findById(id: string): Promise<T | null> {
    const rows = await this.readAll();
    return rows.find((row) => row.id === id) ?? null;
  }

  async findAll(options: JsonQueryOptions<T> = {}): Promise<T[]> {
    const rows = await this.readAll();
    return this.applyQuery(rows, options);
  }

  async search(term: string, fields: readonly (keyof T)[]): Promise<T[]> {
    return this.findAll({ search: { term, fields } });
  }

  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    return this.findAll({ filter: predicate });
  }

  async sort(rows: readonly T[], sort: JsonSortByField<T> | ((a: T, b: T) => number)): Promise<T[]> {
    const items = [...rows];
    items.sort(this.createComparator(sort));
    return items;
  }

  pagination(rows: readonly T[], page: number, pageSize: number): JsonPaginationResult<T> {
    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.max(1, Math.floor(pageSize));
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const items = rows.slice(start, start + safePageSize);
    return {
      items,
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }

  async replaceAll(records: readonly T[]): Promise<void> {
    await this.lock.runExclusive(async () => {
      await this.writeUnsafe(records);
    });
  }

  private async readAll(): Promise<T[]> {
    await this.ensureFile();
    return this.readUnsafe();
  }

  private async readUnsafe(): Promise<T[]> {
    const raw = await readFile(this.filePath, "utf8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error(`JSON repository at ${this.filePath} must contain an array`);
    }
    return parsed as T[];
  }

  private async writeUnsafe(records: readonly T[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    await mkdir(dir, { recursive: true });
    const tmpFile = `${this.filePath}.${randomUUID()}.tmp`;
    const content = `${JSON.stringify(records, null, 2)}\n`;
    await writeFile(tmpFile, content, "utf8");
    await rename(tmpFile, this.filePath);
  }

  private async ensureFile(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await mkdir(dir, { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") throw err;
      await this.writeUnsafe(this.defaultRecords);
    }
  }

  private applyQuery(rows: readonly T[], options: JsonQueryOptions<T>): T[] {
    let items = [...rows];
    if (options.search?.term.trim()) {
      const term = options.search.term.trim().toLowerCase();
      items = items.filter((item) =>
        options.search!.fields.some((field) =>
          String(item[field] ?? "").toLowerCase().includes(term),
        ),
      );
    }
    if (options.filter) {
      items = items.filter(options.filter);
    }
    if (options.sort) {
      items.sort(this.createComparator(options.sort));
    }
    return items;
  }

  private createComparator(
    sort: JsonSortByField<T> | ((a: T, b: T) => number),
  ): (a: T, b: T) => number {
    if (typeof sort === "function") return sort;
    const direction = sort.direction ?? "asc";
    return (a, b) => {
      const left = a[sort.field];
      const right = b[sort.field];
      if (left === right) return 0;
      if (left == null) return direction === "asc" ? -1 : 1;
      if (right == null) return direction === "asc" ? 1 : -1;
      const result = String(left).localeCompare(String(right), "en", {
        numeric: true,
        sensitivity: "base",
      });
      return direction === "asc" ? result : -result;
    };
  }
}
