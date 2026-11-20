import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "درباره مربی",
  description: "آشنایی با مربی و رویکرد تمرین و تغذیه Fit Pro.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="container page" dir="rtl">
      <span className="eyebrow">درباره Fit Pro</span>
      <h1>محمد مهدی صابر نیک واقف</h1>
      <section className="card" style={{ maxWidth: 820 }}>
        <h2>همراهی متناسب با زندگی واقعی</h2>
        <p className="muted">
          {siteConfig.coachBio || "در Fit Pro، برنامه‌های تمرینی و تغذیه با توجه به هدف‌ها، شرایط بدنی، تجربه و زمان در دسترس هر فرد تنظیم می‌شوند. مسیر با قدم‌های روشن آغاز می‌شود و در طول همراهی، بر اساس بازخورد و روند پیشرفت بازبینی خواهد شد."}
        </p>
        <h2>رویکرد مربی‌گری</h2>
        <p className="muted">
          پیش از پیشنهاد برنامه، اطلاعات و هدف‌های شما بررسی می‌شود تا مسیر انتخاب‌شده قابل‌اجرا و متناسب با نیازتان باشد. توصیه‌های مربی‌گری جای تشخیص یا درمان پزشکی را نمی‌گیرند؛ برای بیماری یا آسیب فعال، نظر پزشک یا متخصص مربوط را دریافت کنید.
        </p>
      </section>
    </main>
  );
}
