import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {requestStatusLabel,paymentStatusLabel} from "@/lib/labels";
import Link from "next/link";
export const metadata={title:"درخواست‌ها",robots:{index:false,follow:false}};
export default async function Requests({searchParams}:{searchParams:Promise<{q?:string;status?:string}>}){
 const user=await currentUser();if(!user)redirect("/login?next=/admin/requests");if(user.role!=="ADMIN")redirect("/dashboard");
 const q=await searchParams;const known=["NEW","PAID","UNDER_REVIEW","IN_PROGRESS","DELIVERED","CANCELLED"] as const;const status=known.includes(q.status as typeof known[number])?q.status as typeof known[number]:undefined;
 const rows=await db.coachingRequest.findMany({where:{status:status??{not:"DRAFT"},...(q.q?{OR:[{user:{phone:{contains:q.q}}},{package:{title:{contains:q.q,mode:"insensitive"}}}]}:{})},include:{user:true,package:true,payments:{orderBy:{createdAt:"desc"},take:1}},orderBy:{createdAt:"desc"},take:100});
 return <main className="container page"><Link href="/admin">← مدیریت</Link><h1>درخواست‌ها</h1><form className="card" style={{display:"flex",gap:10,flexWrap:"wrap"}}><input name="q" defaultValue={q.q} placeholder="جست‌وجو بر اساس شماره یا بسته"/><select name="status" defaultValue={status??""}><option value="">همه وضعیت‌ها</option>{known.map(s=><option key={s} value={s}>{requestStatusLabel[s]}</option>)}</select><button className="btn small">جست‌وجو</button></form>
 <div className="table-wrap"><table><thead><tr><th>شماره همراه</th><th>بسته</th><th>وضعیت</th><th>پرداخت</th><th>زمان ثبت</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.user.phone}</td><td>{r.package.title}</td><td>{requestStatusLabel[r.status]}</td><td>{r.payments[0]?paymentStatusLabel[r.payments[0].status]:"—"}</td><td>{new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn",{dateStyle:"medium",timeZone:"Asia/Tehran"}).format(r.createdAt)}</td><td><Link href={`/admin/requests/${r.id}`}>بررسی</Link></td></tr>)}</tbody></table></div></main>
}
