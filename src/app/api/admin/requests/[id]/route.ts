import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,isOwnerAdmin,isSameOrigin} from "@/lib/auth";
import {db} from "@/lib/db";
const body=z.object({status:z.enum(["PAID","UNDER_REVIEW","IN_PROGRESS","DELIVERED","CANCELLED"]),adminNotes:z.string().max(3000).optional()});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!isSameOrigin(req))return NextResponse.json({error:"درخواست معتبر نیست."},{status:403});
 const u=await currentUser();if(!isOwnerAdmin(u))return NextResponse.json({error:"اجازه دسترسی ندارید."},{status:403});
 try{const {id}=await params;const d=body.parse(await req.json());const item=await db.coachingRequest.findUnique({where:{id},include:{payments:true,plans:true}});if(!item)return NextResponse.json({error:"درخواست پیدا نشد."},{status:404});if(d.status==="PAID"&&!item.payments.some(p=>p.status==="PAID"))return NextResponse.json({error:"وضعیت پرداخت از درگاه تأیید نشده است."},{status:409});if(d.status==="DELIVERED"&&!item.plans.length)return NextResponse.json({error:"برای تحویل، ابتدا فایل برنامه را بارگذاری کنید."},{status:409});await db.coachingRequest.update({where:{id},data:{status:d.status,adminNotes:d.adminNotes}});return NextResponse.json({ok:true})}catch{return NextResponse.json({error:"تغییر وضعیت انجام نشد."},{status:400})}
}
