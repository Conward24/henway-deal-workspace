"use client";

import type { Deal } from "@/types";
import { formatCurrency } from "@/lib/dealHelpers";
import { computeFinancing, purchasePriceFromMultiple } from "@/lib/sbaFinance";

interface Props {
  deal: Deal;
  selectedMultipleIndex?: number; // 0 = 3.5x, 1 = 4x, 2 = 4.5x
  onClose: () => void;
}

export default function LoiDraftView({ deal, selectedMultipleIndex = 1, onClose }: Props) {
  const multiple = deal.purchaseMultiples[selectedMultipleIndex] ?? deal.purchaseMultiples[1] ?? 4;
  const purchasePrice = deal.purchasePriceOverride ?? purchasePriceFromMultiple(deal.adjustedEbitda, multiple);
  const financing = computeFinancing({
    adjustedEbitda: deal.adjustedEbitda,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface-raised p-6 text-left">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Draft LOI</h2>
          <button type="button" onClick={onClose} className="rounded border border-border px-3 py-1 text-sm text-zinc-400 hover:bg-surface">
            Close
          </button>
        </div>
        <div className="space-y-4 font-serif text-sm text-zinc-300">
          <p><strong className="text-white">Deal name:</strong> {deal.name || "—"}</p>
          <p><strong className="text-white">Industry:</strong> {deal.industry || "—"}</p>
          <p><strong className="text-white">Location:</strong> {deal.location || "—"}</p>
          <hr className="border-border" />
          <p><strong className="text-white">Purchase price:</strong> {formatCurrency(purchasePrice)}</p>
          <p><strong className="text-white">Multiple on owner&apos;s cash flow (Adjusted EBITDA):</strong> {multiple}x</p>
          <p><strong className="text-white">Owner&apos;s cash flow (Adjusted EBITDA):</strong> {formatCurrency(deal.adjustedEbitda)}</p>
          <hr className="border-border" />
          <p><strong className="text-white">Equity (down payment):</strong> {formatCurrency(financing.equityAmount)} ({deal.downPaymentPercent}%)</p>
          {deal.sellerNotePercent > 0 && (
            <p><strong className="text-white">Seller note:</strong> {formatCurrency(financing.sellerNoteAmount)} ({deal.sellerNotePercent}%)</p>
          )}
          <p><strong className="text-white">SBA loan:</strong> {formatCurrency(financing.sbaAmount)}</p>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Copy the terms above into your LOI template. Download as PDF coming soon.
        </p>
      </div>
    </div>
  );
}
