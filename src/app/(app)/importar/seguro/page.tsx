import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { coverUrls } from "@/lib/items";
import { CONDITIONS, labelOf } from "@/lib/catalog";
import { money, shortDate } from "@/lib/format";
import type { Item } from "@/lib/types";
import { PhotoBox, btn } from "@/components/ui";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Informe para el seguro" };

// Printable inventory. The browser's "Save as PDF" turns it into the PDF for the insurer.
export default async function SeguroPage() {
  const { supabase, email, name } = await requireUser();
  const { data } = await supabase
    .from("items")
    .select("*")
    .neq("status", "vendida");
  // Sorted here because the value falls back to the purchase price when there's no estimate.
  const value = (i: Item) => Number(i.estimated_value ?? i.purchase_price ?? 0);
  const items = ((data ?? []) as Item[]).sort((a, b) => value(b) - value(a));
  const covers = await coverUrls(supabase, items.map((i) => i.id));

  const total = items.reduce((s, i) => s + value(i), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Link href="/importar" className={btn.ghost}><ChevronLeft className="h-4 w-4" /> Importar y exportar</Link>
        <p className="mr-auto text-fg3">Para guardarlo en PDF, pulsa Imprimir y elige «Guardar como PDF».</p>
        <PrintButton label="Imprimir o guardar PDF" />
      </div>

      <article className="rounded-xl border border-ln bg-white p-6 text-black sm:p-8 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-black pb-4">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-neutral-500">Railodex · Inventario de colección</p>
            <h1 className="font-display text-[28px] font-bold">Informe para el seguro</h1>
            <p className="text-[14px] text-neutral-600">Titular: {name || email} · Fecha: {shortDate(today)}</p>
          </div>
          <div className="text-right">
            <p className="text-[14px] text-neutral-600">{items.length} piezas</p>
            <p className="font-display text-[26px] font-bold">{money(total)}</p>
            <p className="text-[12px] text-neutral-500">Valor estimado total</p>
          </div>
        </header>

        <table className="mt-4 w-full text-[13px]">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-[11px] uppercase tracking-[0.05em] text-neutral-500">
              <th className="py-2 pr-2">Foto</th>
              <th className="py-2 pr-2">Pieza</th>
              <th className="py-2 pr-2">Referencia</th>
              <th className="py-2 pr-2">Estado</th>
              <th className="py-2 pr-2">Compra</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="break-inside-avoid border-b border-neutral-200 align-top">
                <td className="py-2 pr-2">
                  <div className="h-12 w-16 overflow-hidden rounded border border-neutral-300">
                    <PhotoBox src={covers[i.id]} alt={i.name} kind={i.kind} />
                  </div>
                </td>
                <td className="py-2 pr-2">
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-neutral-600">{[i.scale, i.railway, i.road_number].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="py-2 pr-2 font-mono">
                  {[i.manufacturer, i.catalog_ref].filter(Boolean).join(" ")}
                  {i.details?.ean && <span className="block text-neutral-500">EAN {i.details.ean}</span>}
                </td>
                <td className="py-2 pr-2">
                  {labelOf(CONDITIONS, i.condition) || "—"}
                  {i.details?.hasBox && <span className="block text-neutral-500">Con caja</span>}
                </td>
                <td className="py-2 pr-2">
                  {money(i.purchase_price)}
                  {i.purchase_date && <span className="block text-neutral-500">{shortDate(i.purchase_date)}</span>}
                </td>
                <td className="py-2 text-right font-semibold">{money(value(i))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[11px] text-neutral-500">
          Valores estimados por el propietario. Donde no hay valor estimado se usa el precio de compra.
        </p>
      </article>
    </div>
  );
}
