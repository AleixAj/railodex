import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import type { ItemPayload } from "@/app/(app)/anadir/actions";
import { DemoSeeder } from "./demo-seeder";
import pieces from "./pieces.json";

export const metadata: Metadata = { title: "Colección de ejemplo" };

export type DemoPiece = { slug: string; item: ItemPayload };

// Development helper: fills your account with an example collection and real photos
// from Wikimedia Commons (scripts/demo-photos.py) so the app can be seen as it would look in real use.
// It doesn't exist in production.
export default async function DemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const { supabase, userId } = await requireUser();
  const { data } = await supabase.from("items").select("id, name");

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-ambtx">Solo en desarrollo</p>
        <h1 className="mt-1 font-display text-[34px] font-bold tracking-tight">Colección de ejemplo</h1>
        <p className="mt-1 text-fg2">
          Carga {pieces.length} piezas con fotos reales de Wikimedia Commons para ver la app como quedaría con una
          colección real. Las fotos son de los trenes de verdad (el autor está en las notas de cada pieza). Las
          referencias son de modelos que existen; los precios, fechas y ubicaciones son de ejemplo.
        </p>
      </div>
      <DemoSeeder
        userId={userId}
        pieces={pieces as unknown as DemoPiece[]}
        existing={(data ?? []).map((i) => ({ id: i.id, name: i.name }))}
      />
    </div>
  );
}
