import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Info } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";
import { ItemWizard } from "@/components/item-wizard/item-wizard";
import { AddPaths } from "./add-paths";

export const metadata: Metadata = { title: "Añadir pieza" };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function AnadirPage({ searchParams }: PageProps<"/anadir">) {
  const sp = await searchParams;
  const duplicar = typeof sp.duplicar === "string" && UUID.test(sp.duplicar) ? sp.duplicar : null;
  const ean = typeof sp.ean === "string" && /^\d{8,14}$/.test(sp.ean) ? sp.ean : null;
  const { supabase, userId } = await requireUser();

  const [{ data: addr }, { data: source }, { data: owned }] = await Promise.all([
    supabase.from("items").select("id, name, dcc_address").not("dcc_address", "is", null).neq("status", "vendida"),
    duplicar ? supabase.from("items").select("*").eq("id", duplicar).maybeSingle() : Promise.resolve({ data: null }),
    ean ? supabase.from("items").select("id, name").eq("details->>ean", ean).limit(1).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  // When duplicating, copy everything except what identifies that particular unit.
  let initial: Partial<Item> | undefined;
  if (source) {
    const s = source as Item;
    initial = { ...s, id: undefined, name: "", road_number: null, dcc_address: null, details: { ...s.details, ean: undefined } };
  } else if (ean) {
    initial = { details: { ean } };
  }

  return (
    <div className="flex flex-col gap-5">
      <AddPaths startScanning={sp.camino === "escanear"} />

      {ean && owned && (
        <p role="status" className="flex flex-wrap items-center gap-2 rounded-lg border border-amb/50 bg-amb2 p-3 text-ambtx">
          <Info className="h-5 w-5" /> Ya tienes una pieza con el código {ean}:
          <Link href={`/coleccion/${owned.id}`} className="font-semibold underline">{owned.name}</Link>. Si es otra unidad, sigue abajo.
        </p>
      )}
      {ean && !owned && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-grn/40 bg-grn2 p-3 text-grn">
          <CircleCheck className="h-5 w-5" /> Código {ean} leído. Ya está puesto en el paso Identificación.
        </p>
      )}

      <ItemWizard
        key={ean ?? duplicar ?? "nueva"}
        mode="crear"
        userId={userId}
        initial={initial}
        addresses={(addr ?? []).map((a) => ({ id: a.id, name: a.name, address: a.dcc_address as number }))}
      />
    </div>
  );
}
