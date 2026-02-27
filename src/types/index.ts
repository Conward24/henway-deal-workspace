export type DealStatus = "Investigating" | "Needs Info" | "Pass" | "LOI Ready";

export type ConvictionLean = "Move Forward" | "Needs Work" | "Pass";

export interface AddbackOrDeduction {
  description: string;
  amount: number; // addbacks positive, deductions negative
}

export interface ChangeLogEntry {
  timestamp: string; // ISO
  field: string;
  oldValue: string | number;
  newValue: string | number;
  reason?: string;
  ebitdaDelta?: number;
  dscrDelta?: number;
}

export interface Deal {
  id: string;
  name: string;
  industry: string;
  location: string;
  lastUpdated: string; // ISO
  notes: string;
  status: DealStatus;
  // Baseline
  revenue: number;
  reportedEbitda: number;
  adjustedEbitda: number; // calculated or override
  addbacks: AddbackOrDeduction[];
  deductions: AddbackOrDeduction[];
  // Financing
  purchaseMultiples: number[];
  purchasePriceOverride?: number;
  downPaymentPercent: number;
  sellerNotePercent: number;
  interestRate: number;
  amortizationYears: number;
  realEstateIncluded: boolean;
  rePrice?: number;
  reTermYears?: number;
  reRate?: number;
  ownerCompAdjustment: number;
  // Log & other
  changeLog: ChangeLogEntry[];
  openQuestions: string[];
  convictionLean: ConvictionLean;
  convictionConfidence?: number; // 0-100
}

export const DEFAULT_EBITDA_DELTA_WARNING_PERCENT = 30;

export const DSCR_GREEN = 1.25;
export const DSCR_YELLOW = 1.15;

export type Financeability = "green" | "yellow" | "red";
