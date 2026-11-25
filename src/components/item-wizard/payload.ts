import type { Item } from "@/lib/types";
import type { ItemPayload } from "@/app/(app)/anadir/actions";

/** Form state starts as strings so inputs stay controlled; the server converts them back. */
export function toPayload(i?: Partial<Item>): ItemPayload {
  return {
    kind: i?.kind ?? "",
    traction: i?.traction ?? null,
    system: i?.system ?? null,
    name: i?.name ?? "",
    manufacturer: i?.manufacturer ?? "",
    catalog_ref: i?.catalog_ref ?? "",
    scale: i?.scale ?? "",
    epoch: i?.epoch ?? "",
    railway: i?.railway ?? "",
    road_number: i?.road_number ?? "",
    dcc_address: i?.dcc_address != null ? String(i.dcc_address) : "",
    condition: i?.condition ?? "",
    status: i?.status ?? "coleccion",
    purchase_price: i?.purchase_price != null ? String(i.purchase_price) : "",
    estimated_value: i?.estimated_value != null ? String(i.estimated_value) : "",
    purchase_date: i?.purchase_date ?? "",
    location: i?.location ?? "",
    tags: (i?.tags ?? []).join(", "),
    notes: i?.notes ?? "",
    details: i?.details ?? {},
  };
}
