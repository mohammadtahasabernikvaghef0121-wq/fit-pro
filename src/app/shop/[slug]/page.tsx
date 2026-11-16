import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatTomans } from "@/lib/money";
import { AddToCart, type ShopProduct } from "@/components/shop-cart";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await db.coachingPackage.findFirst({ where: { slug, active: true } });
  return { title: item ? `${item.title} | فروشگاه Fit Pro` : "برنامه پیدا نشد" };
}
export default async function ShopProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await db.coachingPackage.findFirst({ where: { slug, active: true } });
  if (!item) notFound();
  const product: ShopProduct = { id: item.id, slug: item.slug, title: item.title, description: item.description, durationDays: item.durationDays, priceRials: Number(item.priceRials), deliverables: Array.isArray(item.deliverables) ? item.deliverables.map(String) : [] };
  return <main className="container page shop-page" dir="rtl"><Link href="/shop" className="text-link">← بازگشت به فروشگاه</Link><article className="shop-detail"><div className="shop-detail-art"><span className="shop-product-mark">FP</span><span className="eyebrow">همراهی مربی · {item.durationDays.toLocaleString("en-US")} روز</span></div><div className="shop-detail-copy"><span className="eyebrow">برنامه Fit Pro</span><h1>{item.title}</h1><p className="muted">{item.description}</p><h2>این برنامه شامل</h2><ul>{product.deliverables.map((detail, i) => <li key={i}>{detail}</li>)}</ul>{item.slug === "combined" && <p className="tag">15% تخفیف · قیمت قبلی 1,000,000 تومان</p>}<div className="shop-card-price"><b>{formatTomans(product.priceRials)}</b><small>تومان</small></div><p className="muted">بعد از ورود، نام و شماره تماس را برای سفارش ثبت می‌کنید و پرداخت انجام می‌شود. پس از تأیید پرداخت، فرم اطلاعات بدنی و تمرینی برای تکمیل برنامه باز می‌شود.</p><div className="shop-card-actions"><AddToCart product={product}/><Link href={`/login?next=${encodeURIComponent(`/dashboard/requests/new?package=${item.id}`)}`} className="btn light">ادامه برای سفارش</Link></div></div></article></main>;
}
