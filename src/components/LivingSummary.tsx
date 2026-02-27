"use client";

import { useState } from "react";
import type { Deal, DealStatus, ConvictionLean, ChangeLogEntry } from "@/types";
import { formatCurrency, reportedVsAdjustedDeltaPercent, isEbitdaDeltaWarning, DEFAULT_EBITDA_DELTA_WARNING_PERCENT } from "@/lib/dealHelpers";
import { computeFinancing, purchasePriceFromMultiple } from "@/lib/sbaFinance";
import FinanceabilityBadge from "./FinanceabilityBadge";
import ChangeLogTable from "./ChangeLogTable";
import EditBaselineForm from "./EditBaselineForm";
import EditFinancingForm from "./EditFinancingForm";
import CimPasteForm from "./CimPasteForm";
import LoiDraftView from "./LoiDraftView";

const STATUS_OPTIONS: DealStatus[] = ["Investigating", "Needs Info", "Pass", "LOI Ready"];
const CONVICTION_OPTIONS: ConvictionLean[] = ["Move Forward", "Needs Work", "Pass"];

interface Props {
  deal: Deal;
  onUpdateDeal: (updates: Partial<Deal>) => void;
  hasReplicateToken?: boolean;
}

export default function LivingSummary({ deal, onUpdateDeal, hasReplicateToken = false }: Props) {
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [editingFinancing, setEditingFinancing] = useState(false);
  const [showLoiDraft, setShowLoiDraft] = useState(false);
  const [selectedMultipleIndex, setSelectedMultipleIndex] = useState(1); // 4x default

  const effectiveEbitda = deal.bankEbitdaOverride ?? deal.adjustedEbitda;
  const multiple = deal.purchaseMultiples[selectedMultipleIndex] ?? 4;
  const purchasePrice = deal.purchasePriceOverride ?? purchasePriceFromMultiple(effectiveEbitda, multiple);
  const financing = computeFinancing({
    adjustedEbitda: effectiveEbitda,
    purchasePrice,
    downPaymentPercent: deal.downPaymentPercent,
    sellerNotePercent: deal.sellerNotePercent,
    interestRate: deal.interestRate,
    amortizationYears: deal.amortizationYears,
    realEstateIncluded: deal.realEstateIncluded,
    rePrice: deal.rePrice,
    reTermYears: deal.reTermYears,
    reRate: deal.reRate,
    ownerCompAdjustment: deal.ownerCompAdjustment,
  });

  const deltaPercent = reportedVsAdjustedDeltaPercent(deal.reportedEbitda, deal.adjustedEbitda);
  const showEbitdaWarning = isEbitdaDeltaWarning(deal, DEFAULT_EBITDA_DELTA_WARNING_PERCENT);
  const topAdjustments = [
    ...deal.addbacks.map((a) => ({ ...a, label: a.description, amount: a.amount })),
    ...deal.deductions.map((d) => ({ ...d, label: d.description, amount: d.amount })),
  ]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 3);

  function addChangeLogEntry(entry: ChangeLogEntry) {
    onUpdateDeal({
      changeLog: [...deal.changeLog, entry],
      lastUpdated: new Date().toISOString(),
    });
  }

  function handleSaveBaseline(updates: Partial<Deal>) {
    onUpdateDeal(updates);
    setEditingBaseline(false);
  }

  function handleSaveFinancing(updates: Partial<Deal>) {
    onUpdateDeal(updates);
    setEditingFinancing(false);
  }

  return (
    <div className="space-y-6">
      {/* A) Header */}
      <header className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex-1 min-w-0">
          <input
            value={deal.name}
            onChange={(e) => onUpdateDeal({ name: e.target.value, lastUpdated: new Date().toISOString() })}
            className="w-full bg-transparent text-xl font-semibold text-white focus:outline-none focus:ring-0"
            placeholder="Deal name"
          />
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
            <input value={deal.industry} onChange={(e) => onUpdateDeal({ industry: e.target.value })} placeholder="Industry" className="w-32 bg-transparent focus:outline-none focus:ring-0" />
            <input value={deal.location} onChange={(e) => onUpdateDeal({ location: e.target.value })} placeholder="Location" className="w-32 bg-transparent focus:outline-none focus:ring-0" />
            <span>Updated {new Date(deal.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
        <select
          value={deal.status}
          onChange={(e) => onUpdateDeal({ status: e.target.value as DealStatus, lastUpdated: new Date().toISOString() })}
          className="rounded border border-border bg-surface-raised px-3 py-1.5 text-sm text-white"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="button" onClick={() => setShowLoiDraft(true)} className="rounded border border-border px-3 py-1.5 text-sm text-zinc-400 hover:bg-surface">
          Draft LOI
        </button>
      </header>

      {/* CIM paste */}
      <CimPasteForm hasReplicateToken={hasReplicateToken} onApply={(u) => onUpdateDeal({ ...u, lastUpdated: new Date().toISOString() })} />

      {/* B) Financial snapshot */}
      <section className="rounded-lg border border-border bg-surface-raised p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Financial snapshot</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Adjusted EBITDA{deal.bankEbitdaOverride != null ? " (for financing)" : ""}</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(effectiveEbitda)}{deal.bankEbitdaOverride != null && <span className="ml-1 text-xs font-normal text-zinc-500"> (bank figure)</span>}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Purchase price range</p>
            <p className="text-sm text-white">
              {deal.purchaseMultiples.map((m, i) => (
                <span key={m}>
                  {m}x: {formatCurrency(purchasePriceFromMultiple(deal.adjustedEbitda, m))}
                  {i < deal.purchaseMultiples.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Scenario:{" "}
              {deal.purchaseMultiples.map((m, i) => (
                <button key={m} type="button" onClick={() => setSelectedMultipleIndex(i)} className={selectedMultipleIndex === i ? "font-medium text-brand" : "text-zinc-500 hover:text-zinc-300"}>
                  {m}x
                </button>
              ))}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Equity required</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(financing.equityAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">DSCR / Financeability</p>
            <FinanceabilityBadge dscr={financing.dscr} financeability={financing.financeability} />
          </div>
        </div>
      </section>

      {/* C) Major adjustment flags */}
      <section className="rounded-lg border border-border bg-surface-raised p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Major adjustment flags</h2>
        <div className="space-y-2 text-sm">
          <p>
            Reported EBITDA: {formatCurrency(deal.reportedEbitda)} → Adjusted (CIM): {formatCurrency(deal.adjustedEbitda)}
            {deal.reportedEbitda !== 0 && <span className="ml-2 text-zinc-500">({deltaPercent >= 0 ? "+" : ""}{deltaPercent.toFixed(1)}%)</span>}
          </p>
          {deal.bankEbitdaOverride != null && (
            <p className="text-sm text-zinc-400">Using bank/cash flow EBITDA for pricing and DSCR: {formatCurrency(deal.bankEbitdaOverride)}</p>
          )}
          {showEbitdaWarning && (
            <div className="rounded border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-amber-200">
              Warning: Reported vs adjusted EBITDA differs by more than {DEFAULT_EBITDA_DELTA_WARNING_PERCENT}%. Review addbacks/deductions.
            </div>
          )}
          {topAdjustments.length > 0 && (
            <p className="text-zinc-500">Top adjustments: {topAdjustments.map((a) => `${a.label}: ${formatCurrency(a.amount)}`).join("; ")}</p>
          )}
        </div>
      </section>

      {/* Edit baseline / Edit financing */}
      {editingBaseline ? (
        <EditBaselineForm deal={deal} onSave={handleSaveBaseline} onCancel={() => setEditingBaseline(false)} onLogChange={addChangeLogEntry} />
      ) : editingFinancing ? (
        <EditFinancingForm deal={deal} onSave={handleSaveFinancing} onCancel={() => setEditingFinancing(false)} onLogChange={addChangeLogEntry} />
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditingBaseline(true)} className="rounded border border-border px-3 py-1.5 text-sm text-zinc-400 hover:bg-surface">
            Edit baseline
          </button>
          <button type="button" onClick={() => setEditingFinancing(true)} className="rounded border border-border px-3 py-1.5 text-sm text-zinc-400 hover:bg-surface">
            Edit financing
          </button>
        </div>
      )}

      {/* D) Assumption tracker */}
      <section className="rounded-lg border border-border bg-surface-raised p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Assumption tracker (last 5)</h2>
        <ChangeLogTable entries={deal.changeLog} maxRows={5} />
      </section>

      {/* E) Open questions */}
      <section className="rounded-lg border border-border bg-surface-raised p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Open questions</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
          {deal.openQuestions.map((q, i) => (
            <li key={i} className="flex gap-2">
              <input
                value={q}
                onChange={(e) => {
                  const next = [...deal.openQuestions];
                  next[i] = e.target.value;
                  onUpdateDeal({ openQuestions: next });
                }}
                className="flex-1 bg-transparent focus:outline-none focus:ring-0"
              />
              <button type="button" onClick={() => onUpdateDeal({ openQuestions: deal.openQuestions.filter((_, j) => j !== i) })} className="text-zinc-500 hover:text-red-400">×</button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onUpdateDeal({ openQuestions: [...deal.openQuestions, ""] })}
          className="mt-2 text-sm text-brand hover:underline"
        >
          + Add question
        </button>
      </section>

      {/* F) Conviction */}
      <section className="rounded-lg border border-border bg-surface-raised p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Conviction</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {CONVICTION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onUpdateDeal({ convictionLean: opt, lastUpdated: new Date().toISOString() })}
                className={`rounded border px-3 py-1.5 text-sm ${deal.convictionLean === opt ? "border-brand bg-brand/20 text-white" : "border-border text-zinc-400 hover:bg-surface"}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-500">
            Confidence (0–100)
            <input
              type="range"
              min="0"
              max="100"
              value={deal.convictionConfidence ?? 50}
              onChange={(e) => onUpdateDeal({ convictionConfidence: Number(e.target.value) })}
              className="w-24"
            />
            <span>{deal.convictionConfidence ?? 50}</span>
          </label>
        </div>
      </section>

      {showLoiDraft && <LoiDraftView deal={deal} selectedMultipleIndex={selectedMultipleIndex} onClose={() => setShowLoiDraft(false)} />}
    </div>
  );
}
