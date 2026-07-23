import path from "node:path";
import { fileURLToPath } from "node:url";

/** Package root: backend/ (stable regardless of process.cwd()) */
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function getDataDir(): string {
  const custom = process.env.CARDVERSE_DATA_DIR;
  if (custom && custom.trim()) return path.resolve(custom);
  return path.resolve(packageRoot, "../data");
}

export function dataFilePath(fileName: string): string {
  return path.join(getDataDir(), fileName);
}
