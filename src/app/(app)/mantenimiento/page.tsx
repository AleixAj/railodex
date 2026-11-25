import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { EVENT_KINDS, labelOf } from "@/lib/catalog";
import { money, shortDate } from "@/lib/format";
import { Card, Tag } from "@/components/ui";

export const metadata: Metadata = { title: "Mantenimiento" };

type EventRow = {
  id: string;
  item_id: string;
  happened_on: string;
  kind: string;
  title: string;
  cost: number | null;
  notes: string | null;
  items: { name: string } | null;
};

export default async function MantenimientoPage({ searchParams }: PageProps<"/mantenimiento">) {
  const { tipo } = await searchParams;
  const { supabase } = await requireUser();

  const [{ data: eventsData }, { data: tractorsData }] = await Promise.all([
    supabase.from("item_events").select("id, item_id, happened_on, kind, title, cost, notes, items(name)").order("happened_on", { ascending: false }),
    supabase.from("items").select("id, name").in("kind", ["locomotora", "automotor"]).neq("status", "vendida"),
  ]);
  const all = (eventsData ?? []) as unknown as EventRow[];
  const filter = typeof tipo === "string" && EVENT_KINDS.some((k) => k.id === tipo) ? tipo : "";
  const events = filter ? all.filter((e) => e.kind === filter) : all;

  const year = new Date().getFullYear().toString();
  const costYear = all.filter((e) => e.happened_on.startsWith(year)).reduce((s, e) => s + Number(e.cost ?? 0), 0);
  const costAll = all.reduce((s, e) => s + Number(e.cost ?? 0), 0);

  // Locomotoras sin mantenimiento en el último año: las que más pide revisar un coleccionista.
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const lastByItem = new Map<string, string>();
  all.filter((e) => e.kind === "mantenimiento").forEach((e) => {
    if (!lastByItem.has(e.item_id)) lastByItem.set(e.item_id, e.happened_on);
  });
  const overdue = (tractorsData ?? []).filter((t) => {
    const last = lastByItem.get(t.id);
    return !last || new Date(last) < cutoff;
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Mantenimiento</h1>
        <p className="mt-1 text-fg2">Todo el historial de tu colección. Se añade desde la ficha de cada pieza.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Mini label="Entradas" value={String(all.length)} />
        <Mini label={`Gastado en ${year}`} value={money(costYear)} />
        <Mini label="Gastado en total" value={money(costAll)} />
        <Mini label="Locos sin revisar en 1 año" value={String(overdue.length)} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="flex flex-wrap gap-2" role="navigation" aria-label="Filtrar por tipo">
            <FilterLink href="/mantenimiento" active={!filter}>Todo</FilterLink>
            {EVENT_KINDS.map((k) => (
              <FilterLink key={k.id} href={`/mantenimiento?tipo=${k.id}`} active={filter === k.id}>{k.label}</FilterLink>
            ))}
          </div>
          {events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Wrench className="h-10 w-10 text-ln2" strokeWidth={1.25} />
              <p className="text-fg2">Nada apuntado {filter ? "de este tipo" : "todavía"}.</p>
            </div>
          ) : (
            <ol className="mt-5 flex flex-col gap-4 border-l border-ln pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-amb bg-bg" />
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-mono text-[13px] text-fg3">
                        {shortDate(e.happened_on)} <Tag>{labelOf(EVENT_KINDS, e.kind)}</Tag>
                      </p>
                      <p className="mt-1 font-semibold">{e.title}</p>
                      <Link href={`/coleccion/${e.item_id}`} className="text-[15px] text-ambtx hover:underline">{e.items?.name}</Link>
                      {e.notes && <p className="text-[15px] text-fg2">{e.notes}</p>}
                    </div>
                    {e.cost !== null && <span className="font-mono">{money(e.cost)}</span>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-[17px] font-semibold">Para revisar</h2>
          <p className="mt-1 text-[14px] text-fg3">Locomotoras sin limpieza ni engrase apuntados en el último año.</p>
          {overdue.length === 0 ? (
            <p className="mt-3 text-grn">Todas al día.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2 text-[15px]">
              {overdue.slice(0, 15).map((t) => (
                <li key={t.id} className="flex justify-between gap-3">
                  <Link href={`/coleccion/${t.id}`} className="truncate hover:text-ambtx">{t.name}</Link>
                  <span className="flex-none font-mono text-[13px] text-fg3">{lastByItem.get(t.id) ? shortDate(lastByItem.get(t.id)!) : "nunca"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-9 items-center rounded-full border px-3 text-[14px] ${active ? "border-amb bg-amb2 text-ambtx" : "border-ln2 text-fg2 hover:text-fg"}`}
    >
      {children}
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-[15px] text-fg2">{label}</p>
      <p className="mt-1 font-display text-[24px] font-bold">{value}</p>
    </Card>
  );
}
