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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-cim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
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
      <h3 className="mb-2 text-sm font-medium text-white">Paste from CIM</h3>
      <p className="mb-2 text-xs text-zinc-500">Paste a CIM or financial document excerpt; we&apos;ll extract revenue, EBITDA, and addbacks.</p>
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
          disabled={loading || !text.trim()}
          className="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Extracting…" : "Extract & apply"}
        </button>
      </div>
    </div>
  );
}
