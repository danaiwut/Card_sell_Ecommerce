import path from "node:path";

/** packages/db/ */
const packageRoot = path.resolve(__dirname, "..");

export function getDataDir(): string {
  const custom = process.env.CARDVERSE_DATA_DIR;
  if (custom && custom.trim()) return path.resolve(custom);
  return path.resolve(packageRoot, "../../data");
}

export function dataFilePath(fileName: string): string {
  return path.join(getDataDir(), fileName);
}
