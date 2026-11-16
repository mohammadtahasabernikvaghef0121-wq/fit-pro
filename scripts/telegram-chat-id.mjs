import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config({ path: ".env.local" });
const token = process.env.TELEGRAM_BOT_TOKEN;
const ownerId = process.env.TELEGRAM_OWNER_USER_ID?.trim();
if (!token) {
  console.error("Add TELEGRAM_BOT_TOKEN to .env.local first.");
  process.exit(1);
}
if (!ownerId || !/^\d+$/.test(ownerId)) {
  console.error("Set your own numeric TELEGRAM_OWNER_USER_ID in .env.local first. Do not use a username or a group ID.");
  process.exit(1);
}

const webhookResponse = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ drop_pending_updates: false }),
  cache: "no-store",
});
const webhookResult = await webhookResponse.json();
if (!webhookResponse.ok || !webhookResult.ok) {
  console.error(`Telegram could not remove the webhook (${webhookResult.error_code ?? webhookResponse.status}): ${webhookResult.description ?? "Unknown error."}`);
  process.exit(1);
}

let response;
try {
  response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
} catch {
  console.error("Could not reach Telegram. Check your internet, VPN, or proxy, then try again.");
  process.exit(1);
}
const result = await response.json();
if (!response.ok || !result.ok) {
  console.error(`Telegram API error (${result.error_code ?? response.status}): ${result.description ?? "Check the bot token and try again."}`);
  process.exit(1);
}

const message = [...(result.result ?? [])].reverse().find((update) => update.message?.chat?.type === "private" && String(update.message?.from?.id) === ownerId);
const chat = message?.message?.chat;
const owner = message?.message?.from;
if (!chat?.id || !owner?.id || String(chat.id) !== ownerId || String(owner.id) !== ownerId) {
  console.error("No private chat found. Open your bot in Telegram, press Start, send /start, then run this command again.");
  process.exit(1);
}

const envPath = ".env.local";
const existing = fs.readFileSync(envPath, "utf8");
const upsert = (source, key, value) => {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^\\s*${key}=.*$`, "m");
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`;
};
const updated = upsert(existing, "TELEGRAM_ADMIN_CHAT_ID", chat.id);
fs.writeFileSync(envPath, updated);
console.log("Verified Telegram owner private chat ID saved to .env.local.");
