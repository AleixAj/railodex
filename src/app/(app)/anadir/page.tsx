import type { Metadata } from "next";
import { ScanBarcode, Search, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";
import { ItemWizard } from "@/components/item-wizard/item-wizard";

export const metadata: Metadata = { title: "Añadir pieza" };

export default async function AnadirPage({ searchParams }: PageProps<"/anadir">) {
  const { duplicar } = await searchParams;
  const { supabase, userId } = await requireUser();

  const [{ data: addr }, source] = await Promise.all([
    supabase.from("items").select("id, name, dcc_address").not("dcc_address", "is", null).neq("status", "vendida"),
    typeof duplicar === "string" && /^[0-9a-f-]{36}$/i.test(duplicar)
      ? supabase.from("items").select("*").eq("id", duplicar).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Al duplicar copiamos todo menos lo que identifica a la unidad concreta.
  const initial: Partial<Item> | undefined = source.data
    ? {
        ...(source.data as Item),
        id: undefined,
        name: "",
        road_number: null,
        dcc_address: null,
        details: { ...(source.data as Item).details, ean: undefined },
      }
    : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Search, title: "Buscar en el catálogo", text: "Escribe «Roco 73845» y se rellena solo" },
          { icon: ScanBarcode, title: "Escanear código de barras", text: "Apunta al EAN de la caja" },
          { icon: Sparkles, title: "Foto con IA", text: "Propone fabricante, modelo y escala" },
        ].map((c) => (
          <div key={c.title} className="flex items-center gap-3 rounded-xl border border-dashed border-ln2 p-3.5 text-fg3" aria-disabled>
            <c.icon className="h-6 w-6 flex-none" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-semibold text-fg2">
                {c.title} <span className="rounded border border-ln2 px-1 font-mono text-[11px] font-normal">pronto</span>
              </p>
              <p className="truncate text-[14px]">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <ItemWizard
        mode="crear"
        userId={userId}
        initial={initial}
        addresses={(addr ?? []).map((a) => ({ id: a.id, name: a.name, address: a.dcc_address as number }))}
      />
    </div>
  );
}
