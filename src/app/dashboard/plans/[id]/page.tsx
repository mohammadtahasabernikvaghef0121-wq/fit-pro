import { redirect } from "next/navigation";
import PlanViewer from "@/components/plan-viewer";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "برنامه اختصاصی", robots: { index: false, follow: false } };

export default async function DeliveredPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/plans/${id}`)}`);
  return <PlanViewer planId={id} />;
}
