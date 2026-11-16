import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {currentUser,isOwnerAdmin,isSameOrigin} from "@/lib/auth";
import {db} from "@/lib/db";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!isSameOrigin(req))return NextResponse.json({error:"درخواست معتبر نیست."},{status:403});
 const u=await currentUser();if(!isOwnerAdmin(u))return NextResponse.json({error:"اجازه دسترسی ندارید."},{status:403});
 try{
  const form=await req.formData();const requestId=String(form.get("requestId")??"");const title=String(form.get("title")??"").trim();const file=form.get("file");
  if(!requestId||title.length<2||title.length>120||!(file instanceof File))return NextResponse.json({error:"اطلاعات فایل کامل نیست."},{status:400});
  if(file.size>10*1024*1024||file.type!=="application/pdf")return NextResponse.json({error:"فقط فایل PDF تا حداکثر 10 مگابایت پذیرفته می‌شود."},{status:400});
  const data=Buffer.from(await file.arrayBuffer());if(data.subarray(0,5).toString("ascii")!=="%PDF-")return NextResponse.json({error:"محتوای فایل PDF معتبر نیست."},{status:400});
  const request=await db.coachingRequest.findUnique({where:{id:requestId},include:{payments:true}});if(!request||!request.payments.some(p=>p.status==="PAID"))return NextResponse.json({error:"درخواست پرداخت‌شده‌ای با این شناسه پیدا نشد."},{status:404});
  const storageKey=`${randomUUID()}.pdf`;const dir=path.join(process.cwd(),".data","plans");await mkdir(dir,{recursive:true});await writeFile(path.join(dir,storageKey),data,{flag:"wx",mode:0o600});
  await db.$transaction(async tx=>{await tx.deliveredPlan.create({data:{requestId,title,storageKey,mimeType:"application/pdf",sizeBytes:data.length}});await tx.coachingRequest.update({where:{id:requestId},data:{status:"DELIVERED"}})});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"بارگذاری برنامه انجام نشد."},{status:400})}
}
