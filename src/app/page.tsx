"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadDeals, saveDeals } from "@/lib/storage";
import { createEmptyDeal } from "@/lib/dealHelpers";
import DealList from "@/components/DealList";
import type { Deal } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDeals(loadDeals());
    setMounted(true);
  }, []);

  function handleCreateDeal() {
    const newDeal = createEmptyDeal();
    const next = [newDeal, ...deals];
    setDeals(next);
    saveDeals(next);
    router.push(`/deal/${newDeal.id}`);
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface-raised px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Henway Deal Workspace</h1>
        <button
          type="button"
          onClick={handleCreateDeal}
          className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New deal
        </button>
      </header>
      <main className="flex-1 p-4">
        <DealList deals={deals} />
      </main>
    </div>
  );
}
