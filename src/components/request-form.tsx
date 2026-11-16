"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Intake = Record<string, string | boolean>;
const blank: Intake = {
  age: "", height: "", weight: "", goal: "", activityLevel: "", experience: "", trainingDays: "", equipment: "",
  dietaryPreferences: "", allergies: "", injuries: "", healthConditions: "", notes: "", healthConsent: false,
};
const optional = new Set(["dietaryPreferences", "allergies", "injuries", "healthConditions", "notes"]);
const labels: Record<string, string> = {
  age: "سن (سال)", height: "قد (سانتی‌متر)", weight: "وزن (کیلوگرم)", goal: "هدف شما", activityLevel: "سطح فعالیت روزانه",
  experience: "سابقه تمرین", trainingDays: "روزهای در دسترس برای تمرین", equipment: "امکانات تمرین", dietaryPreferences: "ترجیحات غذایی",
  allergies: "حساسیت غذایی", injuries: "سابقه آسیب‌دیدگی", healthConditions: "بیماری یا محدودیت مرتبط", notes: "توضیحات تکمیلی",
};
const choices: Record<string, string[]> = {
  activityLevel: ["کم", "متوسط", "زیاد"],
  experience: ["تازه‌کار", "کمتر از یک سال", "یک تا سه سال", "بیش از سه سال"],
  trainingDays: ["1 تا 2 روز", "3 روز", "4 روز", "5 روز یا بیشتر"],
  equipment: ["باشگاه کامل", "دمبل و کش در منزل", "وزن بدن", "امکانات دیگر"],
};

export default function RequestForm({ requestId, packageId, title, initial }: { requestId: string; packageId: string; title: string; initial: Record<string, unknown> }) {
  const router = useRouter();
  const [values, setValues] = useState<Intake>({ ...blank, ...(initial as Intake) });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  function set(key: string, value: string | boolean) { setValues(current => ({ ...current, [key]: value })); }

  function input(key: string, placeholder: string, type = "text") {
    let min: number | undefined;
    let max: number | undefined;
    if (key === "age") { min = 15; max = 100; }
    if (key === "height") { min = 100; max = 240; }
    if (key === "weight") { min = 30; max = 300; }
    return <div className="field" key={key}>
      <label htmlFor={key}>{labels[key]} <small>({optional.has(key) ? "اختیاری" : "الزامی"})</small></label>
      <input id={key} type={type} min={min} max={max} required={!optional.has(key)} value={String(values[key] ?? "")} onChange={event => set(key, event.target.value)} placeholder={placeholder} />
    </div>;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, packageId, ...values }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ثبت اطلاعات انجام نشد.");
      setMessage(result.telegramSent ? "اطلاعات ثبت شد و برای مربی ارسال شد." : "اطلاعات ثبت شد؛ اعلان تلگرام ارسال نشد.");
      window.setTimeout(() => router.push("/dashboard"), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ثبت اطلاعات با خطا روبه‌رو شد.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="form request-intake-form" style={{ maxWidth: 780 }} onSubmit={submit}>
    <h2>{title}</h2>
    <p className="muted">پرداخت سفارش تأیید شده است. اطلاعات این فرم برای تنظیم برنامه دریافت می‌شود و رمزگذاری‌شده ذخیره خواهد شد.</p>
    {message && <div className="alert" role="status">{message}</div>}
    <div className="grid3">{input("age", "مثلاً 30", "number")}{input("height", "مثلاً 170", "number")}{input("weight", "مثلاً 70", "number")}</div>
    {input("goal", "مثلاً افزایش توان و ایجاد نظم در تمرین")}
    {Object.keys(choices).map(key => <div className="field" key={key}>
      <label htmlFor={key}>{labels[key]}</label>
      <select id={key} required value={String(values[key] ?? "")} onChange={event => set(key, event.target.value)}>
        <option value="">انتخاب کنید</option>{choices[key].map(choice => <option key={choice}>{choice}</option>)}
      </select>
    </div>)}
    {input("dietaryPreferences", "ترجیحات یا محدودیت غذایی")}
    {input("allergies", "در صورت نداشتن، خالی بگذارید")}
    {input("injuries", "آسیب‌های قبلی یا فعلی")}
    {input("healthConditions", "بیماری یا محدودیت مرتبط، در صورت وجود")}
    {input("notes", "نکته‌ای که به شناخت بهتر شرایط شما کمک می‌کند")}
    <div className="field">
      <label className="consent-line"><input type="checkbox" required checked={Boolean(values.healthConsent)} onChange={event => set("healthConsent", event.target.checked)} />
        موافقم اطلاعات این فرم برای مربی ارسال شود تا برنامه متناسب تنظیم شود.</label>
    </div>
    <p className="muted" style={{ fontSize: 12 }}>این خدمت جایگزین ارزیابی یا توصیه پزشکی نیست. اگر محدودیت پزشکی دارید، پیش از شروع تمرین با پزشک مشورت کنید.</p>
    <button className="btn" disabled={busy}>{busy ? "در حال ثبت…" : "ثبت اطلاعات و ارسال برای مربی"}</button>
  </form>;
}
