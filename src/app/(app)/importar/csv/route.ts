import { requireUser } from "@/lib/supabase/server";
import { TIME_ZONE, todayISO } from "@/lib/dates";
import { itemsToCsv } from "@/lib/csv";
import type { Item } from "@/lib/types";

export async function GET() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("items").select("*").order("created_at");
  if (error) return new Response("No se ha podido exportar", { status: 500 });

  const day = todayISO(TIME_ZONE);
  return new Response(itemsToCsv((data ?? []) as Item[]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="railodex-coleccion-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
