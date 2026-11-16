import type { Metadata } from "next";
import Link from "next/link";
import { CartView } from "@/components/shop-cart";
export const metadata: Metadata = { title: "سبد خرید", robots: { index: false, follow: false } };
export default function CartPage() { return <main className="container page shop-page" dir="rtl"><span className="eyebrow">فروشگاه Fit Pro</span><h1>سبد خرید</h1><p className="muted">انتخاب‌هایتان را مرور کنید.</p><CartView/><p className="shop-back"><Link className="text-link" href="/shop">← بازگشت به فروشگاه</Link></p></main>; }
