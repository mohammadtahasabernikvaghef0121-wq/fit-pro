export const DEMO_RECEIPT_PREFIX = "fitpro-demo-receipt-v1:";

export type DemoReceipt = {
  id: string;
  status: "success" | "failed";
  amountRials: number;
  createdAt: string;
  items: { id: string; title: string; quantity: number; priceRials: number }[];
};
