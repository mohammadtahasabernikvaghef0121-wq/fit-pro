import { formatTomans } from "@/lib/money";
import {redirect} from "next/navigation";
import Link from "next/link";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {paymentStatusLabel,requestStatusLabel} from "@/lib/labels";
export const metadata={title:"پنل کاربری",robots:{index:false,follow:false}};
const date=(d:Date)=>new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn",{dateStyle:"medium",timeZone:"Asia/Tehran"}).format(d);
export default async function Dashboard(){
 const user=await currentUser();if(!user)redirect("/login?next=/dashboard");if(user.role==="ADMIN")redirect("/admin");
 const requests=await db.coachingRequest.findMany({where:{userId:user.id},include:{package:true,payments:{orderBy:{createdAt:"desc"}},plans:true},orderBy:{createdAt:"desc"}});
 const history=requests.flatMap(request=>request.payments.map(payment=>({payment,request}))).sort((a,b)=>b.payment.createdAt.getTime()-a.payment.createdAt.getTime());
 return <main className="container dashboard"><aside className="side"><a className="active" href="/dashboard">نمای کلی</a><Link href="/dashboard/requests/new">ثبت درخواست</Link><Link href="/support">پشتیبانی</Link><a href="/api/auth/logout">خروج از حساب</a></aside><section>
  <div className="dashhead"><div><span className="eyebrow">پنل همراهی</span><h1 style={{margin:"8px 0"}}>سلام{user.name?`، ${user.name}`:""}</h1></div><Link className="btn small" href="/dashboard/requests/new">درخواست برنامه جدید</Link></div>
  <div className="card" style={{marginBottom:16}}><b>اطلاعات حساب</b><p dir="ltr" style={{textAlign:"right",marginBottom:0}}>{user.phone}</p></div>
  <div className="stats"><div className="stat">درخواست‌های من<b>{requests.filter(x=>x.status!=="DRAFT").length.toLocaleString("en-US")}</b></div><div className="stat">پیش‌نویس‌ها<b>{requests.filter(x=>x.status==="DRAFT").length.toLocaleString("en-US")}</b></div><div className="stat">برنامه‌های تحویل‌شده<b>{requests.filter(x=>x.status==="DELIVERED").length.toLocaleString("en-US")}</b></div></div>
  <h2 style={{marginTop:28}}>درخواست‌ها و برنامه‌های من</h2>
  {requests.length===0?<div className="card"><p>هنوز درخواستی ثبت نکرده‌اید. با یک برنامه متناسب با هدفتان شروع کنید.</p><Link href="/shop" className="btn">دیدن برنامه‌ها</Link></div>:<div className="table-wrap"><table><thead><tr><th>برنامه</th><th>تاریخ ثبت</th><th>وضعیت درخواست</th><th>پرداخت</th><th>فایل برنامه</th></tr></thead><tbody>{requests.map(r=><tr key={r.id}><td>{r.package.title}</td><td>{date(r.createdAt)}</td><td><span className="badge">{r.status==="PAID"?<Link href={`/dashboard/requests/new?request=${r.id}`}>تکمیل اطلاعات</Link>:r.status==="NEW"?<Link href={`/dashboard/requests/new?package=${r.packageId}&request=${r.id}`}>ادامه پرداخت</Link>:r.status==="DRAFT"?"پیش‌نویس قدیمی":requestStatusLabel[r.status]}</span></td><td>{r.payments[0]?paymentStatusLabel[r.payments[0].status]:r.status==="DRAFT"?"—":"در انتظار پرداخت"}</td><td>{r.plans.length?r.plans.map(p=><a key={p.id} href={`/api/plans/${p.id}`} style={{display:"block",color:"#7a0d1a"}}>↓ {p.title}</a>):"—"}</td></tr>)}</tbody></table></div>}
  <h2 style={{marginTop:28}}>سوابق پرداخت</h2>
  {history.length===0?<div className="card">هنوز تراکنشی برای نمایش وجود ندارد.</div>:<div className="table-wrap"><table><thead><tr><th>برنامه</th><th>مبلغ (تومان)</th><th>وضعیت</th><th>تاریخ تراکنش</th></tr></thead><tbody>{history.map(({payment,request})=><tr key={payment.id}><td>{request.package.title}</td><td>{formatTomans(payment.amountRials)}</td><td>{paymentStatusLabel[payment.status]}</td><td>{new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Tehran"}).format(payment.createdAt)}</td></tr>)}</tbody></table></div>}
 </section></main>;
}
