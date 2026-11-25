import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_PLAN_LIMIT } from "./catalog";

/**
 * How many more pieces the user can add on the free plan.
 * There's no paid plan yet, so everyone is on the free one for now.
 */
export async function remainingSlots(supabase: SupabaseClient) {
  const { count } = await supabase.from("items").select("id", { count: "exact", head: true });
  return Math.max(0, FREE_PLAN_LIMIT - (count ?? 0));
}

export const LIMIT_MESSAGE = `Has llegado al límite de ${FREE_PLAN_LIMIT} piezas del plan Gratis. Con Pro no hay límite.`;
