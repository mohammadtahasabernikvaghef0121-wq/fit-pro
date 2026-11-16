export function toTomans(amountRials: number | bigint): number {
  return Math.round(Number(amountRials) / 10);
}

export function formatTomans(amountRials: number | bigint): string {
  return toTomans(amountRials).toLocaleString("en-US");
}
