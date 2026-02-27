"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { loadDeals, saveDeals } from "@/lib/storage";
import LivingSummary from "@/components/LivingSummary";
import type { Deal } from "@/types";

export default function DealPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasReplicateToken, setHasReplicateToken] = useState(false);

  useEffect(() => {
    const deals = loadDeals();
    const found = deals.find((d) => d.id === id);
    setDeal(found ?? null);
    setMounted(true);
  }, [id]);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHasReplicateToken(!!d.replicate))
      .catch(() => setHasReplicateToken(false));
  }, []);

  function updateDeal(updates: Partial<Deal>) {
    if (!deal) return;
    const next = { ...deal, ...updates };
    setDeal(next);
    const deals = loadDeals();
    const index = deals.findIndex((d) => d.id === id);
    if (index >= 0) {
      const nextList = [...deals];
      nextList[index] = next;
      saveDeals(nextList);
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen p-4">
        <p className="text-zinc-500">Deal not found.</p>
        <Link href="/" className="mt-2 inline-block text-brand hover:underline">
          Back to deals
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface-raised px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-brand hover:underline text-sm">
          ← Deals
        </Link>
      </header>
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <LivingSummary deal={deal} onUpdateDeal={updateDeal} hasReplicateToken={hasReplicateToken} />
      </main>
    </div>
  );
}
