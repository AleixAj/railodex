import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CircleCheck, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { coverUrls } from "@/lib/items";
import { EPOCHS } from "@/lib/catalog";
import { money } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Card, btn } from "@/components/ui";
import { CompositionHeader, Train, type Member } from "./train";

export async function generateMetadata({ params }: PageProps<"/composiciones/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("compositions").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Composición" };
}

export default async function ComposicionPage({ params }: PageProps<"/composiciones/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();

  const [{ data: comp }, { data: links }, { data: all }] = await Promise.all([
    supabase.from("compositions").select("id, name").eq("id", id).maybeSingle(),
    supabase.from("composition_items").select("item_id, position").eq("composition_id", id).order("position"),
    supabase
      .from("items")
      .select("id, kind, traction, system, name, manufacturer, catalog_ref, scale, epoch, purchase_price, estimated_value, status, details")
      .neq("status", "vendida")
      .order("name"),
  ]);
  if (!comp) notFound();

  const items = (all ?? []) as Item[];
  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered = (links ?? []).map((l) => byId.get(l.item_id)).filter(Boolean) as Item[];
  const inTrain = new Set(ordered.map((i) => i.id));
  const covers = await coverUrls(supabase, ordered.map((i) => i.id));

  const members: Member[] = ordered.map((i) => ({
    id: i.id,
    name: i.name,
    kind: i.kind,
    scale: i.scale,
    ref: [i.manufacturer, i.catalog_ref].filter(Boolean).join(" "),
    cover: covers[i.id],
  }));
  const available = items
    .filter((i) => !inTrain.has(i.id))
    .map((i) => ({ id: i.id, label: `${i.name} · ${[i.manufacturer, i.catalog_ref].filter(Boolean).join(" ")} · ${i.scale}` }));

  const withLength = ordered.filter((i) => i.details?.lengthMm);
  const length = withLength.reduce((s, i) => s + Number(i.details.lengthMm), 0);
  const value = ordered.reduce((s, i) => s + Number(i.estimated_value ?? i.purchase_price ?? 0), 0);
  const epochs = [...new Set(ordered.map((i) => i.epoch).filter(Boolean) as string[])];

  // Things worth knowing before you put this train on the layout.
  const warnings: string[] = [];
  const scales = new Set(ordered.map((i) => i.scale));
  if (scales.size > 1) warnings.push(`Mezcla escalas: ${[...scales].join(", ")}.`);
  if (epochs.length > 1) {
    const idx = epochs.map((e) => EPOCHS.indexOf(e as (typeof EPOCHS)[number]));
    if (Math.max(...idx) - Math.min(...idx) > 1) warnings.push(`Mezcla épocas muy separadas: ${epochs.sort().join(", ")}.`);
  }
  const tractors = ordered.filter((i) => i.kind === "locomotora" || i.kind === "automotor");
  if (tractors.some((t) => t.system === "digital") && tractors.some((t) => t.system === "analogico")) {
    warnings.push("Hay locomotoras digitales y analógicas en el mismo tren.");
  }
  const currents = new Set(tractors.filter((t) => t.system === "analogico" && t.details?.current).map((t) => t.details.current));
  if (currents.size > 1) warnings.push("Hay locomotoras de corriente continua y alterna.");
  const couplers = new Set(ordered.map((i) => i.details?.coupler).filter(Boolean));
  if (couplers.size > 1) warnings.push(`Enganches distintos: ${[...couplers].join(", ")}.`);
  if (ordered.length > 0 && tractors.length === 0) warnings.push("El tren no tiene locomotora ni automotor.");

  return (
    <div className="flex flex-col gap-5">
      <Link href="/composiciones" className={`${btn.ghost} self-start`}><ChevronLeft className="h-4 w-4" /> Composiciones</Link>
      <CompositionHeader id={comp.id} name={comp.name} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Piezas" value={String(ordered.length)} />
        <Stat
          label="Longitud del tren"
          value={length ? `${(length / 10).toLocaleString("es-ES", { maximumFractionDigits: 1 })} cm` : "—"}
          sub={withLength.length < ordered.length ? `Faltan medidas de ${ordered.length - withLength.length}` : undefined}
        />
        <Stat label="Valor" value={money(value)} />
        <Stat label="Épocas" value={epochs.length ? epochs.join(" · ") : "—"} />
      </div>

      <Train id={comp.id} members={members} available={available} />

      {ordered.length > 0 && (
        <Card className="p-4">
          {warnings.length === 0 ? (
            <p className="flex items-center gap-2 text-grn"><CircleCheck className="h-5 w-5" /> Sin avisos: misma escala, épocas compatibles y nada que choque entre las piezas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-2 text-ambtx"><TriangleAlert className="mt-0.5 h-5 w-5 flex-none" /> {w}</li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[15px] text-fg2">{label}</p>
      <p className="mt-1 font-display text-[24px] font-bold">{value}</p>
      {sub && <p className="text-[13px] text-fg3">{sub}</p>}
    </Card>
  );
}
