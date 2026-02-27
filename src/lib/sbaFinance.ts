import { DSCR_GREEN, DSCR_YELLOW, type Financeability } from "@/types";

/**
 * Annual payment for a loan: P * r / (1 - (1+r)^(-n))
 * r = annual rate (e.g. 0.105), n = years.
 */
export function annualPayment(principal: number, annualRate: number, years: number): number {
  if (years <= 0) return 0;
  if (annualRate <= 0) return principal / years;
  const r = annualRate;
  const n = years;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export interface FinancingInputs {
  adjustedEbitda: number;
  purchasePrice: number; // or derived from multiple
  downPaymentPercent: number;
  sellerNotePercent: number;
  interestRate: number; // e.g. 10.5 -> 0.105
  amortizationYears: number;
  realEstateIncluded: boolean;
  rePrice?: number;
  reTermYears?: number;
  reRate?: number;
  ownerCompAdjustment: number;
}

export interface FinancingResult {
  purchasePrice: number;
  equityAmount: number;
  sellerNoteAmount: number;
  sbaAmount: number;
  reAmount: number;
  totalAnnualDebtService: number;
  dscr: number;
  financeability: Financeability;
}

export function computeFinancing(inputs: FinancingInputs): FinancingResult {
  const {
    adjustedEbitda,
    purchasePrice,
    downPaymentPercent,
    sellerNotePercent,
    interestRate,
    amortizationYears,
    realEstateIncluded,
    rePrice = 0,
    reTermYears = 25,
    reRate = 0.08,
    ownerCompAdjustment,
  } = inputs;

  const rate = interestRate / 100;
  const equityAmount = (purchasePrice * downPaymentPercent) / 100;
  const sellerNoteAmount = (purchasePrice * sellerNotePercent) / 100;
  const sbaAmount = purchasePrice - equityAmount - sellerNoteAmount;
  const reAmount = realEstateIncluded ? rePrice ?? 0 : 0;

  const sbaPayment = sbaAmount > 0 ? annualPayment(sbaAmount, rate, amortizationYears) : 0;
  const sellerPayment = sellerNoteAmount > 0 ? annualPayment(sellerNoteAmount, rate, amortizationYears) : 0;
  const rePayment = reAmount > 0 ? annualPayment(reAmount, reRate / 100, reTermYears) : 0;
  const totalAnnualDebtService = sbaPayment + sellerPayment + rePayment;

  const cashFlowForDscr = Math.max(0, adjustedEbitda - ownerCompAdjustment);
  const dscr = totalAnnualDebtService > 0 ? cashFlowForDscr / totalAnnualDebtService : 0;

  let financeability: Financeability = "red";
  if (dscr >= DSCR_GREEN) financeability = "green";
  else if (dscr >= DSCR_YELLOW) financeability = "yellow";

  return {
    purchasePrice,
    equityAmount,
    sellerNoteAmount,
    sbaAmount,
    reAmount,
    totalAnnualDebtService,
    dscr,
    financeability,
  };
}

export function purchasePriceFromMultiple(adjustedEbitda: number, multiple: number): number {
  return adjustedEbitda * multiple;
}
