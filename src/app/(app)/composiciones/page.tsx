import type { Metadata } from "next";
import Link from "next/link";
import { TrainTrack } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { coversOf } from "@/lib/photos";
import { Card, PhotoBox } from "@/components/ui";
import type { Kind } from "@/lib/catalog";
import { NewComposition } from "./new-composition";

export const metadata: Metadata = { title: "Composiciones" };

type Row = {
  id: string;
  name: string;
  composition_items: { position: number; items: { id: string; name: string; kind: Kind } | null }[];
};

export default async function ComposicionesPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("compositions")
    .select("id, name, composition_items(position, items(id, name, kind, item_photos(path, position)))")
    .order("created_at", { ascending: false });

  const rows = ((data ?? []) as unknown as Row[]).map((c) => ({
    ...c,
    members: c.composition_items
      .filter((m) => m.items)
      .sort((a, b) => a.position - b.position)
      .map((m) => m.items!),
  }));
  const covers = coversOf(rows.flatMap((r) => r.members));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Composiciones</h1>
        <p className="mt-1 text-fg2">Forma trenes completos con tus locomotoras y coches, y comprueba que encajan.</p>
      </div>

      <Card className="p-4">
        <NewComposition />
      </Card>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <TrainTrack className="h-10 w-10 text-ln2" strokeWidth={1.25} />
          <p className="text-fg2">Aún no tienes composiciones. Crea una y añádele piezas de tu colección.</p>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/composiciones/${c.id}`}
              className="press rounded-xl border border-ln bg-s1 p-4 hover:border-ln2"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[18px] font-semibold">{c.name}</p>
                <span className="flex-none font-mono text-[13px] text-fg3">
                  {c.members.length} {c.members.length === 1 ? "pieza" : "piezas"}
                </span>
              </div>
              <div className="mt-3 flex gap-1.5 overflow-hidden">
                {c.members.length === 0 ? (
                  <div className="photo-placeholder h-14 w-full rounded-md border border-ln" />
                ) : (
                  c.members.slice(0, 8).map((m) => (
                    <div key={m.id} className="h-14 w-20 flex-none overflow-hidden rounded-md border border-ln">
                      <PhotoBox src={covers[m.id]} alt={m.name} kind={m.kind} />
                    </div>
                  ))
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
