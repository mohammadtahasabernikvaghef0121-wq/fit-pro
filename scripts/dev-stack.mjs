import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const root = process.cwd();
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, [path.join(root, "node_modules", "prisma", "build", "index.js"), "migrate", "deploy"]);
run(process.execPath, [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), "prisma/seed.ts"]);

const nextArgs = ["node_modules/next/dist/bin/next", "dev"];
if (process.env.FIT_PRO_NEXT_PORT) nextArgs.push("--port", process.env.FIT_PRO_NEXT_PORT);
const children = [
  spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "src/server/express.ts"], { stdio: "inherit", env: process.env }),
  spawn(process.execPath, nextArgs, { stdio: "inherit", env: process.env }),
];
let stopping = false;
function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill(signal);
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop(signal));
for (const child of children) {
  child.on("error", (error) => { console.error("Could not start Fit Pro service:", error.message); stop(); process.exitCode = 1; });
  child.on("exit", (code) => { if (!stopping) { process.exitCode = code ?? 1; stop(); } });
}
