"use client";

import { useState } from "react";
import { formatTomans } from "@/lib/money";

export default function OrderCheckout({
  packageId,
  title,
  priceRials,
  customerName,
  phone,
  requestId,
}: {
  packageId: string;
  title: string;
  priceRials: number;
  customerName: string;
  phone: string;
  requestId?: string;
}) {
  const [name, setName] = useState(customerName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function startPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const orderResponse = await fetch("/api/requests/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, name, requestId }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "ثبت سفارش انجام نشد.");

      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: order.id }),
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(payment.error || "رفتن به درگاه پرداخت ممکن نشد.");
      window.location.assign(payment.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "پرداخت شروع نشد؛ دوباره تلاش کنید.");
      setBusy(false);
    }
  }

  return (
    <form className="form order-checkout" onSubmit={startPayment}>
      <span className="eyebrow">مرحله اول · پرداخت</span>
      <h2>{title}</h2>
      <p className="muted">پس از تأیید پرداخت، فرم اطلاعات لازم برای تنظیم برنامه در پنل شما باز می‌شود.</p>
      <div className="shop-total"><span>مبلغ</span><b>{formatTomans(priceRials)} تومان</b></div>
      <div className="field">
        <label htmlFor="customer-name">نام و نام خانوادگی</label>
        <input id="customer-name" name="name" autoComplete="name" required minLength={3} maxLength={100} value={name} onChange={event => setName(event.target.value)} />
      </div>
      <p className="muted">شماره تماس حساب شما: <b dir="ltr">{phone}</b></p>
      {message && <div className="alert" role="alert">{message}</div>}
      <button className="btn shop-full" disabled={busy}>{busy ? "در حال انتقال به درگاه…" : "پرداخت و ادامه"}</button>
      <p className="muted" style={{ fontSize: 12 }}>قد، وزن و سایر اطلاعات بدنی قبل از پرداخت درخواست یا ذخیره نمی‌شوند.</p>
    </form>
  );
}
