import path from "node:path";

/** packages/db/ */
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "../..");

export function getDataDir(): string {
  const custom = process.env.CARDVERSE_DATA_DIR;
  if (custom && custom.trim()) {
    const trimmed = custom.trim();
    return path.isAbsolute(trimmed) ? trimmed : path.resolve(repoRoot, trimmed);
  }
  return path.resolve(repoRoot, "data");
}

export function dataFilePath(fileName: string): string {
  return path.join(getDataDir(), fileName);
}
