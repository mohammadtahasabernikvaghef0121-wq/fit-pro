import { spawn } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

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
