import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import QRCode from "qrcode";
import { requireUser } from "@/lib/supabase/server";
import { siteOrigin } from "@/lib/site";
import { buildTree, flatten, isInside } from "@/lib/locations";
import { btn } from "@/components/ui";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Etiquetas QR" };

export default async function EtiquetasPage({ searchParams }: PageProps<"/ubicaciones/etiquetas">) {
  const { l } = await searchParams;
  const only = typeof l === "string" ? l : "";
  const { supabase } = await requireUser();
  const { data } = await supabase.from("items").select("location").neq("status", "vendida");
  const { roots } = buildTree((data ?? []).map((d) => d.location));
  const nodes = flatten(roots).filter((n) => !only || isInside(n.path, only));

  const origin = await siteOrigin();
  const labels = await Promise.all(
    nodes.map(async (n) => ({
      ...n,
      svg: await QRCode.toString(`${origin}/ubicaciones?l=${encodeURIComponent(n.path)}`, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      }),
    })),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Link href="/ubicaciones" className={btn.ghost}><ChevronLeft className="h-4 w-4" /> Ubicaciones</Link>
        <h1 className="mr-auto font-display text-[28px] font-bold tracking-tight">Etiquetas QR</h1>
        <PrintButton />
      </div>
      <p className="text-fg2 print:hidden">
        Pega cada etiqueta en su vitrina, estante o caja. Al escanearla con el móvil verás qué piezas hay dentro (hay que tener la sesión abierta).
      </p>

      {labels.length === 0 ? (
        <p className="text-fg3">No hay ubicaciones todavía.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-2">
          {labels.map((n) => (
            <div key={n.path} className="flex break-inside-avoid flex-col items-center gap-2 rounded-lg border border-ln2 bg-white p-4 text-black print:border-black">
              <div className="h-32 w-32" dangerouslySetInnerHTML={{ __html: n.svg }} />
              <p className="text-center text-[15px] font-semibold leading-tight">{n.name}</p>
              <p className="text-center font-mono text-[11px] leading-tight text-neutral-600">{n.path}</p>
              <p className="font-mono text-[11px] text-neutral-500">RAILODEX · {n.count} {n.count === 1 ? "pieza" : "piezas"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
