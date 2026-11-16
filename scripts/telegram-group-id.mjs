import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config({ path: ".env.local" });
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("Add TELEGRAM_BOT_TOKEN to .env.local first.");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100&allowed_updates=%5B%22message%22%5D`);
const result = await response.json();
if (!response.ok || !result.ok) {
  console.error(`Could not read Telegram updates (${result.error_code ?? response.status}): ${result.description ?? "Check the bot token and stop any other polling process."}`);
  process.exit(1);
}

const chats = new Map();
for (const update of result.result ?? []) {
  const chat = update.message?.chat;
  if (chat && (chat.type === "group" || chat.type === "supergroup")) chats.set(String(chat.id), chat.title || "Private group");
}
if (!chats.size) {
  console.error("No group update found. Add the bot to the private group, send a message there, then run this command again.");
  process.exit(1);
}

const selected = [...chats.entries()].at(-1);
const [chatId, title] = selected;
const envPath = ".env.local";
const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const line = `TELEGRAM_SUPPORT_GROUP_ID=${chatId}`;
const updated = /^\s*TELEGRAM_SUPPORT_GROUP_ID=.*$/m.test(existing)
  ? existing.replace(/^\s*TELEGRAM_SUPPORT_GROUP_ID=.*$/m, line)
  : `${existing.trimEnd()}\n${line}\n`;
fs.writeFileSync(envPath, updated);
console.log(`Saved the group ID for "${title}" to .env.local. The pending Telegram update was not acknowledged.`);
