import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,isSameOrigin} from "@/lib/auth";
import {db} from "@/lib/db";
import {createZibalPayment} from "@/lib/zibal";
import {sendOrderCreatedToTelegram} from "@/lib/telegram";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!isSameOrigin(req))return NextResponse.json({error:"درخواست معتبر نیست."},{status:403});
 let paymentId:string|undefined;
 try{
  const user=await currentUser();if(!user)return NextResponse.json({error:"ابتدا وارد حساب شوید."},{status:401});
  const {requestId}=z.object({requestId:z.string().min(1)}).parse(await req.json());
  const reservation=await db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT "id" FROM "CoachingRequest" WHERE "id" = ${requestId} FOR UPDATE`;
   const request=await tx.coachingRequest.findFirst({where:{id:requestId,userId:user.id},include:{package:true,payments:true}});
   if(!request)return {error:"درخواست پیدا نشد.",status:404 as const};
   if(request.status!=="NEW")return {error:"وضعیت این درخواست برای پرداخت فعال نیست.",status:409 as const};
   if(request.payments.some(p=>p.status==="PAID"||p.status==="DEMO_PAID"))return {error:"این درخواست قبلاً پرداخت شده است.",status:409 as const};
   const pending=await tx.payment.findFirst({where:{requestId,status:"PENDING",createdAt:{gt:new Date(Date.now()-20*60_000)}},orderBy:{createdAt:"desc"}});
   const mockMode=process.env.NODE_ENV==="development"&&process.env.PAYMENT_MODE==="mock";
   if(pending?.trackId&&!mockMode)return {url:`https://gateway.zibal.ir/start/${encodeURIComponent(pending.trackId)}`};
   if(pending&&!mockMode)return {error:"درخواست پرداخت در حال آماده‌سازی است. چند لحظه دیگر تلاش کنید.",status:409 as const};
   await tx.payment.updateMany({where:{requestId,status:"PENDING"},data:{status:"FAILED"}});
   const payment=await tx.payment.create({data:{requestId,amountRials:request.package.priceRials,orderRef:`fit-${request.id}-${Date.now()}`}});
   return {payment,phone:user.phone,customerName:user.name || "",packageName:request.package.title,description:`سفارش برنامه ${request.package.title}`};
  });
  if("error" in reservation)return NextResponse.json({error:reservation.error},{status:reservation.status});
  if("url" in reservation)return NextResponse.json({url:reservation.url});
  paymentId=reservation.payment.id;
  if(process.env.NODE_ENV==="development"&&process.env.PAYMENT_MODE==="mock"){
   const completed=await db.$transaction(async tx=>{
    const paid=await tx.payment.updateMany({where:{id:reservation.payment.id,status:"PENDING"},data:{status:"DEMO_PAID",paidAt:new Date(),trackId:`DEMO-${reservation.payment.id}`,gatewayResponse:{mode:"mock",notice:"No money was transferred."}}});
    if(!paid.count)throw new Error("Demo payment could not be completed.");
    await tx.coachingRequest.updateMany({where:{id:reservation.payment.requestId,status:"NEW"},data:{status:"PAID"}});
    return tx.coachingRequest.findUnique({where:{id:reservation.payment.requestId},select:{id:true}});
   });
   if(!completed)throw new Error("Demo order was not found after payment.");
   return NextResponse.json({url:`/dashboard/requests/new?request=${completed.id}`,demo:true});
  }
  const base=process.env.NEXT_PUBLIC_SITE_URL??new URL(req.url).origin;
  const created=await createZibalPayment({amountRials:Number(reservation.payment.amountRials),orderId:reservation.payment.orderRef,callbackUrl:`${base}/api/payments/callback`,description:reservation.description,mobile:reservation.phone});
  await db.payment.update({where:{id:paymentId},data:{trackId:created.trackId,gatewayResponse:created.gatewayResponse}});
  try {
   const sent=await sendOrderCreatedToTelegram({amountRials:reservation.payment.amountRials,orderRef:reservation.payment.orderRef,requestId:reservation.payment.requestId,packageName:reservation.packageName,customerName:reservation.customerName,phone:reservation.phone});
   if(!sent)console.error("Private order-created Telegram notification was not accepted.");
  }catch(error){console.error("Private order-created Telegram notification failed",error instanceof Error?error.message:"unknown error")}
  return NextResponse.json({url:created.url});
 }catch{
  if(paymentId)await db.payment.updateMany({where:{id:paymentId,status:"PENDING",trackId:null},data:{status:"FAILED"}}).catch(()=>undefined);
  return NextResponse.json({error:"امکان آغاز پرداخت وجود ندارد. کمی بعد دوباره تلاش کنید."},{status:400});
 }
}
