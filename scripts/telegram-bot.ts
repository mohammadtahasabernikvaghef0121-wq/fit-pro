import dotenv from "dotenv";
import { isAuthorizedTelegramOwner } from "../src/lib/telegram-auth";

dotenv.config({ path: ".env.local" });
const { db } = await import("../src/lib/db");

type TelegramUser = { id: number; is_bot?: boolean };
type TelegramChat = { id: number; type: string };
type TelegramMessage = { message_id: number; chat: TelegramChat; from?: TelegramUser; text?: string };
type TelegramUpdate = { update_id: number; message?: TelegramMessage };

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const ownerId = process.env.TELEGRAM_OWNER_USER_ID?.trim();
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
if (!token || !ownerId || !adminChatId || !/^\d+$/.test(ownerId) || adminChatId !== ownerId) {
  console.error("Configure TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_USER_ID, and TELEGRAM_ADMIN_CHAT_ID (the same positive numeric private chat ID) in .env.local.");
  process.exit(1);
}

const ownerUserId = Number(ownerId);
const ownerChatId = Number(adminChatId);
const api = `https://api.telegram.org/bot${token}`;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function telegram<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${api}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(40_000),
  });
  const result = await response.json() as { ok: boolean; result: T; description?: string };
  if (!response.ok || !result.ok) throw new Error(result.description || `Telegram API returned ${response.status}`);
  return result.result;
}

const help = [
  "Fit Pro · پنل خصوصی مالک",
  "/pending — درخواست‌های تلگرامی باز",
  "/status <شناسه> — وضعیت درخواست",
  "/reply <شناسه> <پاسخ> — پاسخ به درخواست تلگرامی",
  "/close <شناسه> — بستن درخواست",
  "گفت‌وگوهای پشتیبانی وب‌سایت فقط از پنل خصوصی /admin/support پاسخ داده می‌شوند.",
].join("\n");

function isOwner(message: TelegramMessage) {
  return message.chat.type === "private" && !message.from?.is_bot && isAuthorizedTelegramOwner(message.from?.id, message.chat.id, ownerUserId, ownerChatId);
}

async function handleOwnerMessage(message: TelegramMessage) {
  const text = message.text?.trim() || "";
  if (!text.startsWith("/")) {
    await telegram("sendMessage", { chat_id: ownerChatId, text: "برای دیدن فرمان‌های پنل خصوصی /help را بفرستید." });
    return;
  }
  const [rawCommand, ...args] = text.split(/\s+/);
  const command = rawCommand.split("@")[0].toLowerCase();
  if (command === "/start" || command === "/help") {
    await telegram("sendMessage", { chat_id: ownerChatId, text: help });
    return;
  }
  if (command === "/pending") {
    const requests = await db.supportRequest.findMany({
      where: { source: "TELEGRAM", status: { in: ["PENDING", "IN_PROGRESS"] } },
      orderBy: { createdAt: "asc" }, take: 30,
    });
    const body = requests.length
      ? requests.map((item) => `#${item.requestNumber} · ${item.status} · ${item.firstName} · ${item.messageText?.slice(0, 100) || "[رسانه]"}`).join("\n")
      : "درخواست تلگرامی بازی وجود ندارد.";
    await telegram("sendMessage", { chat_id: ownerChatId, text: body.slice(0, 3900) });
    return;
  }
  if (!["/status", "/reply", "/close"].includes(command)) {
    await telegram("sendMessage", { chat_id: ownerChatId, text: "فرمان شناخته نشد. /help را ببینید." });
    return;
  }
  const requestNumber = Number(args[0]);
  if (!Number.isSafeInteger(requestNumber) || requestNumber < 1) {
    await telegram("sendMessage", { chat_id: ownerChatId, text: "شناسه درخواست معتبر نیست. نمونه: /status 123" });
    return;
  }
  const request = await db.supportRequest.findUnique({ where: { requestNumber } });
  if (!request || request.source !== "TELEGRAM") {
    await telegram("sendMessage", { chat_id: ownerChatId, text: `درخواست تلگرامی #${requestNumber} پیدا نشد.` });
    return;
  }
  if (command === "/status") {
    await telegram("sendMessage", { chat_id: ownerChatId, text: `درخواست #${requestNumber}\nوضعیت: ${request.status}\nنام: ${request.firstName}\nپیام: ${(request.messageText || "[رسانه]").slice(0, 1200)}` });
    return;
  }
  if (command === "/close") {
    await db.supportRequest.update({ where: { id: request.id }, data: { status: "CLOSED", closedAt: new Date() } });
    if (request.telegramChatId) await telegram("sendMessage", { chat_id: request.telegramChatId, text: `درخواست #${requestNumber} در Fit Pro بسته شد.` });
    await telegram("sendMessage", { chat_id: ownerChatId, text: `درخواست #${requestNumber} بسته شد.` });
    return;
  }
  const answer = args.slice(1).join(" ").trim();
  if (!answer || !request.telegramChatId) {
    await telegram("sendMessage", { chat_id: ownerChatId, text: "متن پاسخ یا مسیر پاسخ به کاربر موجود نیست. نمونه: /reply 123 پاسخ شما…" });
    return;
  }
  await telegram("sendMessage", { chat_id: request.telegramChatId, text: `پاسخ Fit Pro درباره درخواست #${requestNumber}:\n\n${answer}` });
  await db.supportReply.create({ data: { requestId: request.id, adminTelegramUserId: String(ownerUserId), text: answer, isAdmin: true } });
  await db.supportRequest.update({ where: { id: request.id }, data: { status: "REPLIED", closedAt: null } });
  await telegram("sendMessage", { chat_id: ownerChatId, text: `پاسخ درخواست #${requestNumber} برای کاربر فرستاده شد.` });
}

let offset: number | undefined;
let backoff = 1000;
console.log("Fit Pro private owner bot started.");
await telegram("deleteWebhook", { drop_pending_updates: false });
while (true) {
  try {
    const updates = await telegram<TelegramUpdate[]>("getUpdates", {
      ...(offset === undefined ? {} : { offset }), timeout: 30, limit: 50, allowed_updates: ["message"],
    });
    for (const update of updates) {
      const message = update.message;
      if (message && isOwner(message)) {
        try { await handleOwnerMessage(message); }
        catch (error) { console.error("Owner command failed", error instanceof Error ? error.message : "unknown error"); }
      }
      // Updates from everyone except the configured owner are deliberately ignored without a reply.
      offset = update.update_id + 1;
    }
    backoff = 1000;
  } catch (error) {
    console.error(`Telegram bot polling error: ${error instanceof Error ? error.message : "unknown error"}`);
    await delay(backoff + Math.random() * 500);
    backoff = Math.min(backoff * 2, 30_000);
  }
}
