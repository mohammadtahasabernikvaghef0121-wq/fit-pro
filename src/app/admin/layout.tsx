import { redirect } from "next/navigation";
import { currentUser, isOwnerAdmin } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isOwnerAdmin(user)) redirect("/");
  return <>{children}</>;
}
