"use client";
import { useState, type FormEvent } from "react";
export default function AdminSupportReply({ requestNumber }: { requestNumber: number }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); const form = event.currentTarget; const text = new FormData(form).get("message"); try { const response = await fetch(`/api/admin/support/${requestNumber}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "ارسال پاسخ انجام نشد."); form.reset(); setMessage("پاسخ در گفت‌وگوی خصوصی مشتری ثبت شد."); } catch (error) { setMessage(error instanceof Error ? error.message : "ارسال پاسخ انجام نشد."); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="admin-support-reply"><label className="sr-only" htmlFor={`admin-support-${requestNumber}`}>پاسخ به درخواست {requestNumber}</label><textarea id={`admin-support-${requestNumber}`} name="message" rows={2} required maxLength={2000} placeholder="پاسخ مدیر…"/><button className="btn small" disabled={busy}>{busy ? "در حال ارسال…" : "پاسخ خصوصی"}</button>{message && <span role="status">{message}</span>}</form>;
}
