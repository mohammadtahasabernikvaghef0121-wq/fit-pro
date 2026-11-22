import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await mkdir(path.join(root, ".data"), { recursive: true });
const databasePath = process.env.FIT_PRO_DB_PATH?.trim() || ".data/fit-pro-postgres-dev";
const databasePort = process.env.FIT_PRO_DB_PORT?.trim() || "51214";

const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules", "@electric-sql", "pglite-socket", "dist", "scripts", "server.js"),
    `--db=${databasePath}`,
    `--port=${databasePort}`,
    "--host=127.0.0.1",
    "--max-connections=10",
    "--run",
    "node scripts/dev-stack.mjs",
    "--include-database-url",
  ],
  { cwd: root, stdio: "inherit", env: process.env },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("error", (error) => {
  console.error("Could not start the local development database:", error.message);
  process.exitCode = 1;
});

server.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
