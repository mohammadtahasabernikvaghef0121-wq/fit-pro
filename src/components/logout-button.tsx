"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className, children }: { className?: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
      if (response.ok) { router.replace("/"); router.refresh(); }
    } finally { setBusy(false); }
  }
  return <button type="button" className={className} onClick={() => void logout()} disabled={busy}>{busy ? "در حال خروج…" : children}</button>;
}
