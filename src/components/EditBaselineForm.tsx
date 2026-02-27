"use client";

import type { Deal, AddbackOrDeduction } from "@/types";
import { sumAddbacksAndDeductions } from "@/lib/dealHelpers";

import type { ChangeLogEntry } from "@/types";

interface Props {
  deal: Deal;
  onSave: (updates: Partial<Deal>) => void;
  onCancel: () => void;
  onLogChange?: (entry: ChangeLogEntry) => void;
}

export default function EditBaselineForm({ deal, onSave, onCancel, onLogChange }: Props) {
  const addbackTotal = sumAddbacksAndDeductions(deal.addbacks);
  const deductionTotal = sumAddbacksAndDeductions(deal.deductions);
  const computed = deal.reportedEbitda + addbackTotal + deductionTotal;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const revenue = Number((form.querySelector('[name="revenue"]') as HTMLInputElement)?.value) || 0;
    const reportedEbitda = Number((form.querySelector('[name="reportedEbitda"]') as HTMLInputElement)?.value) ?? 0;
    const adjustedEbitda = Number((form.querySelector('[name="adjustedEbitda"]') as HTMLInputElement)?.value) ?? computed;
    const bankVal = (form.querySelector('[name="bankEbitdaOverride"]') as HTMLInputElement)?.value?.trim();
    const bankEbitdaOverride = bankVal === "" ? undefined : (() => { const n = Number(bankVal); return Number.isNaN(n) ? undefined : n; })();
    const reason = (form.querySelector('[name="reason"]') as HTMLInputElement)?.value?.trim();

    const now = new Date().toISOString();
    if (onLogChange) {
      if (revenue !== deal.revenue) onLogChange({ timestamp: now, field: "Revenue", oldValue: deal.revenue, newValue: revenue, reason });
      if (reportedEbitda !== deal.reportedEbitda) onLogChange({ timestamp: now, field: "Reported EBITDA", oldValue: deal.reportedEbitda, newValue: reportedEbitda, reason });
      if (adjustedEbitda !== deal.adjustedEbitda) onLogChange({ timestamp: now, field: "Adjusted EBITDA", oldValue: deal.adjustedEbitda, newValue: adjustedEbitda, reason });
    }
    onSave({
      revenue,
      reportedEbitda,
      adjustedEbitda,
      bankEbitdaOverride,
      lastUpdated: new Date().toISOString(),
    });
  }

  function addLine(kind: "addbacks" | "deductions") {
    const items = kind === "addbacks" ? [...deal.addbacks, { description: "", amount: 0 }] : [...deal.deductions, { description: "", amount: 0 }];
    onSave(kind === "addbacks" ? { addbacks: items } : { deductions: items });
  }

  function updateLine(kind: "addbacks" | "deductions", index: number, updates: Partial<AddbackOrDeduction>) {
    const arr = kind === "addbacks" ? [...deal.addbacks] : [...deal.deductions];
    arr[index] = { ...arr[index], ...updates };
    onSave(kind === "addbacks" ? { addbacks: arr } : { deductions: arr });
  }

  function removeLine(kind: "addbacks" | "deductions", index: number) {
    const arr = kind === "addbacks" ? deal.addbacks.filter((_, i) => i !== index) : deal.deductions.filter((_, i) => i !== index);
    onSave(kind === "addbacks" ? { addbacks: arr } : { deductions: arr });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface-raised p-4">
      <h3 className="text-lg font-semibold text-white">Edit baseline financials</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          Revenue
          <input name="revenue" type="number" step="1" defaultValue={deal.revenue} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
        <label className="block text-sm text-zinc-400">
          Reported EBITDA
          <input name="reportedEbitda" type="number" step="1" defaultValue={deal.reportedEbitda} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
      </div>
      <div>
        <label className="block text-sm text-zinc-400">
          Adjusted EBITDA (from CIM / override)
          <input name="adjustedEbitda" type="number" step="1" defaultValue={deal.adjustedEbitda} placeholder={String(computed)} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
        <p className="mt-1 text-xs text-zinc-500">Computed: Reported + addbacks + deductions = {computed.toLocaleString()}</p>
      </div>
      <div>
        <label className="block text-sm text-zinc-400">
          Adjusted EBITDA for financing (optional)
          <input name="bankEbitdaOverride" type="number" step="1" defaultValue={deal.bankEbitdaOverride ?? ""} placeholder="e.g. bank / cash flow model number" className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
        <p className="mt-1 text-xs text-zinc-500">When set, this value is used for purchase price and DSCR instead of the CIM-adjusted figure.</p>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Addbacks</span>
          <button type="button" onClick={() => addLine("addbacks")} className="text-sm text-brand hover:underline">
            + Add
          </button>
        </div>
        <ul className="mt-2 space-y-2">
          {deal.addbacks.map((a, i) => (
            <li key={i} className="flex gap-2">
              <input value={a.description} onChange={(e) => updateLine("addbacks", i, { description: e.target.value })} placeholder="Description" className="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-white" />
              <input type="number" value={a.amount || ""} onChange={(e) => updateLine("addbacks", i, { amount: Number(e.target.value) || 0 })} placeholder="Amount" className="w-24 rounded border border-border bg-surface px-2 py-1 text-sm text-white" />
              <button type="button" onClick={() => removeLine("addbacks", i)} className="text-zinc-500 hover:text-red-400">×</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Deductions</span>
          <button type="button" onClick={() => addLine("deductions")} className="text-sm text-brand hover:underline">
            + Add
          </button>
        </div>
        <ul className="mt-2 space-y-2">
          {deal.deductions.map((d, i) => (
            <li key={i} className="flex gap-2">
              <input value={d.description} onChange={(e) => updateLine("deductions", i, { description: e.target.value })} placeholder="Description" className="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-white" />
              <input type="number" value={d.amount || ""} onChange={(e) => updateLine("deductions", i, { amount: Number(e.target.value) || 0 })} placeholder="Amount (negative)" className="w-24 rounded border border-border bg-surface px-2 py-1 text-sm text-white" />
              <button type="button" onClick={() => removeLine("deductions", i)} className="text-zinc-500 hover:text-red-400">×</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <label className="block text-sm text-zinc-400">
          Reason for change (optional)
          <input name="reason" type="text" placeholder="e.g. Updated from CIM" className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-border px-4 py-2 text-sm text-zinc-400 hover:bg-surface">
          Cancel
        </button>
      </div>
    </form>
  );
}
