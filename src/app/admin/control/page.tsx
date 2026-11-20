import AdminDashboard from "@/components/admin-dashboard";

export const metadata = { title: "مدیریت سایت", robots: { index: false, follow: false } };

export default function AdminControlPage() {
  return <AdminDashboard initialView="control" />;
}
