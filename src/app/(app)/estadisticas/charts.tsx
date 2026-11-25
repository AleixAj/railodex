import { money } from "@/lib/format";

/** Horizontal bars: count on the right, value under the label. */
export function BarList({ rows }: { rows: { label: string; count: number; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-[15px]">
            <span className="truncate">{r.label}</span>
            <span className="font-mono">{r.count}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-s2">
            <div className="h-full rounded-full bg-amb" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
          <p className="mt-0.5 font-mono text-[12px] text-fg3">{money(r.value)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Vertical bars, one per year. Plain divs so it works without a chart library. */
export function SpendChart({ data }: { data: { label: string; total: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="mt-5 flex h-[200px] items-end gap-3 overflow-x-auto" role="img" aria-label="Gasto por año">
      {data.map((d) => (
        <div key={d.label} className="flex min-w-[48px] flex-1 flex-col items-center gap-1.5">
          <span className="font-mono text-[12px] text-fg2">{money(d.total)}</span>
          <div className="w-full max-w-[64px] rounded-t-md bg-amb" style={{ height: `${Math.max(3, (d.total / max) * 150)}px` }} />
          <span className="font-mono text-[13px] text-fg3">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
