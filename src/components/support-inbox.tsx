"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "./support-inbox.module.css";

type Reply = { id: string; text: string; isAdmin: boolean; createdAt: string };
type Thread = { requestNumber: number; status: string; createdAt: string; message: string; replies: Reply[]; telegramNotified?: boolean };
const labels: Record<string, string> = { PENDING: "در انتظار پاسخ", IN_PROGRESS: "در حال پیگیری", REPLIED: "پاسخ داده شد", CLOSED: "بسته‌شده" };
const format = (date: string) => new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }).format(new Date(date));

export default function SupportInbox({ initial }: { initial: Thread[] }) {
  const [threads, setThreads] = useState(initial); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => { try { const response = await fetch("/api/support", { cache: "no-store" }); if (!response.ok) return; const data = await response.json(); setThreads(data.requests); } catch { /* Keep the last loaded private conversation visible. */ } }, []);
  useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 12_000); return () => window.clearInterval(timer); }, [refresh]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); const form = event.currentTarget; const message = new FormData(form).get("message");
    try { const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "ثبت پیام انجام نشد."); setThreads(current => [data, ...current]); form.reset(); setNotice(`درخواست #${data.requestNumber} در گفت‌وگوی خصوصی شما ثبت شد.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : "ارسال پیام انجام نشد."); } finally { setBusy(false); }
  }
  async function reply(event: FormEvent<HTMLFormElement>, number: number) {
    event.preventDefault(); const form = event.currentTarget; const message = new FormData(form).get("message");
    try { const response = await fetch("/api/coach/replies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestNumber: number, message }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "ارسال پیام انجام نشد."); setThreads(current => current.map(thread => thread.requestNumber === number ? { ...thread, status: "IN_PROGRESS", replies: [...thread.replies, data.reply] } : thread)); form.reset(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "ارسال پیام انجام نشد."); }
  }
  return <div className={styles.layout}>
    <section className={styles.compose}><span className="eyebrow">پشتیبانی Fit Pro</span><h2>چطور می‌توانیم کمک کنیم؟</h2><p className="muted">پیام شما فقط برای حساب خودتان و مدیر سایت قابل مشاهده است.</p>{notice && <div className={styles.notice} role="status">{notice}</div>}<form onSubmit={create}><label htmlFor="support-message">متن درخواست</label><textarea id="support-message" name="message" rows={5} minLength={2} maxLength={2000} required placeholder="سؤال یا درخواست خود را بنویسید…"/><button className="btn" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال درخواست خصوصی"}</button></form></section>
    <section className={styles.inbox}><div className={styles.heading}><div><span className="eyebrow">صندوق خصوصی</span><h2>گفت‌وگوهای من</h2></div><span className={styles.privateBadge}>🔒 فقط شما و مدیر</span></div>{threads.length === 0 ? <div className={styles.empty}>هنوز گفت‌وگویی ندارید. درخواست شما و پاسخ مدیر همین‌جا نمایش داده می‌شود.</div> : <div className={styles.threads}>{threads.map(thread => <article className={styles.thread} key={thread.requestNumber}><header><b>درخواست #{thread.requestNumber}</b><span>{labels[thread.status] || thread.status}</span><time>{format(thread.createdAt)}</time></header><div className={styles.messages}><div className={styles.customer}><b>پیام شما</b><p>{thread.message}</p><time>{format(thread.createdAt)}</time></div>{thread.replies.map(item => <div className={item.isAdmin ? styles.admin : styles.customer} key={item.id}><b>{item.isAdmin ? "پشتیبانی Fit Pro" : "پیام شما"}</b><p>{item.text}</p><time>{format(item.createdAt)}</time></div>)}</div>{thread.status !== "CLOSED" && <form className={styles.replyForm} onSubmit={event => void reply(event, thread.requestNumber)}><label className="sr-only" htmlFor={`support-reply-${thread.requestNumber}`}>پاسخ به درخواست {thread.requestNumber}</label><textarea id={`support-reply-${thread.requestNumber}`} name="message" rows={2} maxLength={2000} required placeholder="پیام دیگری بنویسید…"/><button className="btn small">ارسال</button></form>}</article>)}</div>}</section>
  </div>;
}
