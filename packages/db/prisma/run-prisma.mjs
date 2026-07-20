import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "../../../.env");
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, ["--env-file", rootEnv, "node_modules/prisma/build/index.js", ...args], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  shell: false,
});

process.exit(result.status ?? 1);
