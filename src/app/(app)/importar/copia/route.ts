import { requireUser } from "@/lib/supabase/server";

// Full backup of the user's data as JSON. Photos aren't included, only their paths.
export async function GET() {
  const { supabase } = await requireUser();
  const tables = ["items", "item_photos", "item_events", "compositions", "composition_items", "wishes"] as const;
  const results = await Promise.all(tables.map((t) => supabase.from(t).select("*")));

  const failed = results.find((r) => r.error);
  if (failed) return new Response("No se ha podido crear la copia", { status: 500 });

  const backup = {
    app: "railodex",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(tables.map((t, i) => [t, results[i].data ?? []])),
  };

  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="railodex-copia-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
