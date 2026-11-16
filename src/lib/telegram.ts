import { formatTomans } from "@/lib/money";
type RequestNotice = {
  requestId: string;
  phone: string;
  packageName: string;
  intake: Record<string, unknown>;
};

export async function sendOrderCreatedToTelegram(input: { amountRials: bigint; orderRef: string; requestId: string; packageName: string; customerName: string; phone: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  const ownerId = process.env.TELEGRAM_OWNER_USER_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId || !ownerId || !/^\d+$/.test(chatId) || chatId.startsWith("0") || chatId !== ownerId) return false;
  const text = [
    "سفارش جدید Fit Pro · در انتظار پرداخت",
    `مبلغ: ${formatTomans(input.amountRials)} تومان`,
    `بسته: ${input.packageName}`,
    `شناسه درخواست: ${input.requestId}`,
    `مرجع سفارش: ${input.orderRef}`,
    `نام مشتری: ${input.customerName || "ثبت نشده"}`,
    `شماره تماس: ${input.phone}`,
    "وضعیت: پرداخت هنوز از درگاه تأیید نشده است.",
  ].join("\n");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.ok === true;
}

const labels: Record<string, string> = {
  age: "سن",
  height: "قد (سانتی‌متر)",
  weight: "وزن (کیلوگرم)",
  goal: "هدف",
  activityLevel: "سطح فعالیت",
  experience: "سابقه تمرین",
  trainingDays: "روزهای تمرین",
  equipment: "امکانات تمرین",
  dietaryPreferences: "ترجیحات غذایی",
  allergies: "حساسیت‌ها",
  injuries: "سابقه آسیب‌دیدگی",
  healthConditions: "محدودیت‌های سلامتی",
  notes: "توضیحات",
};

export async function sendRequestToTelegram({ requestId, phone, packageName, intake }: RequestNotice) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  const ownerId = process.env.TELEGRAM_OWNER_USER_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId || !ownerId || !/^\d+$/.test(chatId) || chatId.startsWith("0") || chatId !== ownerId) return false;

  const details = Object.entries(labels)
    .map(([key, label]) => `${label}: ${String(intake[key] || "ثبت نشده")}`)
    .join("\n");
  const text = [`درخواست جدید Fit Pro`, `شناسه: ${requestId}`, `شماره همراه: ${phone}`, `بسته: ${packageName}`, "", details].join("\n").slice(0, 4000);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.ok === true;
}

export async function sendWebsiteSupportToTelegram(input: {
  requestNumber: number;
  userId: string;
  name: string;
  phone: string;
  message: string;
  intake: Record<string, unknown>;
}) {
  return sendPrivateSupportNoticeToTelegram(input.requestNumber);
}

export async function sendWebsiteFollowupToTelegram({ requestNumber, name, message }: { requestNumber: number; name: string; message: string }) {
  void name; void message;
  return sendPrivateSupportNoticeToTelegram(requestNumber);
}

export async function sendPaymentConfirmedToTelegram(input: {
  amountRials: bigint;
  orderRef: string;
  transactionRef: string;
  requestId: string;
  packageName: string;
  customerName: string;
  phone: string;
  intake: Record<string, unknown>;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  const ownerId = process.env.TELEGRAM_OWNER_USER_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId || !ownerId || !/^\d+$/.test(chatId) || chatId.startsWith("0") || chatId !== ownerId) return false;
  const fieldLabels: Record<string, string> = {
    age: "سن", height: "قد", weight: "وزن", goal: "هدف", activityLevel: "سطح فعالیت",
    experience: "سابقه تمرین", trainingDays: "روزهای تمرین", equipment: "امکانات تمرین",
    dietaryPreferences: "ترجیحات غذایی", allergies: "حساسیت غذایی", injuries: "سابقه آسیب‌دیدگی",
    healthConditions: "محدودیت سلامتی", notes: "توضیحات تکمیلی",
  };
  const details = Object.entries(fieldLabels)
    .filter(([key]) => input.intake[key] !== undefined && input.intake[key] !== "")
    .map(([key, label]) => `${label}: ${String(input.intake[key]).slice(0, 500)}`);
  const rawText = [
    "✅ پرداخت وب‌سایت تأیید شد · Fit Pro",
    `مبلغ: ${formatTomans(input.amountRials)} تومان`,
    `بسته/سفارش: ${input.packageName}`,
    `شناسه درخواست: ${input.requestId}`,
    `مرجع سفارش: ${input.orderRef}`,
    `مرجع تراکنش درگاه: ${input.transactionRef}`,
    `نام مشتری: ${input.customerName || "ثبت نشده"}`,
    `شماره تماس: ${input.phone}`,
    ...(details.length ? ["", "اطلاعات فرم سفارش:", ...details] : []),
    "",
    "اطلاعات کارت و بانکی در این اعلان درج نمی‌شود.",
  ].join("\n");
  const text = rawText
    .replace(/\b(?:[0-9۰-۹٠-٩][ -]?){13,19}\b/g, "[اطلاعات پرداخت حذف شد]")
    .replace(/\b(CVV|CVC|رمز(?: دوم)? کارت)\s*[:=：]?\s*[0-9۰-۹٠-٩]{3,8}\b/gi, "$1: [حذف شد]")
    .slice(0, 3900);
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.ok === true;
}

export async function sendPrivateSupportNoticeToTelegram(requestNumber: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  const ownerId = process.env.TELEGRAM_OWNER_USER_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !adminChatId || !ownerId || !/^\d+$/.test(adminChatId) || adminChatId.startsWith("0") || adminChatId !== ownerId) return false;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: adminChatId, text: `درخواست پشتیبانی خصوصی جدید #${requestNumber} در پنل مالک سایت ثبت شد. متن گفت‌وگو را فقط از پنل امن /admin/support مشاهده و پاسخ دهید.`, disable_web_page_preview: true }),
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.ok === true;
}
