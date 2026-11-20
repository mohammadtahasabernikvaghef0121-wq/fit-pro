import { redirect } from "next/navigation";

export default function RemovedAdminPage(): never {
  redirect("/admin/control");
}
