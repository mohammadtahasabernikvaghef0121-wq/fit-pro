import { randomBytes } from "node:crypto";
import { open } from "node:fs/promises";

const envPath = ".env.local";
const content = [
  "# Local-only Fit Pro preview settings. Never use these demo modes in production.",
  `SESSION_SECRET="${randomBytes(48).toString("base64url")}"`,
  `HEALTH_DATA_KEY="${randomBytes(32).toString("base64")}"`,
  'NEXT_PUBLIC_SITE_URL="http://localhost:3000"',
  'NEXT_PUBLIC_BRAND_NAME="Fit Pro"',
  'NEXT_PUBLIC_TELEGRAM_USERNAME="TahaDeweloperr"',
  'ADMIN_PHONE="09023072635"',
  'OTP_DEMO_MODE="true"',
  'PAYMENT_MODE="mock"',
  'ZIBAL_MERCHANT="zibal"',
  'FIT_PRO_DB_PORT="51214"',
  'FIT_PRO_NEXT_PORT="3000"',
  'SEED_NUTRITION_PRICE_RIALS="5000000"',
  'SEED_TRAINING_PRICE_RIALS="5000000"',
  'SEED_COMBINED_PRICE_RIALS="8500000"',
  "",
].join("\n");

try {
  const file = await open(envPath, "wx");
  await file.writeFile(content, "utf8");
  await file.close();
  console.log("تنظیمات پیش‌نمایش محلی ساخته شد. برای اجرای سایت npm run dev را بزنید.");
  console.log("OTP و پرداخت در این حالت نمایشی هستند و پول یا پیامک واقعی ارسال نمی‌شود.");
} catch (error) {
  if (error?.code === "EEXIST") {
    console.log(".env.local از قبل وجود دارد؛ برای حفظ تنظیمات موجود تغییری داده نشد.");
  } else {
    throw error;
  }
}
