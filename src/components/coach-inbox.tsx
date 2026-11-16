"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "./coach-inbox.module.css";

type Reply = { id: string; text: string; isAdmin: boolean; createdAt: string };
type CoachRequest = { requestNumber: number; status: string; createdAt: string; message: string; intake: Record<string, unknown>; replies: Reply[]; telegramNotified?: boolean };
const statusLabels: Record<string, string> = { PENDING: "در انتظار پاسخ", IN_PROGRESS: "در حال پیگیری", REPLIED: "پاسخ داده‌شده", CLOSED: "بسته‌شده" };
const date = (value: string) => new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }).format(new Date(value));

export default function CoachInbox({ initialRequests, initialName, phone }: { initialRequests: CoachRequest[]; initialName: string; phone: string }) {
  const [requests, setRequests] = useState(initialRequests);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [replyBusy, setReplyBusy] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/coach/requests", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setRequests(data.requests.map((fresh: CoachRequest) => ({
        ...fresh,
        replies: fresh.replies.map((reply: Reply) => ({ ...reply, isAdmin: reply.isAdmin })),
      })));
    } catch { /* Keep the last successfully loaded messages visible during a temporary disconnect. */ }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"), age: data.get("age"), height: data.get("height"), weight: data.get("weight"),
      goal: data.get("goal"), experience: data.get("experience"), activityLevel: data.get("activityLevel"),
      trainingDays: data.get("trainingDays"), injuries: data.get("injuries"), healthConditions: data.get("healthConditions"),
      equipment: data.get("equipment"), notes: data.get("notes"), message: data.get("message"), shareHealthData: data.get("shareHealthData") === "on",
    };
    try {
      const response = await fetch("/api/coach/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ثبت درخواست انجام نشد.");
      setRequests((current) => [{ ...result, intake: payload, replies: [] }, ...current]);
      form.reset();
      setNotice({ text: result.telegramNotified ? `درخواست #${result.requestNumber} برای مربی ارسال شد.` : `درخواست #${result.requestNumber} ذخیره شد، اما اعلان تلگرام ارسال نشد. تنظیمات ربات را بررسی کنید.`, error: !result.telegramNotified });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "ثبت درخواست انجام نشد.", error: true });
    } finally { setBusy(false); }
  }

  async function submitReply(event: FormEvent<HTMLFormElement>, requestNumber: number) {
    event.preventDefault();
    setReplyBusy(requestNumber); setNotice(null);
    const form = event.currentTarget;
    const message = new FormData(form).get("reply");
    try {
      const response = await fetch("/api/coach/replies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestNumber, message }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "پیام ارسال نشد.");
      setRequests((current) => current.map((request) => request.requestNumber === requestNumber ? { ...request, status: "IN_PROGRESS", replies: [...request.replies, result.reply] } : request));
      form.reset();
      if (!result.telegramNotified) setNotice({ text: "پیام در گفت‌وگو ثبت شد، اما اعلان تلگرام ارسال نشد.", error: true });
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : "پیام ارسال نشد.", error: true }); }
    finally { setReplyBusy(null); }
  }

  return <div className={styles.layout}>
    <section className={styles.newRequest} aria-labelledby="coach-form-heading">
      <div className={styles.cardHeading}><span className={styles.icon} aria-hidden="true">✉</span><div><h2 id="coach-form-heading">درخواست تازه</h2><p>با اطلاعات دقیق‌تر، راهنمایی متناسب‌تری می‌گیری.</p></div></div>
      <div className={styles.phone}>شماره‌ی تأییدشده‌ی حساب <b dir="ltr">{phone}</b></div>
      <form onSubmit={submitRequest}>
        <div className={styles.fields}>
          <Field label="نام و نام خانوادگی" name="name" defaultValue={initialName} maxLength={100} required autoComplete="name" />
          <Field label="سن" name="age" type="number" min="13" max="100" required />
          <Field label="قد (سانتی‌متر)" name="height" type="number" min="80" max="250" step="0.1" required />
          <Field label="وزن (کیلوگرم)" name="weight" type="number" min="20" max="400" step="0.1" required />
          <Field label="هدف اصلی" name="goal" placeholder="مثلاً افزایش قدرت یا کاهش وزن" maxLength={300} required />
          <Field label="سابقه‌ی تمرین" name="experience" placeholder="مدت و نوع تمرین‌هایی که انجام داده‌ای" maxLength={300} required />
          <Field label="میزان فعالیت روزانه" name="activityLevel" placeholder="کم، متوسط یا زیاد" maxLength={200} />
          <Field label="روزهای قابل تمرین در هفته" name="trainingDays" placeholder="مثلاً 3 روز" maxLength={100} />
          <Field label="امکانات تمرین" name="equipment" placeholder="باشگاه، خانه یا تجهیزات موجود" maxLength={300} />
          <label className={styles.wideField}>آسیب‌دیدگی یا درد فعلی/گذشته<textarea name="injuries" rows={3} maxLength={1500} placeholder="اگر موردی هست، توضیح بده؛ در غیر این صورت خالی بگذار." /></label>
          <label className={styles.wideField}>بیماری یا محدودیت سلامتی<textarea name="healthConditions" rows={3} maxLength={1500} placeholder="در صورت ارتباط با تمرین، توضیح بده." /></label>
          <label className={styles.wideField}>توضیحات تکمیلی<textarea name="notes" rows={3} maxLength={1500} /></label>
          <label className={styles.wideField}>پیام یا پرسشت برای مربی<textarea name="message" rows={4} maxLength={2000} required placeholder="سؤال یا توضیحی که می‌خواهی مربی بخواند…" /></label>
        </div>
        <label className={styles.consent}><input type="checkbox" name="shareHealthData" required /><span>موافقم اطلاعات این فرم برای بررسی مربی در فضای خصوصی سایت ذخیره شود.</span></label>
        <p className={styles.privacy}>اطلاعات سلامتی به‌صورت رمزگذاری‌شده ذخیره می‌شود و فقط شما و مدیر سایت به گفت‌وگو دسترسی دارید. تلگرام فقط اعلان بدون متن پیام و اطلاعات شخصی دریافت می‌کند.</p>
        {notice && <p className={notice.error ? styles.error : styles.success} role={notice.error ? "alert" : "status"}>{notice.text}</p>}
        <button className={styles.submit} type="submit" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال درخواست به مربی"}<span aria-hidden="true">←</span></button>
      </form>
    </section>

    <section className={styles.inbox} aria-labelledby="inbox-heading">
      <div className={styles.inboxHeading}><div><span className="eyebrow">صندوق پیام خصوصی</span><h2 id="inbox-heading">گفت‌وگوهای من</h2></div><span className={styles.live}><i /> به‌روزرسانی خودکار</span></div>
      {requests.length === 0 ? <div className={styles.empty}>هنوز گفت‌وگویی نداری. فرم درخواست را پر کن تا پیام‌هایت اینجا نمایش داده شوند.</div> : <div className={styles.threads}>{requests.map((request) => <article className={styles.thread} key={request.requestNumber}>
        <header className={styles.threadHeader}><div><b>درخواست #{request.requestNumber}</b><time>{date(request.createdAt)}</time></div><span className={styles.status}>{statusLabels[request.status] || request.status}</span></header>
        <details className={styles.details}><summary>مشاهده اطلاعات ثبت‌شده</summary><dl>{Object.entries(request.intake).filter(([, value]) => value !== "" && value !== undefined).map(([key, value]) => <div key={key}><dt>{({ age: "سن", height: "قد", weight: "وزن", goal: "هدف", experience: "سابقه تمرین", activityLevel: "فعالیت روزانه", trainingDays: "روزهای تمرین", injuries: "آسیب‌دیدگی", healthConditions: "محدودیت سلامتی", equipment: "امکانات تمرین", notes: "توضیحات" } as Record<string, string>)[key] || key}</dt><dd>{String(value)}</dd></div>)}</dl></details>
        <div className={styles.messages}><div className={styles.customerMessage}><b>پیام شما</b><p>{request.message}</p><time>{date(request.createdAt)}</time></div>{request.replies.map((reply) => <div className={reply.isAdmin ? styles.adminMessage : styles.customerMessage} key={reply.id}><b>{reply.isAdmin ? "پاسخ مربی Fit Pro" : "پیام شما"}</b><p>{reply.text}</p><time>{date(reply.createdAt)}</time></div>)}</div>
        {request.status !== "CLOSED" && <form className={styles.replyForm} onSubmit={(event) => void submitReply(event, request.requestNumber)}><label className="sr-only" htmlFor={`reply-${request.requestNumber}`}>پیام در گفت‌وگوی #{request.requestNumber}</label><textarea id={`reply-${request.requestNumber}`} name="reply" rows={2} required maxLength={2000} placeholder="پیام دیگری برای مربی بنویس…" /><button className={styles.replyButton} disabled={replyBusy === request.requestNumber}>{replyBusy === request.requestNumber ? "…" : "ارسال"}</button></form>}
      </article>)}</div>}
    </section>
  </div>;
}

function Field({ label, name, type = "text", ...props }: { label: string; name: string; type?: string; [key: string]: unknown }) {
  return <label className={styles.field}>{label}<input name={name} type={type} {...props} /></label>;
}
