"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

export default function PlanViewer({ planId }: { planId: string }) {
  const [fileUrl, setFileUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileData, setFileData] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("Fit-Pro-Program.pdf");
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function loadPlan() {
      try {
        const response = await fetch(`/api/plans/${encodeURIComponent(planId)}?view=1`, { cache: "no-store" });
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || "دریافت برنامه انجام نشد.");
        }
        const file = await response.blob();
        if (file.type !== "application/pdf") throw new Error("فایل دریافتی PDF معتبر نیست.");

        const encodedName = response.headers.get("Content-Disposition")?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
        if (encodedName) {
          try { setFileName(decodeURIComponent(encodedName)); } catch { /* Use the safe fallback filename. */ }
        }
        objectUrl = URL.createObjectURL(file);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setFileData(file);
        setFileUrl(objectUrl);
        setPreviewUrl(`/api/plans/${encodeURIComponent(planId)}?view=1`);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "بارگذاری برنامه انجام نشد.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPlan();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [planId]);

  async function downloadPlan() {
    if (!fileUrl || !fileData) return;
    setDownloadError("");
    const pickerWindow = window as SaveFilePickerWindow;
    if (pickerWindow.showSaveFilePicker) {
      try {
        const handle = await pickerWindow.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(fileData);
        await writable.close();
        return;
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        // If the picker is unavailable in an embedded browser, use the blob download below.
      }
    }

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return <main className="plan-viewer-page" dir="rtl">
    <div className="plan-viewer-toolbar">
      <Link className="btn light small" href="/dashboard">بازگشت به پنل</Link>
      <div className="plan-viewer-title"><span>Fit Pro / برنامهٔ اختصاصی</span><h1>{fileName.replace(/\.pdf$/i, "")}</h1></div>
      <button className="btn small" type="button" onClick={downloadPlan} disabled={!fileUrl}>دانلود PDF</button>
    </div>
    {downloadError && <div className="plan-viewer-download-error" role="alert">ذخیرهٔ فایل انجام نشد: {downloadError}</div>}
    {error ? <section className="plan-viewer-message" role="alert"><b>برنامه باز نشد</b><p>{error}</p><Link className="btn small" href="/dashboard">بازگشت به پنل</Link></section> : loading ? <section className="plan-viewer-message" aria-live="polite">در حال بارگذاری برنامه…</section> : <iframe className="plan-viewer-frame" src={previewUrl} title="برنامهٔ تمرینی شما" />}
  </main>;
}
