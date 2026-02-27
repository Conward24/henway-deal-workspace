"use client";

import Link from "next/link";
import type { Deal } from "@/types";

interface Props {
  deals: Deal[];
}

const statusColors: Record<Deal["status"], string> = {
  Investigating: "text-zinc-400",
  "Needs Info": "text-amber-400",
  Pass: "text-red-400",
  "LOI Ready": "text-emerald-400",
};

export default function DealList({ deals }: Props) {
  if (deals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised p-8 text-center text-zinc-500">
        No deals yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-zinc-500">
            <th className="p-3">Name</th>
            <th className="p-3">Industry</th>
            <th className="p-3">Location</th>
            <th className="p-3">Last updated</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-b border-border/50 hover:bg-surface/50">
              <td className="p-3">
                <Link href={`/deal/${deal.id}`} className="font-medium text-white hover:text-brand">
                  {deal.name || "Untitled"}
                </Link>
              </td>
              <td className="p-3 text-zinc-400">{deal.industry || "—"}</td>
              <td className="p-3 text-zinc-400">{deal.location || "—"}</td>
              <td className="p-3 text-zinc-500">{new Date(deal.lastUpdated).toLocaleDateString()}</td>
              <td className={`p-3 ${statusColors[deal.status]}`}>{deal.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
