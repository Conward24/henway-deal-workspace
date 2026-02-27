import type { Deal, AddbackOrDeduction } from "@/types";
import { DEFAULT_EBITDA_DELTA_WARNING_PERCENT } from "@/types";

export { DEFAULT_EBITDA_DELTA_WARNING_PERCENT };

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function sumAddbacksAndDeductions(items: AddbackOrDeduction[]): number {
  return items.reduce((s, i) => s + i.amount, 0);
}

export function computedAdjustedEbitda(deal: Deal): number {
  const addbackTotal = sumAddbacksAndDeductions(deal.addbacks);
  const deductionTotal = sumAddbacksAndDeductions(deal.deductions);
  return deal.reportedEbitda + addbackTotal + deductionTotal; // deductions are negative
}

export function effectiveAdjustedEbitda(deal: Deal): number {
  // If user has explicitly set adjustedEbitda and it differs from computed, we could use override.
  // For MVP we use computed (reported + addbacks + deductions); override can be same as computed.
  return deal.adjustedEbitda;
}

export function reportedVsAdjustedDeltaPercent(reported: number, adjusted: number): number {
  if (reported === 0) return adjusted !== 0 ? 100 : 0;
  return ((adjusted - reported) / Math.abs(reported)) * 100;
}

export function isEbitdaDeltaWarning(deal: Deal, thresholdPercent = DEFAULT_EBITDA_DELTA_WARNING_PERCENT): boolean {
  const delta = reportedVsAdjustedDeltaPercent(deal.reportedEbitda, deal.adjustedEbitda);
  return Math.abs(delta) > thresholdPercent;
}

export function createEmptyDeal(): Deal {
  const now = new Date().toISOString();
  return {
    id: `deal-${Date.now()}`,
    name: "New Deal",
    industry: "",
    location: "",
    lastUpdated: now,
    notes: "",
    status: "Investigating",
    revenue: 0,
    reportedEbitda: 0,
    adjustedEbitda: 0,
    addbacks: [],
    deductions: [],
    purchaseMultiples: [3.5, 4.0, 4.5],
    downPaymentPercent: 10,
    sellerNotePercent: 0,
    interestRate: 10.5,
    amortizationYears: 10,
    realEstateIncluded: false,
    ownerCompAdjustment: 0,
    changeLog: [],
    openQuestions: [],
    convictionLean: "Needs Work",
  };
}
