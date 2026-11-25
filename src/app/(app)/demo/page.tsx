import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import type { ItemPayload } from "@/app/(app)/anadir/actions";
import { DemoSeeder } from "./demo-seeder";
import pieces from "./pieces.json";
import wishes from "./wishes.json";
import compositions from "./compositions.json";

export const metadata: Metadata = { title: "Colección de ejemplo" };

export type DemoPiece = { slug: string; item: ItemPayload };

// Development helper: fills your account with an example collection and real photos
// from Wikimedia Commons (scripts/demo-photos.py) so the app can be seen as it would look in real use.
// It doesn't exist in production.
export default async function DemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const { supabase, userId } = await requireUser();
  const [{ data }, { data: wishRows }, { data: compRows }] = await Promise.all([
    supabase.from("items").select("id, name"),
    supabase.from("wishes").select("name"),
    supabase.from("compositions").select("name"),
  ]);
  const demoExtras = new Set([...wishes.map((w) => w.name), ...compositions.map((c) => c.name)]);

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-ambtx">Solo en desarrollo</p>
        <h1 className="mt-1 font-display text-[34px] font-bold tracking-tight">Colección de ejemplo</h1>
        <p className="mt-1 text-fg2">
          Carga {pieces.length} piezas con fotos reales de Wikimedia Commons para ver la app como quedaría con una
          colección real. Las fotos son de los trenes y accesorios de verdad (el autor está en las notas de cada pieza).
          Las referencias son de modelos que existen; los precios, fechas y ubicaciones son de ejemplo. También añade{" "}
          {wishes.filter((w) => w.status === "reservada").length} preventas,{" "}
          {wishes.filter((w) => w.status === "deseo").length} deseos y {compositions.length} composiciones.
        </p>
      </div>
      <DemoSeeder
        userId={userId}
        pieces={pieces as unknown as DemoPiece[]}
        existing={(data ?? []).map((i) => ({ id: i.id, name: i.name }))}
        extrasLoaded={[...(wishRows ?? []), ...(compRows ?? [])].filter((r) => demoExtras.has(r.name)).length}
      />
    </div>
  );
}
