import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AsyncLock } from "./async-lock";

export type JsonRecord = Record<string, unknown> & { id: string };

type CreateInput<T extends JsonRecord> = Omit<T, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

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

  async readAll(): Promise<T[]> {
    await this.ensureFile();
    return this.readUnsafe();
  }

  async replaceAll(records: readonly T[]): Promise<void> {
    await this.lock.runExclusive(async () => {
      await this.writeUnsafe(records);
    });
  }

  async writeAll(records: readonly T[]): Promise<void> {
    await this.replaceAll(records);
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
}

export type { CreateInput };
