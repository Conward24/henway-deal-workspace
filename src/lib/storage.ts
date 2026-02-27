import type { Deal } from "@/types";

const DEALS_KEY = "henway-deal-workspace-deals";
const SELECTED_ID_KEY = "henway-deal-workspace-selected-id";

export function loadDeals(): Deal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Deal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeals(deals: Deal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
}

export function loadSelectedDealId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_ID_KEY);
}

export function saveSelectedDealId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id == null) localStorage.removeItem(SELECTED_ID_KEY);
  else localStorage.setItem(SELECTED_ID_KEY, id);
}
