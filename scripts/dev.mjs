import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await mkdir(path.join(root, ".data"), { recursive: true });
const databasePath = process.env.FIT_PRO_DB_PATH?.trim() || ".data/fit-pro-postgres-test";

const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules", "@electric-sql", "pglite-socket", "dist", "scripts", "server.js"),
    `--db=${databasePath}`,
    "--port=51214",
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
