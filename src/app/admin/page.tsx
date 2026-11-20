export const metadata = { robots: { index: false, follow: false } };

import AdminDashboard from "@/components/admin-dashboard";

export default function AdminPage() {
  return <AdminDashboard initialView="overview" />;
}
