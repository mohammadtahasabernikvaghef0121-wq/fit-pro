"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEMO_RECEIPT_PREFIX, type DemoReceipt } from "@/lib/demo-receipt";
import { formatTomans } from "@/lib/money";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(value));
}

export default function CheckoutReceipt({ orderId }: { orderId: string }) {
  const [receipt, setReceipt] = useState<DemoReceipt | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let nextReceipt: DemoReceipt | null = null;
    try {
      const stored = sessionStorage.getItem(`${DEMO_RECEIPT_PREFIX}${orderId}`);
      if (stored) nextReceipt = JSON.parse(stored) as DemoReceipt;
    } catch {
      nextReceipt = null;
    }
    const timeout = window.setTimeout(() => setReceipt(nextReceipt), 0);
    return () => window.clearTimeout(timeout);
  }, [orderId]);

  const success = receipt?.status === "success";

  return (
    <main className="container page receipt-page" dir="rtl">
      <div className="demo-banner receipt-demo-banner" role="note">
        <span>DEMO / TEST PAYMENT</span>
        <b>NO REAL MONEY TRANSFER</b>
      </div>

      {!receipt ? (
        <section className="receipt-card receipt-missing" role="status">
          <span className="receipt-symbol receipt-symbol-muted">؟</span>
          <span className="eyebrow">رسید در این نشست در دسترس نیست</span>
          <h1>اطلاعات سفارش پیدا نشد</h1>
          <p className="muted">رسید نمایشی فقط تا پایان نشست جاری مرورگر نگه‌داری می‌شود. برای شروع دوباره، به فروشگاه برگردید.</p>
          <Link href="/shop" className="btn">بازگشت به فروشگاه</Link>
        </section>
      ) : (
        <section className={`receipt-card ${success ? "is-success" : "is-failed"}`}>
          <header className="receipt-heading">
            <div className={`receipt-symbol ${success ? "" : "receipt-symbol-failed"}`} aria-hidden="true">{success ? "✓" : "!"}</div>
            <span className="eyebrow">رسید تراکنش آزمایشی</span>
            <h1>{success ? "تراکنش موفق بود" : "پرداخت انجام نشد"}</h1>
            <p className="muted">{success ? "این نتیجه فقط برای نمایش جریان خرید است." : "این تراکنش نمایشی ناموفق بود؛ مبلغی دریافت نشده است."}</p>
            <span className={`receipt-status ${success ? "" : "receipt-status-failed"}`}>
              {success ? "موفق · شبیه‌سازی‌شده" : "ناموفق · شبیه‌سازی‌شده"}
            </span>
          </header>

          <div className="receipt-amount">
            <span>مبلغ نمایشی</span>
            <strong>{formatTomans(receipt.amountRials)} <small>تومان</small></strong>
          </div>

          <dl className="receipt-meta">
            <div><dt>شناسه تراکنش</dt><dd dir="ltr">{receipt.id}</dd></div>
            <div><dt>تاریخ و ساعت</dt><dd>{formatDate(receipt.createdAt)}</dd></div>
            <div><dt>وضعیت پرداخت</dt><dd><span className={`receipt-status ${success ? "" : "receipt-status-failed"}`}>{success ? "پرداخت آزمایشی موفق" : "پرداخت آزمایشی ناموفق"}</span></dd></div>
          </dl>

          <section className="receipt-items">
            <h2>محصولات سفارش</h2>
            {receipt.items.map((item, index) => (
              <div className="receipt-item" key={`${item.id}-${index}`}>
                <span className="receipt-product-mark" aria-hidden="true">FP</span>
                <div className="receipt-product-info">
                  <strong>{item.title}</strong>
                  <small>تعداد: {item.quantity.toLocaleString("en-US")}</small>
                </div>
                <b>{formatTomans(item.priceRials * item.quantity)} تومان</b>
              </div>
            ))}
            <div className="receipt-total"><span>هزینه ارسال</span><b>رایگان · خدمت دیجیتال</b></div>
            <div className="receipt-total receipt-total-final"><span>مجموع</span><b>{formatTomans(receipt.amountRials)} تومان</b></div>
          </section>

          <p className="receipt-demo-note">پرداخت آزمایشی است؛ پول واقعی جابه‌جا نشده، سفارش واقعی ایجاد نشده و اطلاعات کارت ذخیره نشده است.</p>

          <div className="receipt-actions">
            <details className="receipt-menu">
              <summary aria-label="گزینه‌های رسید">گزینه‌های رسید <span aria-hidden="true">⌄</span></summary>
              <div className="receipt-menu-options">
                <button type="button" onClick={() => window.print()}>چاپ رسید</button>
                <button type="button" onClick={() => window.print()}>ذخیره PDF از پنجره چاپ</button>
                <Link href="/dashboard">رفتن به پنل کاربری</Link>
              </div>
            </details>
            <Link href="/shop" className="btn">بازگشت به فروشگاه</Link>
          </div>
          <p className="receipt-print-hint">برای دریافت PDF، در پنجرهٔ چاپ مرورگر گزینهٔ «Save as PDF» را انتخاب کنید.</p>
        </section>
      )}
    </main>
  );
}
