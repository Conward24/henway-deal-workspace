"use client";

import { useState } from "react";
import type { Deal } from "@/types";
import type { ExtractCimResponse } from "@/app/api/extract-cim/route";

interface Props {
  onApply: (updates: Partial<Deal>) => void;
  hasReplicateToken?: boolean;
}

export default function CimPasteForm({ onApply, hasReplicateToken = false }: Props) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!file && !text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let res: Response;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        if (text.trim()) {
          formData.append("text", text.trim());
        }
        res = await fetch("/api/extract-cim", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/extract-cim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Extraction failed");
      const result = data as ExtractCimResponse;
      const updates: Partial<Deal> = {
        lastUpdated: new Date().toISOString(),
      };
      if (result.revenue != null) updates.revenue = result.revenue;
      if (result.reportedEbitda != null) updates.reportedEbitda = result.reportedEbitda;
      if (result.addbacks?.length) updates.addbacks = result.addbacks;
      if (result.deductions?.length) updates.deductions = result.deductions;
      if (result.dealName) updates.name = result.dealName;
      if (result.industry) updates.industry = result.industry;
      if (result.reportedEbitda != null && result.addbacks) {
        const addTotal = result.addbacks.reduce((s, a) => s + a.amount, 0);
        const dedTotal = (result.deductions ?? []).reduce((s, d) => s + d.amount, 0);
        updates.adjustedEbitda = result.reportedEbitda + addTotal + dedTotal;
      } else if (result.reportedEbitda != null) updates.adjustedEbitda = result.reportedEbitda;
      onApply(updates);
      setText("");
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  if (!hasReplicateToken) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised p-3 text-sm text-zinc-500">
        Add <code className="rounded bg-surface px-1">REPLICATE_API_TOKEN</code> to .env.local to enable &quot;Paste from CIM&quot; extraction.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <h3 className="mb-2 text-sm font-medium text-white">CIM import</h3>
      <p className="mb-2 text-xs text-zinc-500">
        Upload a CIM PDF or paste a financial excerpt; we&apos;ll extract revenue, EBITDA, and addbacks.
      </p>
      <div className="mb-2 flex flex-col gap-2 text-xs text-zinc-500">
        <label className="inline-flex items-center gap-2">
          <span className="shrink-0">PDF file:</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
            }}
            className="text-xs text-zinc-400 file:mr-2 file:rounded file:border-none file:bg-surface file:px-2 file:py-1 file:text-xs file:text-zinc-200"
          />
        </label>
        <span className="text-[11px] text-zinc-600">
          If you prefer, you can still paste text below instead of uploading a PDF.
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text from CIM or financials here..."
        rows={4}
        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-brand focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleExtract}
          disabled={loading || (!text.trim() && !file)}
          className="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Extracting…" : "Extract & apply"}
        </button>
      </div>
    </div>
  );
}
