"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, LoaderCircle, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { saveItem } from "@/app/(app)/anadir/actions";
import { createClient } from "@/lib/supabase/client";
import { syncPhotos } from "@/components/item-wizard/photos";
import { btn, Card } from "@/components/ui";
import type { DemoPiece } from "./page";
import { deletePieces } from "./actions";

type Status = "pending" | "working" | "done" | "skipped" | "failed";

// Leftovers from testing the app; the seeder offers to clear them out.
const isTestPiece = (name: string) => /\(prueba\)|^Deseo de prueba$/i.test(name);

export function DemoSeeder({
  userId,
  pieces,
  existing,
}: {
  userId: string;
  pieces: DemoPiece[];
  existing: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [running, start] = useTransition();
  const tests = existing.filter((i) => isTestPiece(i.name));
  const owned = new Set(existing.map((i) => i.name));
  const demoNames = new Set(pieces.map((p) => p.item.name));
  const loaded = existing.filter((i) => demoNames.has(i.name));

  const load = () =>
    start(async () => {
      const supabase = createClient();
      for (const piece of pieces) {
        if (owned.has(piece.item.name)) {
          setStatus((s) => ({ ...s, [piece.slug]: "skipped" }));
          continue;
        }
        setStatus((s) => ({ ...s, [piece.slug]: "working" }));
        try {
          const photo = await fetch(`/demo/${piece.slug}.jpg`);
          const files = photo.ok ? [new File([await photo.blob()], `${piece.slug}.jpg`, { type: "image/jpeg" })] : [];
          const res = await saveItem(piece.item, undefined);
          if (!res.id) throw new Error(res.error);
          await syncPhotos(supabase, { userId, itemId: res.id, before: [], kept: [], added: files });
          setStatus((s) => ({ ...s, [piece.slug]: "done" }));
        } catch {
          setStatus((s) => ({ ...s, [piece.slug]: "failed" }));
        }
      }
      router.refresh();
    });

  const clearTests = () =>
    start(async () => {
      await deletePieces(tests.map((t) => t.id));
      router.refresh();
    });

  // Handy after changing the photos or the data in pieces.json: clear it, then load again.
  const clearDemo = () =>
    start(async () => {
      await deletePieces(loaded.map((i) => i.id));
      setStatus({});
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={load} disabled={running} className={btn.primary}>
          <Sparkles className="h-[18px] w-[18px]" /> {running ? "Cargando…" : "Cargar colección de ejemplo"}
        </button>
        {loaded.length > 0 && (
          <button onClick={clearDemo} disabled={running} className={btn.secondary}>
            <RotateCcw className="h-[18px] w-[18px]" /> Quitar la colección de ejemplo
          </button>
        )}
        {tests.length > 0 && (
          <button onClick={clearTests} disabled={running} className={btn.danger}>
            <Trash2 className="h-[18px] w-[18px]" /> Borrar {tests.length} piezas de prueba
          </button>
        )}
      </div>

      <Card className="divide-y divide-ln">
        {pieces.map((p) => {
          const st = status[p.slug] ?? (owned.has(p.item.name) ? "skipped" : "pending");
          return (
            <div key={p.slug} className="flex items-center gap-3 p-3">
              <div className="h-14 w-20 flex-none overflow-hidden rounded-md border border-ln bg-s2">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the generated photo */}
                <img src={`/demo/${p.slug}.jpg`} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.item.name}</p>
                <p className="truncate font-mono text-[13px] text-fg3">
                  {p.item.manufacturer} {p.item.catalog_ref} · {p.item.scale}
                </p>
              </div>
              <StatusIcon status={st} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "working") return <LoaderCircle className="h-5 w-5 animate-spin text-ambtx" aria-label="Cargando" />;
  if (status === "done") return <CircleCheck className="h-5 w-5 text-grn" aria-label="Cargada" />;
  if (status === "skipped") return <span className="text-[13px] text-fg3">Ya está</span>;
  if (status === "failed") return <CircleX className="h-5 w-5 text-red" aria-label="Error" />;
  return null;
}
