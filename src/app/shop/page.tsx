import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatTomans } from "@/lib/money";
import { AddToCart, type ShopProduct } from "@/components/shop-cart";

export const metadata: Metadata = { title: "فروشگاه برنامه‌های Fit Pro", description: "برنامه همراهی تمرین و تغذیه Fit Pro را انتخاب کنید." };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const packages = await db.coachingPackage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const products: ShopProduct[] = packages.map(item => ({ id: item.id, slug: item.slug, title: item.title, description: item.description, durationDays: item.durationDays, priceRials: Number(item.priceRials), deliverables: Array.isArray(item.deliverables) ? item.deliverables.map(String) : [] }));
  return <main className="container page shop-page" dir="rtl">
    <div className="shop-heading"><div><span className="eyebrow">فروشگاه Fit Pro</span><h1>برنامه‌ای متناسب با مسیر تو</h1><p className="muted">جزئیات خدمات و هزینه را ببینید، انتخاب کنید و پس از ورود، سفارش خود را تکمیل کنید.</p></div><Link className="btn light" href="/cart">سبد خرید <span aria-label="سبد خرید">🛒</span></Link></div>
    <div className="shop-assurance"><span>✓</span><p><b>پرداخت امن و قابل پیگیری</b><br/><small>پرداخت آنلاین از طریق درگاه انجام می‌شود و وضعیت پرداخت فقط پس از تأیید سرور ثبت خواهد شد.</small></p></div>
    {products.length ? <section className="shop-grid" aria-label="فهرست برنامه‌ها">{products.map((item, index) => <article className={`shop-card ${item.slug === "combined" ? "shop-card-featured" : ""}`} key={item.id}>
      <div className={`shop-product-image shop-image-${index % 3}`} role="img" aria-label={`تصویر نمایشی ${item.title}`}><span>FIT PRO</span><b>✦</b><i>TRAIN · NOURISH · GROW</i></div><div className="shop-rating"><span aria-label="امتیاز نمونه 4.9 از 5">★★★★★</span><small>4.9 · امتیاز نمونه</small></div><div className="shop-card-top"><span className="shop-product-mark">FP</span>{item.slug === "combined" && <span className="tag">15% تخفیف</span>}</div><span className="eyebrow">همراهی مربی · {item.durationDays.toLocaleString("en-US")} روز</span><h2><Link href={`/shop/${item.slug}`}>{item.title}</Link></h2><p className="muted">{item.description}</p><ul>{item.deliverables.map((detail, i) => <li key={i}>{detail}</li>)}</ul><div className="shop-card-price">{item.slug === "combined" && <del>1,000,000</del>}<b>{formatTomans(item.priceRials)}</b><small>تومان</small></div><div className="shop-card-actions"><AddToCart product={item}/><Link className="text-link" href={`/shop/${item.slug}`}>جزئیات و سفارش</Link></div>
    </article>)}</section> : <div className="shop-empty"><h2>برنامه‌ها در حال آماده‌سازی هستند</h2><p className="muted">کمی بعد دوباره سر بزنید.</p></div>}
    <div className="shop-secondary"><div><span className="eyebrow">برای نمایش و تست</span><h2>پرداخت آزمایشی</h2><p className="muted">محیط نمایشی از خرید واقعی جداست؛ دکمه پرداخت آن هیچ وجه یا سفارش واقعی ایجاد نمی‌کند.</p><Link className="text-link" href="/manual-transfer">مشاهده پیش‌نمایش راهنمای کارت‌به‌کارت</Link></div><Link className="btn light" href="/demo-checkout">ورود به DEMO / TEST PAYMENT</Link></div>
  </main>;
}
