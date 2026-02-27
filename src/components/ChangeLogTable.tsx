import type { ChangeLogEntry } from "@/types";
import { formatCurrency } from "@/lib/dealHelpers";

interface Props {
  entries: ChangeLogEntry[];
  maxRows?: number;
  showAll?: boolean;
}

function formatVal(v: string | number): string {
  if (typeof v === "number" && (v > 1000 || v < -1000)) return formatCurrency(v);
  return String(v);
}

export default function ChangeLogTable({ entries, maxRows = 5, showAll = false }: Props) {
  const display = showAll ? entries : entries.slice(0, maxRows);
  if (display.length === 0) {
    return <p className="text-sm text-zinc-500">No changes logged yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-zinc-500">
            <th className="pb-1 pr-2">When</th>
            <th className="pb-1 pr-2">Field</th>
            <th className="pb-1 pr-2">Old</th>
            <th className="pb-1 pr-2">New</th>
            <th className="pb-1">Reason</th>
          </tr>
        </thead>
        <tbody>
          {display.map((e, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-1 pr-2 text-zinc-400">{new Date(e.timestamp).toLocaleString()}</td>
              <td className="py-1 pr-2">{e.field}</td>
              <td className="py-1 pr-2 text-zinc-400">{formatVal(e.oldValue)}</td>
              <td className="py-1 pr-2">{formatVal(e.newValue)}</td>
              <td className="py-1 text-zinc-500">{e.reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
