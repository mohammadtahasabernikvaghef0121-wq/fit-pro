import {redirect,notFound} from "next/navigation";
import Link from "next/link";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {decryptHealthData} from "@/lib/health-data";
import {paymentStatusLabel,requestStatusLabel} from "@/lib/labels";
import AdminRequestTools from "@/components/admin-request-tools";
export const metadata={title:"جزئیات درخواست",robots:{index:false,follow:false}};
export default async function RequestDetail({params}:{params:Promise<{id:string}>}){
 const u=await currentUser();if(!u)redirect("/login?next=/admin");if(u.role!=="ADMIN")redirect("/dashboard");
 const {id}=await params;const r=await db.coachingRequest.findUnique({where:{id},include:{user:true,package:true,payments:{orderBy:{createdAt:"desc"}},plans:true}});if(!r)notFound();
 const intake=decryptHealthData(r.intake);const labels:Record<string,string>={age:"سن",height:"قد",weight:"وزن",goal:"هدف",activityLevel:"سطح فعالیت",experience:"سابقه تمرین",trainingDays:"روزهای تمرین",equipment:"امکانات",dietaryPreferences:"ترجیحات غذایی",allergies:"حساسیت‌ها",injuries:"سابقه آسیب‌دیدگی",healthConditions:"وضعیت سلامتی",notes:"توضیحات"};
 return <main className="container page"><Link href="/admin/requests">← بازگشت به درخواست‌ها</Link><h1>جزئیات درخواست</h1><div className="grid3"><div className="card"><b>شماره همراه</b><p dir="ltr">{r.user.phone}</p></div><div className="card"><b>بسته</b><p>{r.package.title}</p></div><div className="card"><b>پرداخت</b><p>{r.payments[0]?paymentStatusLabel[r.payments[0].status]:"—"}</p><p>وضعیت درخواست: {requestStatusLabel[r.status]}</p></div></div>
  <section className="card" style={{marginTop:18}}><h2>پاسخ‌های فرم</h2><dl>{Object.entries(intake).filter(([k])=>k!=="healthConsent"&&k!=="packageId"&&k!=="requestId").map(([k,v])=><div key={k} style={{padding:"8px 0",borderBottom:"1px solid #eadfe0"}}><dt style={{fontWeight:700}}>{labels[k]??k}</dt><dd style={{margin:"5px 0",color:"#70595c"}}>{typeof v==="boolean"?(v?"بله":"خیر"):String(v??"—")}</dd></div>)}</dl><p className="muted" style={{fontSize:12}}>رضایت بررسی اطلاعات سلامت: {r.healthConsent?"ثبت شده":"ثبت نشده"}</p></section>
  {r.plans.length>0&&<section className="card" style={{marginTop:18}}><h2>فایل‌های تحویل‌شده</h2>{r.plans.map(p=><p key={p.id}><a href={`/api/plans/${p.id}`}>↓ {p.title}</a></p>)}</section>}
  <AdminRequestTools id={r.id} status={r.status} notes={r.adminNotes??""} paid={r.payments.some(p=>p.status==="PAID")}/>
 </main>;
}
