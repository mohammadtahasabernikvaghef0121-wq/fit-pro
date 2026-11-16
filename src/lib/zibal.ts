const api = "https://gateway.zibal.ir/v1";
export async function createZibalPayment(input: { amountRials: number; orderId: string; callbackUrl: string; description: string; mobile: string }) {
  const merchant = process.env.ZIBAL_MERCHANT;
  if (!merchant) throw new Error("درگاه پرداخت پیکربندی نشده است.");
  const response = await fetch(`${api}/request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchant, ...input }), cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.result !== 100 || !result.trackId) throw new Error("دریافت درگاه پرداخت ناموفق بود.");
  return { trackId: String(result.trackId), gatewayResponse: result, url: `https://gateway.zibal.ir/start/${encodeURIComponent(String(result.trackId))}` };
}
export async function verifyZibalPayment(trackId: string) {
  const merchant = process.env.ZIBAL_MERCHANT;
  if (!merchant) throw new Error("درگاه پرداخت پیکربندی نشده است.");
  const response = await fetch(`${api}/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchant, trackId }), cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error("پاسخ درگاه قابل تأیید نیست.");
  return result;
}
