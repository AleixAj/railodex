import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { KINDS, labelOf } from "@/lib/catalog";
import { money, shortDate } from "@/lib/format";
import { Card, ScaleBadge, Tag } from "@/components/ui";
import { CopyListButton, WishActions, WishDialog, type Wish } from "./wish-parts";

export const metadata: Metadata = { title: "Deseos y preventas" };

const PRIORITY = {
  1: { label: "Alta", tone: "red" },
  2: { label: "Media", tone: "amb" },
  3: { label: "Baja", tone: "neutral" },
} as const;

export default async function DeseosPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("wishes")
    .select("*")
    .order("priority")
    .order("created_at", { ascending: false });
  const wishes = (data ?? []) as Wish[];
  const reserved = wishes
    .filter((w) => w.status === "reservada")
    .sort((a, b) => (a.expected_date ?? "9").localeCompare(b.expected_date ?? "9"));
  const wanted = wishes.filter((w) => w.status === "deseo");

  const pendingToPay = reserved.reduce(
    (s, w) => s + Math.max(0, Number(w.target_price ?? 0) - Number(w.deposit ?? 0)),
    0,
  );
  const wantedTotal = wanted.reduce((s, w) => s + Number(w.target_price ?? 0), 0);

  const listText = [
    "Mi lista de deseos (Railodex)",
    ...wishes.map(
      (w) =>
        `- ${w.name}${w.manufacturer || w.catalog_ref ? ` — ${[w.manufacturer, w.catalog_ref].filter(Boolean).join(" ")}` : ""}${w.scale ? ` (${w.scale})` : ""}${w.target_price ? ` · hasta ${money(w.target_price)}` : ""}`,
    ),
  ].join("\n");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-[34px] font-bold tracking-tight">Deseos y preventas</h1>
          <p className="mt-1 text-fg2">
            Lo que quieres y lo que ya has reservado. Cuando llegue, pásalo a tu colección con un botón.
          </p>
        </div>
        {wishes.length > 0 && <CopyListButton text={listText} />}
        <WishDialog trigger="nuevo" />
      </div>

      {wishes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Heart className="h-10 w-10 text-ln2" strokeWidth={1.25} />
          <p className="text-fg2">Tu lista está vacía. Apunta esa locomotora que llevas tiempo buscando.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Mini label="Preventas" value={String(reserved.length)} />
            <Mini label="Pendiente de pagar" value={money(pendingToPay)} />
            <Mini label="Deseos" value={String(wanted.length)} />
            <Mini label="Coste de la lista" value={money(wantedTotal)} />
          </div>

          {reserved.length > 0 && <Section title="Reservadas / preventas" wishes={reserved} />}
          {wanted.length > 0 && <Section title="Lista de deseos" wishes={wanted} />}
        </>
      )}
    </div>
  );
}

function Section({ title, wishes }: { title: string; wishes: Wish[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <Card className="divide-y divide-ln">
        {wishes.map((w) => {
          const p = PRIORITY[w.priority as 1 | 2 | 3] ?? PRIORITY[2];
          return (
            <div key={w.id} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {w.scale && <ScaleBadge scale={w.scale} />}
                  {w.status === "deseo" && <Tag tone={p.tone}>{p.label}</Tag>}
                  {w.kind && <span className="text-[14px] text-fg3">{labelOf(KINDS, w.kind)}</span>}
                </div>
                <p className="mt-1 font-semibold">
                  {w.url ? (
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-ambtx">
                      {w.name}
                    </a>
                  ) : (
                    w.name
                  )}
                </p>
                <p className="truncate text-[14px] text-fg3">
                  <span className="font-mono">{[w.manufacturer, w.catalog_ref].filter(Boolean).join(" ")}</span>
                  {w.railway ? ` · ${w.railway}` : ""}
                  {w.shop ? ` · ${w.shop}` : ""}
                </p>
                {w.status === "reservada" && (
                  <p className="mt-1 font-mono text-[13px] text-ambtx">
                    {w.expected_date ? `Llega ${shortDate(w.expected_date)}` : "Sin fecha"} · señal{" "}
                    {money(w.deposit ?? 0)}
                  </p>
                )}
              </div>
              <span className="w-20 flex-none pt-1 text-right font-semibold">{money(w.target_price)}</span>
              <WishActions wish={w} />
            </div>
          );
        })}
      </Card>
    </section>
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
