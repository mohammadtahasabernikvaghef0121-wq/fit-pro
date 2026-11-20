import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyZibalPayment } from "@/lib/zibal";
import { isVerifiedPayment } from "@/lib/policies";
import { decryptHealthData } from "@/lib/health-data";
import { sendPaymentConfirmedToTelegram } from "@/lib/telegram";

async function notifyPaymentOnce(paymentId: string) {
  const now = new Date();
  const claim = await db.payment.updateMany({
    where: { id: paymentId, status: "PAID", telegramNotifiedAt: null, OR: [{ telegramNotifyLeaseUntil: null }, { telegramNotifyLeaseUntil: { lt: now } }] },
    data: { telegramNotifyLeaseUntil: new Date(now.getTime() + 45_000) },
  });
  if (!claim.count) return;
  try {
    const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { request: { include: { user: true, package: true } } } });
    if (!payment || payment.status !== "PAID") return;
    const notice = {
      amountRials: payment.amountRials,
      orderRef: payment.orderRef,
      transactionRef: payment.trackId || "ثبت نشده",
      requestId: payment.requestId,
      packageName: payment.request.package.title,
      customerName: payment.request.user.name || "",
      phone: payment.request.user.phone,
      intake: decryptHealthData(payment.request.intake),
    };
    let sent = false;
    for (let attempt = 0; attempt < 3 && !sent; attempt += 1) {
      try { sent = await sendPaymentConfirmedToTelegram(notice); }
      catch (error) { if (attempt === 2) throw error; }
      if (!sent && attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
    if (!sent) throw new Error("Telegram payment notification was not accepted.");
    await db.payment.update({ where: { id: paymentId }, data: { telegramNotifiedAt: new Date(), telegramNotifyLeaseUntil: null } });
  } catch (error) {
    console.error("Payment was confirmed but its Telegram notification failed", error instanceof Error ? error.message : "unknown error");
    await db.payment.updateMany({ where: { id: paymentId, telegramNotifiedAt: null }, data: { telegramNotifyLeaseUntil: null } }).catch(() => undefined);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const trackId = url.searchParams.get("trackId");
  if (!trackId) return NextResponse.redirect(new URL("/payment/result?status=failed", url.origin));
  try {
    const payment = await db.payment.findUnique({ where: { trackId } });
    if (!payment) return NextResponse.redirect(new URL("/payment/result?status=failed", url.origin));
    if (payment.status === "DEMO_PAID") return NextResponse.redirect(new URL(`/dashboard/requests/new?request=${encodeURIComponent(payment.requestId)}`, url.origin));
    if (payment.status !== "PAID") {
      const verified = await verifyZibalPayment(trackId);
      if (isVerifiedPayment(Number(verified.result), Number(verified.amount), Number(payment.amountRials))) {
        await db.$transaction(async tx => {
          const finalized = await tx.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "PAID", paidAt: new Date(), gatewayResponse: verified } });
          if (finalized.count) await tx.coachingRequest.updateMany({ where: { id: payment.requestId, status: "NEW" }, data: { status: "PAID" } });
        });
      } else if (verified.result !== 201) {
        await db.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED", gatewayResponse: verified } });
      }
    }
    const latest = await db.payment.findUnique({ where: { id: payment.id }, select: { status: true } });
    if (latest?.status === "PAID") {
      await notifyPaymentOnce(payment.id);
      return NextResponse.redirect(new URL(`/dashboard/requests/new?request=${encodeURIComponent(payment.requestId)}`, url.origin));
    }
    const status = latest?.status === "PENDING" ? "pending" : "failed";
    return NextResponse.redirect(new URL(`/payment/result?status=${status}&request=${payment.requestId}`, url.origin));
  } catch {
    return NextResponse.redirect(new URL("/payment/result?status=pending", url.origin));
  }
}
