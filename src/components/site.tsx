import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/config";

export function SiteHeader() {
  return <header className="container topbar">
    <Link href="/" className="brand"><Image src="/fit-pro-wordmark.jpg" alt="Fit Pro" width={160} height={52} className="brand-logo" /></Link>
    <nav className="nav" aria-label="ناوبری اصلی">
      <Link href="/">خانه</Link><Link href="/shop">فروشگاه</Link><Link href="/cart">سبد خرید</Link><Link href="/pricing">ثبت سفارش</Link><Link href="/support">پشتیبانی</Link><Link href="/about">درباره مربی</Link><Link href="/faq">پرسش‌های رایج</Link>
    </nav>
    <details className="mobile-menu"><summary>فهرست</summary><div className="mobile-nav">
      <Link href="/">خانه</Link><Link href="/shop">فروشگاه</Link><Link href="/cart">سبد خرید</Link><Link href="/pricing">ثبت سفارش</Link><Link href="/support">پشتیبانی</Link><Link href="/about">درباره مربی</Link><Link href="/faq">پرسش‌های رایج</Link><Link href="/login">ورود</Link>
    </div></details>
    <div className="actions"><Link href="/login" className="login-text">ورود</Link></div>
  </header>;
}

export function SiteFooter() {
  return <footer className="footer"><div className="container footer-grid">
    <div><Link href="/" className="brand"><Image src="/fit-pro-wordmark.jpg" alt="Fit Pro" width={160} height={52} className="brand-logo" /></Link><p className="muted" style={{ color: "#fff5dc", maxWidth: 360 }}>همراه شما برای ساختن عادت‌هایی سازگار با زندگی واقعی؛ قدم‌به‌قدم و با برنامه‌ای شخصی.</p><small>© {new Date().getFullYear()} {siteConfig.brand}. همه حقوق محفوظ است.</small></div>
    <div><b>دسترسی سریع</b><Link href="/shop">فروشگاه</Link><Link href="/cart">سبد خرید</Link><Link href="/support">پشتیبانی</Link><Link href="/pricing">برنامه‌های همراهی</Link><Link href="/about">درباره مربی</Link></div>
    <div><b>اطلاعات</b><Link href="/faq">پرسش‌های رایج</Link><Link href="/privacy">حریم خصوصی</Link><Link href="/terms">شرایط استفاده</Link></div>
  </div></footer>;
}
