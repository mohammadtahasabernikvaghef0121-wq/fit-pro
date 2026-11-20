import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import UserDashboard from "@/components/user-dashboard";

export const metadata = { title: "پنل کاربری", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard");
  if (user.role === "ADMIN") redirect("/admin");
  return <UserDashboard />;
}
