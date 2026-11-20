"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function DevClientLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const params = useSearchParams();
  async function login() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/dev-client", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ورود آزمایشی انجام نشد.");
      const next = params.get("next");
      location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : result.redirect;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ورود آزمایشی انجام نشد.");
      setBusy(false);
    }
  }
  return <div className="dev-client-login">
    <button type="button" className="btn light" disabled={busy} onClick={login}>{busy ? "در حال آماده‌سازی حساب نمونه…" : "دیدن پنل مشتری با حساب آزمایشی"}</button>
    <small>فقط روی محیط توسعهٔ همین رایانه · شامل یک سفارش نمونه با پرداخت آزمایشی</small>
    {error && <p className="alert" role="alert">{error}</p>}
  </div>;
}
