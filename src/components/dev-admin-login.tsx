"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function DevAdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const params = useSearchParams();
  async function login() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/dev-admin", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const next = params.get("next");
      location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : result.redirect;
    } catch (e) { setError(e instanceof Error ? e.message : "ورود انجام نشد."); setBusy(false); }
  }
  return <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
    <button type="button" className="btn light" disabled={busy} onClick={login}>{busy ? "لطفاً صبر کنید…" : "ورود مدیر برای تست محلی"}</button>
    {error && <p className="alert" role="alert">{error}</p>}
  </div>;
}
