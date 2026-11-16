"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTomans } from "@/lib/money";

export type ShopProduct = { id: string; slug: string; title: string; description: string; durationDays: number; priceRials: number; deliverables: string[]; quantity?: number; };
const CART_KEY = "fitpro-shop-cart-v1";

export function AddToCart({ product }: { product: ShopProduct }) {
  const [added, setAdded] = useState(false);
  function add() {
    try {
      const cart: ShopProduct[] = JSON.parse(sessionStorage.getItem(CART_KEY) ?? "[]");
      const existing = cart.find((item) => item.id === product.id);
      if (existing) existing.quantity = Math.min(10, (existing.quantity ?? 1) + 1);
      else cart.push({ ...product, quantity: 1 });
      sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
      setAdded(true);
      window.dispatchEvent(new Event("fitpro-cart-change"));
    } catch { setAdded(false); }
  }
  return <button className="btn" onClick={add}>{added ? "به سبد اضافه شد ✓" : "افزودن به سبد"}</button>;
}

export function CartView() {
  const [items, setItems] = useState<ShopProduct[]>([]);
  useEffect(() => {
    const sync = () => { try { setItems((JSON.parse(sessionStorage.getItem(CART_KEY) ?? "[]") as ShopProduct[]).map(item => ({ ...item, quantity: Math.max(1, Math.min(10, item.quantity ?? 1)) }))); } catch { setItems([]); } };
    sync(); window.addEventListener("fitpro-cart-change", sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener("fitpro-cart-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  const remove = (id: string) => { const next = items.filter((item) => item.id !== id); setItems(next); sessionStorage.setItem(CART_KEY, JSON.stringify(next)); window.dispatchEvent(new Event("fitpro-cart-change")); };
  const setQuantity = (id: string, quantity: number) => { const next = items.map(item => item.id === id ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) } : item); setItems(next); sessionStorage.setItem(CART_KEY, JSON.stringify(next)); window.dispatchEvent(new Event("fitpro-cart-change")); };
  const total = items.reduce((sum, item) => sum + item.priceRials * (item.quantity ?? 1), 0);
  return <>
    {items.length === 0 ? <section className="shop-empty"><span className="shop-icon">🛍</span><h2>سبد خرید شما خالی است</h2><p className="muted">از بین برنامه‌های مربی‌گری، گزینه مناسب خود را انتخاب کنید.</p><Link href="/shop" className="btn">رفتن به فروشگاه</Link></section> : <div className="shop-layout">
      <section className="shop-products">{items.map(item => <article className="shop-cart-item" key={item.id}><div className="shop-product-mark">FP</div><div className="shop-cart-info"><h2>{item.title}</h2><p className="muted">{item.durationDays.toLocaleString("en-US")} روز همراهی مربی</p><b>{formatTomans(item.priceRials)} تومان</b><div className="quantity-control" aria-label={`تعداد ${item.title}`}><button aria-label="کاهش تعداد" onClick={() => setQuantity(item.id, (item.quantity ?? 1) - 1)}>−</button><span>{(item.quantity ?? 1).toLocaleString("en-US")}</span><button aria-label="افزایش تعداد" onClick={() => setQuantity(item.id, (item.quantity ?? 1) + 1)}>+</button></div></div><button className="text-button" onClick={() => remove(item.id)} aria-label={`حذف ${item.title} از سبد`}>حذف</button><Link className="btn small" href={`/login?next=${encodeURIComponent(`/dashboard/requests/new?package=${item.id}`)}`}>سفارش واقعی</Link></article>)}</section>
      <aside className="shop-summary"><span className="eyebrow">خلاصه سفارش</span><div className="shop-total"><span>جمع جزء</span><b>{formatTomans(total)} تومان</b></div><div className="shop-total"><span>هزینه ارسال (خدمت دیجیتال)</span><b>رایگان</b></div><div className="shop-grand-total"><span>مجموع</span><b>{formatTomans(total)} تومان</b></div><Link href="/checkout" className="btn shop-full">تکمیل پرداخت نمایشی</Link><p className="muted shop-summary-note">برای خرید واقعی، از دکمه «سفارش واقعی» کنار هر برنامه استفاده کنید.</p></aside>
    </div>}
  </>;
}

export function DemoPayment() {
  const [paid, setPaid] = useState(false);
  return <main className="container page demo-page" dir="rtl">
    <div className="demo-banner" role="note"><span>DEMO / TEST PAYMENT</span><b>NO REAL MONEY TRANSFER</b></div>
    {!paid ? <div className="demo-checkout"><section><span className="eyebrow">محیط نمایشی فروشگاه</span><h1>آزمایش مسیر پرداخت</h1><p className="muted">این صفحه فقط برای نمایش جریان خرید است. پرداخت آزمایشی هیچ سفارش یا تراکنش واقعی ایجاد نمی‌کند.</p><div className="shop-cart-item"><div className="shop-product-mark">FP</div><div><b>برنامه تمرینی نمونه</b><p className="muted">محصول آزمایشی · بدون ارزش مالی</p></div><b>0 تومان</b></div></section><aside className="shop-summary"><span className="eyebrow">تست رابط کاربری</span><h2>مبلغ آزمایشی: 0 تومان</h2><button className="btn shop-full" onClick={() => setPaid(true)}>Pay · شبیه‌سازی پرداخت موفق</button><p className="muted shop-summary-note">با فشردن این دکمه پولی جابه‌جا نمی‌شود و وضعیت سفارش واقعی تغییر نمی‌کند.</p></aside></div> : <section className="demo-success"><span className="demo-check">✓</span><span className="eyebrow">DEMO ONLY</span><h1>Payment Successful (Simulated)</h1><p>پرداخت نمایشی با موفقیت شبیه‌سازی شد.</p><strong>پول واقعی منتقل نشده است · سفارش واقعی ثبت نشده است</strong><button className="btn light" onClick={() => setPaid(false)}>بازگشت به آزمایش</button><Link href="/shop" className="text-link">بازگشت به فروشگاه</Link></section>}
  </main>;
}

export function DemoCheckoutFlow() {
  const [items, setItems] = useState<ShopProduct[]>([]); const [busy, setBusy] = useState(false); const [order, setOrder] = useState<{ id: string; amount: number; date: string; status: "success" | "failed" } | null>(null); const [showDetails, setShowDetails] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { setItems(JSON.parse(sessionStorage.getItem(CART_KEY) ?? "[]")); } catch { setItems([]); } }, 0); return () => window.clearTimeout(timer); }, []);
  const subtotal = items.reduce((sum, item) => sum + item.priceRials * (item.quantity ?? 1), 0); const delivery = 0; const total = subtotal + delivery;
  function completePayment(fail = false) { setBusy(true); window.setTimeout(() => { setOrder({ id: `DEMO-${Date.now().toString().slice(-8)}`, amount: total, date: new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }).format(new Date()), status: fail ? "failed" : "success" }); setBusy(false); }, 650); }
  function pay(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); completePayment(); }
  return <main className="container page shop-page" dir="rtl"><div className="demo-banner" role="note"><span>DEMO MODE</span><b>NO REAL MONEY TRANSFER</b></div>{order ? <section className={`demo-success ${order.status === "failed" ? "demo-failed" : ""}`}><span className="demo-check">{order.status === "success" ? "✓" : "!"}</span><span className="eyebrow">DEMO ORDER · NO REAL PAYMENT</span><h1>{order.status === "success" ? "پرداخت آزمایشی موفق بود" : "پرداخت آزمایشی ناموفق بود"}</h1><p>شماره سفارش نمایشی: <b dir="ltr">{order.id}</b></p><p>وضعیت پرداخت: <b>{order.status === "success" ? "موفق (شبیه‌سازی‌شده)" : "ناموفق (شبیه‌سازی‌شده)"}</b></p><p>مبلغ: <b>{formatTomans(order.amount)} تومان</b></p><p>تاریخ: <b>{order.date}</b></p><strong>پول واقعی منتقل نشده و هیچ اطلاعات کارتی ذخیره نشده است. این سفارش نمایشی در تاریخچه سفارش‌ها ثبت نشده است.</strong><button className="btn light" onClick={() => setShowDetails(!showDetails)}>{showDetails ? "بستن جزئیات" : "مشاهده سفارش نمایشی"}</button>{showDetails && <div className="demo-order-detail"><h2>جزئیات نمایشی سفارش</h2>{items.map(item => <p key={item.id}>{item.title} × {(item.quantity ?? 1).toLocaleString("en-US")}</p>)}{items.length === 0 && <p>کالای نمونه آزمایشی × 1</p>}<p>هزینه ارسال: رایگان · خدمت دیجیتال</p></div>}<Link href="/shop" className="text-link">بازگشت به فروشگاه</Link></section> : <>
    <span className="eyebrow">تسویه‌حساب نمایشی</span><h1>اطلاعات سفارش</h1><p className="muted">برای تست از مقادیر ساختگی استفاده کنید. اطلاعات زیر فقط تا بسته‌شدن این صفحه در حافظه موقت فرم می‌ماند و ارسال یا ذخیره نمی‌شود.</p>
    <div className="checkout-layout"><form className="checkout-form" onSubmit={pay}><section><h2>اطلاعات مشتری و نشانی</h2><div className="checkout-fields"><div className="field"><label htmlFor="demo-name">نام و نام خانوادگی</label><input id="demo-name" autoComplete="name" required placeholder="نام نمایشی"/></div><div className="field"><label htmlFor="demo-phone">شماره همراه</label><input id="demo-phone" dir="ltr" inputMode="tel" autoComplete="tel" required pattern="[0-9۰-۹٠-٩+() -]{8,20}" placeholder="شماره آزمایشی"/></div><div className="field checkout-wide"><label htmlFor="demo-address">نشانی</label><textarea id="demo-address" autoComplete="street-address" required placeholder="نشانی ساختگی برای نمایش فرم"/></div></div></section><section className="demo-card-fields"><h2>پرداخت آزمایشی</h2><div className="demo-warning-inline">فقط اطلاعات ساختگی وارد کنید. از اطلاعات کارت واقعی استفاده نکنید.</div><div className="checkout-fields"><div className="field checkout-wide"><label htmlFor="demo-card-name">نام دارنده کارت (آزمایشی)</label><input id="demo-card-name" autoComplete="off" required placeholder="نام نمونه"/></div><div className="field checkout-wide"><label htmlFor="demo-card-number">شماره کارت آزمایشی</label><input id="demo-card-number" dir="ltr" inputMode="numeric" autoComplete="off" required minLength={16} maxLength={19} pattern="[0-9 ]{16,19}" placeholder="0000 0000 0000 0000"/></div><div className="field"><label htmlFor="demo-expiry">تاریخ انقضای ساختگی</label><input id="demo-expiry" dir="ltr" autoComplete="off" required placeholder="MM/YY" pattern="[0-9]{2}/[0-9]{2}" maxLength={5}/></div><div className="field"><label htmlFor="demo-cvv">CVV ساختگی</label><input id="demo-cvv" dir="ltr" inputMode="numeric" autoComplete="off" required placeholder="000" minLength={3} maxLength={4} pattern="[0-9]{3,4}"/></div></div><button className="btn shop-full" disabled={busy}>{busy ? "در حال شبیه‌سازی…" : "Pay · پرداخت آزمایشی"}</button><button className="btn light shop-full" disabled={busy} type="button" onClick={e => { const form = e.currentTarget.form; if (form?.reportValidity()) completePayment(true); }}>شبیه‌سازی پرداخت ناموفق</button></section></form><aside className="shop-summary"><span className="eyebrow">خلاصه سفارش</span>{items.length ? items.map(item => <div className="checkout-line" key={item.id}><span>{item.title} × {(item.quantity ?? 1).toLocaleString("en-US")}</span><b>{formatTomans(item.priceRials * (item.quantity ?? 1))}</b></div>) : <p className="muted">کالای نمونه آزمایشی</p>}<div className="checkout-line"><span>جمع جزء</span><b>{formatTomans(subtotal)} تومان</b></div><div className="checkout-line"><span>هزینه ارسال</span><b>رایگان</b></div><div className="shop-grand-total"><span>مجموع نمایشی</span><b>{formatTomans(total)} تومان</b></div><p className="muted shop-summary-note">دمو هیچ درگاه پرداختی را فراخوانی نمی‌کند.</p></aside></div></>}
  </main>;
}
