import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { isUuid } from "@/lib/ids";
import { photoSrc } from "@/lib/photos";
import type { Item, ItemPhoto } from "@/lib/types";
import { ItemWizard } from "@/components/item-wizard/item-wizard";

export const metadata: Metadata = { title: "Editar pieza" };

export default async function EditarPage({ params }: PageProps<"/coleccion/[id]/editar">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, userId } = await requireUser();

  const [{ data: item }, { data: photos }, { data: addr }] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).maybeSingle(),
    supabase.from("item_photos").select("*").eq("item_id", id).order("position"),
    supabase.from("items").select("id, name, dcc_address").not("dcc_address", "is", null).neq("status", "vendida"),
  ]);
  if (!item) notFound();

  const list = (photos ?? []) as ItemPhoto[];

  return (
    <ItemWizard
      mode="editar"
      userId={userId}
      initial={item as Item}
      existingPhotos={list.map((p) => ({ id: p.id, path: p.path, url: photoSrc(p.path, "thumb") }))}
      addresses={(addr ?? []).map((a) => ({ id: a.id, name: a.name, address: a.dcc_address as number }))}
    />
  );
}
