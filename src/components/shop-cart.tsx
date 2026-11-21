"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatTomans } from "@/lib/money";
import { DEMO_RECEIPT_PREFIX, type DemoReceipt } from "@/lib/demo-receipt";

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
      <aside className="shop-summary"><span className="eyebrow">خلاصه سفارش</span><div className="shop-total"><span>جمع جزء</span><b>{formatTomans(total)} تومان</b></div><div className="shop-total"><span>هزینه ارسال (خدمت دیجیتال)</span><b>رایگان</b></div><div className="shop-grand-total"><span>مجموع</span><b>{formatTomans(total)} تومان</b></div><Link href="/checkout" className="btn shop-full">پرداخت آزمایشی و تکمیل اطلاعات</Link><p className="muted shop-summary-note">پرداخت فقط نمایشی است؛ بعد از آن فرم مشخصات برنامه باز می‌شود. برای خرید واقعی از «سفارش واقعی» کنار برنامه استفاده کنید.</p></aside>
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

export function DemoCheckoutFlow({ linkToIntake = false, mockMode = false }: { linkToIntake?: boolean; mockMode?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<ShopProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => { try { setItems(JSON.parse(sessionStorage.getItem(CART_KEY) ?? "[]")); } catch { setItems([]); } }, 0); return () => window.clearTimeout(timer); }, []);
  const subtotal = items.reduce((sum, item) => sum + item.priceRials * (item.quantity ?? 1), 0);
  const total = subtotal;

  async function completePayment(fail = false, customerName = "") {
    setBusy(true);
    setError("");
    if (!fail && linkToIntake) {
      if (!mockMode) {
        setError("ثبت سفارش آزمایشی فقط در محیط توسعه فعال است. برای خرید از مسیر «سفارش واقعی» استفاده کنید.");
        setBusy(false);
        return;
      }
      if (!items.length) {
        setError("سبد خرید خالی است. ابتدا یک برنامه به سبد اضافه کنید.");
        setBusy(false);
        return;
      }
      try {
        const response = await fetch("/api/demo/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: customerName, items: items.map(item => ({ packageId: item.id, quantity: item.quantity ?? 1 })) }),
        });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            router.push(`/login?next=${encodeURIComponent("/checkout")}`);
            return;
          }
          throw new Error(result.error || "ثبت سفارش آزمایشی ناموفق بود.");
        }
        if (result.demo !== true || typeof result.url !== "string" || !result.url.startsWith("/dashboard/requests/new?request=")) {
          throw new Error("پاسخ پرداخت آزمایشی معتبر نیست.");
        }
        sessionStorage.removeItem(CART_KEY);
        window.dispatchEvent(new Event("fitpro-cart-change"));
        router.push(result.url);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
        setBusy(false);
      }
      return;
    }
    window.setTimeout(() => {
      const now = new Date();
      const id = `DEMO-${now.getTime().toString().slice(-8)}`;
      const receipt: DemoReceipt = {
        id,
        status: fail ? "failed" : "success",
        amountRials: total,
        createdAt: now.toISOString(),
        items: items.length
          ? items.map(item => ({ id: item.id, title: item.title, quantity: item.quantity ?? 1, priceRials: item.priceRials }))
          : [{ id: "demo-product", title: "کالای آزمایشی", quantity: 1, priceRials: 0 }],
      };
      try {
        sessionStorage.setItem(`${DEMO_RECEIPT_PREFIX}${id}`, JSON.stringify(receipt));
        if (!fail) {
          sessionStorage.removeItem(CART_KEY);
          window.dispatchEvent(new Event("fitpro-cart-change"));
        }
        router.push(`/checkout/result?order=${encodeURIComponent(id)}`);
      } catch {
        setError("رسید آزمایشی در این مرورگر ذخیره نشد. لطفاً دوباره تلاش کنید.");
        setBusy(false);
      }
    }, 450);
  }

  function pay(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void completePayment(false, String(data.get("demo-name") ?? "").trim()); }
  return <main className="container page shop-page" dir="rtl"><div className="demo-banner" role="note"><span>DEMO MODE</span><b>NO REAL MONEY TRANSFER</b></div>
    <span className="eyebrow">تسویه‌حساب نمایشی</span><h1>اطلاعات سفارش</h1><p className="muted">برای تست فقط مقدارهای ساختگی وارد کنید. نام واردشده برای ثبت سفارش آزمایشی در حساب ذخیره می‌شود؛ شماره همراه، نشانی، شماره کارت، تاریخ و CVV ارسال یا ذخیره نمی‌شوند. در حالت توسعه، بعد از پرداخت نمایشی سفارش با وضعیت آزمایشی ساخته می‌شود و فرم اطلاعات برنامه باز خواهد شد.</p>
    {error && <div className="alert" role="alert">{error}</div>}
    <div className="checkout-layout"><form className="checkout-form" onSubmit={pay}><section><h2>اطلاعات مشتری و نشانی</h2><div className="checkout-fields"><div className="field"><label htmlFor="demo-name">نام و نام خانوادگی</label><input id="demo-name" name="demo-name" autoComplete="name" required minLength={3} maxLength={100} placeholder="نام نمایشی"/></div><div className="field"><label htmlFor="demo-phone">شماره همراه</label><input id="demo-phone" dir="ltr" inputMode="tel" autoComplete="tel" required pattern="[0-9۰-۹٠-٩+() -]{8,20}" placeholder="شماره آزمایشی"/></div><div className="field checkout-wide"><label htmlFor="demo-address">نشانی</label><textarea id="demo-address" autoComplete="street-address" required placeholder="نشانی ساختگی برای نمایش فرم"/></div></div></section><section className="demo-card-fields"><h2>پرداخت آزمایشی</h2><div className="demo-warning-inline">فقط اطلاعات ساختگی وارد کنید. از اطلاعات کارت واقعی استفاده نکنید.</div><div className="checkout-fields"><div className="field checkout-wide"><label htmlFor="demo-card-name">نام دارنده کارت (آزمایشی)</label><input id="demo-card-name" autoComplete="off" required placeholder="نام نمونه"/></div><div className="field checkout-wide"><label htmlFor="demo-card-number">شماره کارت آزمایشی</label><input id="demo-card-number" dir="ltr" inputMode="numeric" autoComplete="off" required minLength={16} maxLength={19} pattern="[0-9 ]{16,19}" placeholder="0000 0000 0000 0000"/></div><div className="field"><label htmlFor="demo-expiry-month">ماه انقضا (ساختگی)</label><input id="demo-expiry-month" dir="ltr" inputMode="numeric" autoComplete="off" required maxLength={2} pattern="0[1-9]|1[0-2]" placeholder="MM" title="ماه را بین 01 و 12 وارد کنید"/></div><div className="field"><label htmlFor="demo-expiry-year">سال انقضا (ساختگی)</label><input id="demo-expiry-year" dir="ltr" inputMode="numeric" autoComplete="off" required minLength={4} maxLength={4} pattern="[0-9]{4}" placeholder="YYYY" title="سال را با 4 رقم وارد کنید"/></div><div className="field checkout-wide"><label htmlFor="demo-cvv">CVV ساختگی</label><input id="demo-cvv" dir="ltr" inputMode="numeric" autoComplete="off" required placeholder="000" minLength={3} maxLength={4} pattern="[0-9]{3,4}"/></div></div><button className="btn shop-full" disabled={busy}>{busy ? "در حال شبیه‌سازی…" : "Pay · پرداخت آزمایشی"}</button><button className="btn light shop-full" disabled={busy} type="button" onClick={e => { const form = e.currentTarget.form; if (form?.reportValidity()) completePayment(true); }}>شبیه‌سازی پرداخت ناموفق</button></section></form><aside className="shop-summary"><span className="eyebrow">خلاصه سفارش</span>{items.length ? items.map(item => <div className="checkout-line" key={item.id}><span>{item.title} × {(item.quantity ?? 1).toLocaleString("en-US")}</span><b>{formatTomans(item.priceRials * (item.quantity ?? 1))}</b></div>) : <p className="muted">کالای نمونه آزمایشی</p>}<div className="checkout-line"><span>جمع جزء</span><b>{formatTomans(subtotal)} تومان</b></div><div className="checkout-line"><span>هزینه ارسال</span><b>رایگان</b></div><div className="shop-grand-total"><span>مجموع نمایشی</span><b>{formatTomans(total)} تومان</b></div><p className="muted shop-summary-note">دمو هیچ درگاه پرداختی را فراخوانی نمی‌کند.</p></aside></div>
    </main>;
}
