import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SupportInbox from "@/components/support-inbox";
export const metadata: Metadata = { title: "پشتیبانی خصوصی Fit Pro", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function SupportPage() {
  const user = await currentUser();
  const rows = user?.role === "CLIENT" ? await db.supportRequest.findMany({ where: { userId: user.id, source: "WEBSITE" }, include: { replies: { orderBy: { createdAt: "asc" }, select: { id: true, text: true, isAdmin: true, createdAt: true } } }, orderBy: { createdAt: "desc" } }) : [];
  const initial = rows.map(row => ({ requestNumber: row.requestNumber, status: row.status, createdAt: row.createdAt.toISOString(), message: row.messageText || "", replies: row.replies.map(reply => ({ ...reply, createdAt: reply.createdAt.toISOString() })) }));
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "09011825420";
  return <main className="container page support-page" dir="rtl"><header className="support-heading"><span className="eyebrow">مرکز پشتیبانی</span><h1>پشتیبانی Fit Pro</h1><p className="muted">درخواستت را ارسال کن؛ گفت‌وگو در حساب کاربری خودت و پنل مدیر باقی می‌ماند.</p><a className="support-phone" href={`tel:${phone.replace(/[^+\d]/g, "")}`}><span>تماس با پشتیبانی</span><b dir="ltr">{phone}</b></a><p className="support-hours"><span>ساعت پاسخ‌گویی</span><b dir="ltr">09:00–13:00 <i>و</i> 17:00–19:00</b></p></header>{user?.role === "CLIENT" ? <SupportInbox initial={initial}/> : <section className="support-login-prompt"><h2>برای گفت‌وگوی خصوصی وارد حساب شوید</h2><p className="muted">ورود لازم است تا فقط شما و مدیر بتوانید درخواست و پاسخ‌ها را ببینید.</p><a className="btn" href="/login?next=/support">ورود یا ساخت حساب</a></section>}</main>;
}
