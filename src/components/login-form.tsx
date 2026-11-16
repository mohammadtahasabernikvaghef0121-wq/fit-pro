"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [phone, setPhone] = useState(""); const [code, setCode] = useState(""); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [remember, setRemember] = useState(false); const [savedVisible, setSavedVisible] = useState(false); const [demoCode, setDemoCode] = useState(""); const [seconds, setSeconds] = useState(0); const params = useSearchParams();
  useEffect(() => { if (!sent || seconds <= 0) return; const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [sent, seconds]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await fetch(sent ? "/api/auth/verify" : "/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sent ? { phone, code } : { phone }) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error);
      if (sent) { if (remember) try { localStorage.setItem("fitpro-consented-phone", phone); } catch { /* Continue login if local storage is unavailable. */ } const next = params.get("next"); location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : json.redirect; }
      else { setSent(true); setSeconds(45); setDemoCode(typeof json.demoCode === "string" ? json.demoCode : ""); }
    } catch (e) { setError(e instanceof Error ? e.message : "خطایی رخ داد."); } finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError("");
    try { const res = await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) }); const json = await res.json(); if (!res.ok) throw new Error(json.error); setSeconds(45); setDemoCode(typeof json.demoCode === "string" ? json.demoCode : ""); }
    catch (e) { setError(e instanceof Error ? e.message : "ارسال دوباره کد انجام نشد."); } finally { setBusy(false); }
  }
  function revealSavedPhone() {
    if (savedVisible) { setPhone(""); setSavedVisible(false); setError(""); return; }
    setSavedVisible(true);
    try { const saved = localStorage.getItem("fitpro-consented-phone"); if (saved) setPhone(saved); else setError("شماره‌ای در این مرورگر ذخیره نشده است."); }
    catch { setError("ذخیره‌سازی این مرورگر در دسترس نیست."); }
  }
  return <form className="form login-form" onSubmit={submit}>
    <h2>{sent ? "کد ورود را وارد کنید" : "ورود یا ساخت حساب"}</h2>
    <p className="muted">{sent ? `کد یک‌بارمصرف به ${phone} ارسال شد.` : "شماره همراه خود را وارد کنید تا کد یک‌بارمصرف برایتان پیامک شود."}</p>
    {demoCode && sent && <div className="alert demo-otp" role="status">DEMO OTP · فقط توسعه: <b dir="ltr">{demoCode}</b></div>}
    {error && <div className="alert" role="alert">{error}</div>}
    <div className="field"><label htmlFor="phone">شماره همراه</label><input id="phone" dir="ltr" inputMode="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="09121234567" />{!sent && <label className="consent-line"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> با رضایت خودم این شماره را در همین مرورگر ذخیره کن.</label>}</div>
    {!sent && <button type="button" className="saved-phone-button" onClick={revealSavedPhone}>{savedVisible ? "پاک‌کردن شماره از فرم" : "با اجازه من، شماره ذخیره‌شده در این مرورگر را نشان بده"}</button>}
    {sent && <div className="field"><label htmlFor="code">کد پیامک‌شده</label><input id="code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} /></div>}
    <button className="btn" disabled={busy}>{busy ? "لطفاً صبر کنید" : sent ? "تأیید و ورود" : "ارسال کد ورود"}</button>
    {sent && <div className="login-actions"><button type="button" className="btn light" onClick={() => { setSent(false); setCode(""); setDemoCode(""); }}>تغییر شماره</button><button type="button" className="saved-phone-button" disabled={busy || seconds > 0} onClick={resend}>ارسال دوباره کد {seconds > 0 ? `(${seconds.toLocaleString("en-US")} ثانیه)` : ""}</button></div>}
    {!sent && <p className="muted login-privacy-note">شماره فقط با اجازهٔ شما در همین مرورگر ذخیره می‌شود؛ سایت آن را خودکار از دستگاه نمی‌خواند.</p>}
  </form>;
}
