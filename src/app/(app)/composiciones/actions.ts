"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string; name?: string };

export async function createComposition(prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "")
    .trim()
    .slice(0, 120);
  if (!name) return { error: "Ponle un nombre, p. ej. «Talgo III RENFE»." };
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("compositions").insert({ name }).select("id").single();
  if (error || !data) return { name, error: "No se ha podido crear la composición." };
  revalidatePath("/composiciones");
  redirect(`/composiciones/${data.id}`);
}

export async function renameComposition(id: string, name: string) {
  const clean = name.trim().slice(0, 120);
  if (!clean) return;
  const { supabase } = await requireUser();
  await supabase.from("compositions").update({ name: clean }).eq("id", id);
  revalidatePath(`/composiciones/${id}`);
}

export async function deleteComposition(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("compositions").delete().eq("id", id);
  revalidatePath("/composiciones");
  redirect("/composiciones");
}

export async function addToComposition(id: string, itemId: string) {
  if (!itemId) return;
  const { supabase } = await requireUser();
  const { data: last } = await supabase
    .from("composition_items")
    .select("position")
    .eq("composition_id", id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  await supabase
    .from("composition_items")
    .insert({ composition_id: id, item_id: itemId, position: (last?.position ?? -1) + 1 });
  revalidatePath(`/composiciones/${id}`);
}

export async function removeFromComposition(id: string, itemId: string) {
  const { supabase } = await requireUser();
  await supabase.from("composition_items").delete().eq("composition_id", id).eq("item_id", itemId);
  revalidatePath(`/composiciones/${id}`);
}

/** Saves the whole order at once: item ids from the front of the train to the back. */
export async function reorderComposition(id: string, itemIds: string[]) {
  const { supabase } = await requireUser();
  await Promise.all(
    itemIds.map((itemId, position) =>
      supabase.from("composition_items").update({ position }).eq("composition_id", id).eq("item_id", itemId),
    ),
  );
  revalidatePath(`/composiciones/${id}`);
}
