"use client";

import { useState, type FormEvent } from "react";
import styles from "./homepage-message-form.module.css";

export default function HomepageMessageForm() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), message: data.get("message") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ارسال پیام انجام نشد. دوباره تلاش کنید.");
      form.reset();
      setStatus({ kind: "success", text: "پیامتان با موفقیت ارسال شد. ممنون که با Fit Pro در ارتباط هستید." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "ارسال پیام انجام نشد. دوباره تلاش کنید." });
    } finally {
      setBusy(false);
    }
  }

  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.field}><label htmlFor="message-name">نام و نام خانوادگی</label><input id="message-name" name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder="نام خود را وارد کنید" /></div>
    <div className={styles.field}><label htmlFor="message-body">متن پیام</label><textarea id="message-body" name="message" minLength={1} maxLength={2000} required rows={5} placeholder="پیامتان را اینجا بنویسید" /></div>
    {status && <p className={status.kind === "success" ? styles.success : styles.error} role={status.kind === "success" ? "status" : "alert"}>{status.text}</p>}
    <button className={styles.submit} type="submit" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال پیام"}<span aria-hidden="true">←</span></button>
  </form>;
}
