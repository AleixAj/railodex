import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Card, SectionTitle } from "@/components/ui";
import { BarList, SpendChart } from "./charts";

export const metadata: Metadata = { title: "Estadísticas" };

export default async function EstadisticasPage() {
  const { supabase } = await requireUser();
  const [{ data: itemsData }, { data: eventsData }] = await Promise.all([
    supabase
      .from("items")
      .select("id, name, manufacturer, railway, scale, purchase_price, estimated_value, purchase_date, status")
      .neq("status", "vendida"),
    supabase.from("item_events").select("happened_on, cost"),
  ]);
  const items = (itemsData ?? []) as Item[];
  const events = eventsData ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Estadísticas</h1>
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <BarChart3 className="h-10 w-10 text-ln2" strokeWidth={1.25} />
          <p className="text-fg2">Cuando tengas piezas en tu colección verás aquí cuánto vale y en qué has gastado.</p>
        </Card>
      </div>
    );
  }

  const price = (i: Item) => Number(i.purchase_price ?? 0);
  const value = (i: Item) => Number(i.estimated_value ?? i.purchase_price ?? 0);
  const invested = items.reduce((s, i) => s + price(i), 0);
  const worth = items.reduce((s, i) => s + value(i), 0);
  const maintenance = events.reduce((s, e) => s + Number(e.cost ?? 0), 0);
  const diff = worth - invested;

  // Spending per year, from purchase dates. Pieces without a date are counted apart.
  const perYear = new Map<string, number>();
  let undated = 0;
  for (const i of items) {
    if (i.purchase_date) {
      const y = i.purchase_date.slice(0, 4);
      perYear.set(y, (perYear.get(y) ?? 0) + price(i));
    } else {
      undated += price(i);
    }
  }
  const years = [...perYear.entries()].sort(([a], [b]) => a.localeCompare(b));

  const group = (key: (i: Item) => string | null) => {
    const m = new Map<string, { count: number; value: number }>();
    for (const i of items) {
      const k = key(i) || "Sin indicar";
      const cur = m.get(k) ?? { count: 0, value: 0 };
      m.set(k, { count: cur.count + 1, value: cur.value + value(i) });
    }
    return [...m.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.count - a.count || b.value - a.value);
  };

  const topValue = [...items].sort((a, b) => value(b) - value(a)).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Estadísticas</h1>
        <p className="mt-1 text-fg2">Cuánto vale tu colección, cuánto has invertido y en qué.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Valor estimado" value={money(worth)} />
        <Stat label="Invertido" value={money(invested)} />
        <Stat
          label="Diferencia"
          value={`${diff >= 0 ? "+" : ""}${money(diff)}`}
          tone={diff > 0 ? "text-grn" : diff < 0 ? "text-red" : ""}
          sub={invested ? `${diff >= 0 ? "+" : ""}${((diff / invested) * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %` : undefined}
        />
        <Stat label="Gastado en mantenimiento" value={money(maintenance)} />
      </div>

      <Card className="p-5">
        <SectionTitle aside={undated > 0 ? <span className="text-[14px] text-fg3">{money(undated)} sin fecha de compra</span> : undefined}>
          Gasto por año
        </SectionTitle>
        {years.length === 0 ? (
          <p className="mt-3 text-fg3">Añade la fecha de compra a tus piezas para ver el gasto por año.</p>
        ) : (
          <SpendChart data={years.map(([label, total]) => ({ label, total }))} />
        )}
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle>Por fabricante</SectionTitle>
          <BarList rows={group((i) => i.manufacturer).slice(0, 8)} />
        </Card>
        <Card className="p-5">
          <SectionTitle>Por compañía</SectionTitle>
          <BarList rows={group((i) => i.railway).slice(0, 8)} />
        </Card>
        <Card className="p-5">
          <SectionTitle>Las más valiosas</SectionTitle>
          <ol className="mt-3 flex flex-col gap-2.5">
            {topValue.map((i, n) => (
              <li key={i.id} className="flex items-baseline gap-3 text-[15px]">
                <span className="w-4 font-mono text-fg3">{n + 1}</span>
                <Link href={`/coleccion/${i.id}`} className="min-w-0 flex-1 truncate hover:text-ambtx">{i.name}</Link>
                <span className="font-semibold">{money(value(i))}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone = "" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[15px] text-fg2">{label}</p>
      <p className={`mt-1 font-display text-[26px] font-bold ${tone}`}>{value}</p>
      {sub && <p className={`text-[14px] ${tone || "text-fg3"}`}>{sub}</p>}
    </Card>
  );
}
