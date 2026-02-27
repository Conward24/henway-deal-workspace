"use client";

import type { Deal, ChangeLogEntry } from "@/types";

interface Props {
  deal: Deal;
  onSave: (updates: Partial<Deal>) => void;
  onCancel: () => void;
  onLogChange?: (entry: ChangeLogEntry) => void;
}

export default function EditFinancingForm({ deal, onSave, onCancel, onLogChange }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const getNum = (name: string) => Number((form.querySelector(`[name="${name}"]`) as HTMLInputElement)?.value) ?? 0;
    const downPaymentPercent = getNum("downPaymentPercent");
    const sellerNotePercent = getNum("sellerNotePercent");
    const interestRate = getNum("interestRate");
    const amortizationYears = getNum("amortizationYears");
    const ownerCompAdjustment = getNum("ownerCompAdjustment");
    const realEstateIncluded = (form.querySelector('[name="realEstateIncluded"]') as HTMLInputElement)?.checked ?? false;
    const rePrice = getNum("rePrice");
    const reTermYears = getNum("reTermYears");
    const reRate = getNum("reRate");
    const reason = (form.querySelector('[name="reason"]') as HTMLInputElement)?.value?.trim();

    const now = new Date().toISOString();
    if (onLogChange) {
      if (downPaymentPercent !== deal.downPaymentPercent) onLogChange({ timestamp: now, field: "Down payment %", oldValue: deal.downPaymentPercent, newValue: downPaymentPercent, reason });
      if (sellerNotePercent !== deal.sellerNotePercent) onLogChange({ timestamp: now, field: "Seller note %", oldValue: deal.sellerNotePercent, newValue: sellerNotePercent, reason });
      if (interestRate !== deal.interestRate) onLogChange({ timestamp: now, field: "Interest rate %", oldValue: deal.interestRate, newValue: interestRate, reason });
    }
    onSave({
      downPaymentPercent,
      sellerNotePercent,
      interestRate,
      amortizationYears,
      ownerCompAdjustment,
      realEstateIncluded,
      rePrice: realEstateIncluded ? rePrice : undefined,
      reTermYears: realEstateIncluded ? reTermYears : undefined,
      reRate: realEstateIncluded ? reRate : undefined,
      lastUpdated: new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface-raised p-4">
      <h3 className="text-lg font-semibold text-white">Edit financing assumptions</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          Down payment (equity) %
          <input name="downPaymentPercent" type="number" step="0.5" min="0" max="100" defaultValue={deal.downPaymentPercent} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
        <label className="block text-sm text-zinc-400">
          Seller note %
          <input name="sellerNotePercent" type="number" step="0.5" min="0" max="100" defaultValue={deal.sellerNotePercent} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
        <label className="block text-sm text-zinc-400">
          Interest rate %
          <input name="interestRate" type="number" step="0.1" defaultValue={deal.interestRate} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
        <label className="block text-sm text-zinc-400">
          Amortization (years)
          <input name="amortizationYears" type="number" min="1" defaultValue={deal.amortizationYears} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
        <label className="block text-sm text-zinc-400 sm:col-span-2">
          Owner compensation adjustment (reduces cash flow for DSCR)
          <input name="ownerCompAdjustment" type="number" step="1000" min="0" defaultValue={deal.ownerCompAdjustment} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
        </label>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input name="realEstateIncluded" type="checkbox" defaultChecked={deal.realEstateIncluded} className="rounded border-border" />
          Real estate included
        </label>
        {deal.realEstateIncluded && (
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <label className="block text-sm text-zinc-500">
              RE price
              <input name="rePrice" type="number" step="1000" defaultValue={deal.rePrice ?? 0} className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-white" />
            </label>
            <label className="block text-sm text-zinc-500">
              RE term (years)
              <input name="reTermYears" type="number" min="1" defaultValue={deal.reTermYears ?? 25} className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-white" />
            </label>
            <label className="block text-sm text-zinc-500">
              RE rate %
              <input name="reRate" type="number" step="0.1" defaultValue={deal.reRate ?? 8} className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-white" />
            </label>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm text-zinc-400">
          Reason for change (optional)
          <input name="reason" type="text" placeholder="e.g. Updated rate assumption" className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-white" />
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
