export const metadata = { title: "پرسش‌های رایج | Fit Pro", alternates: { canonical: "/faq" } };

const faqs = [
  ["بعد از ثبت درخواست چه اتفاقی می‌افتد؟", "اطلاعات شما بررسی می‌شود و وضعیت درخواست از پنل کاربری قابل پیگیری است. پس از تأیید پرداخت، فرایند آماده‌سازی برنامه آغاز می‌شود."],
  ["آیا برنامه‌ها برای همه یکسان هستند؟", "خیر. برنامه با توجه به هدف، سابقه، امکانات و اطلاعاتی که در فرم ثبت می‌کنید آماده می‌شود."],
  ["آیا مربی‌گری جایگزین مراجعه پزشکی است؟", "خیر. خدمات مربی‌گری جایگزین تشخیص، درمان یا توصیه پزشک نیست. درباره بیماری، آسیب یا محدودیت پزشکی با متخصص خود مشورت کنید."],
  ["چطور با مربی ارتباط بگیرم؟", "از فرم پیام در صفحه اصلی استفاده کنید تا پیامتان برای پیگیری ارسال شود."],
] as const;

export default function FAQPage() {
  return <main className="container page"><span className="eyebrow">راهنمای Fit Pro</span><h1>پرسش‌های رایج</h1><div className="faq-list">{faqs.map(([question, answer], index) => <details className="card" key={question} open={index === 0}><summary><b>{String(index + 1).padStart(2, "0")}</b> {question}</summary><p className="muted">{answer}</p></details>)}</div></main>;
}
