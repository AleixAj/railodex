// Live preview of the ficha, shown next to the wizard on wide screens.

import { KINDS, TRACTIONS, labelOf, type Kind } from "@/lib/catalog";
import { PhotoBox, ScaleBadge, Tag } from "@/components/ui";
import type { ItemPayload } from "@/app/(app)/anadir/actions";

export function Preview({ form, cover }: { form: ItemPayload; cover?: string }) {
  const d = form.details;
  const rows: [string, string | undefined][] = [
    [
      "Tipo",
      [
        labelOf(KINDS, form.kind),
        form.traction ? labelOf(TRACTIONS, form.traction).toLowerCase() : d.wagonSubtype?.toLowerCase(),
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    ],
    ["Rodaje", d.wheelArrangement],
    [
      "Sistema",
      form.system === "digital"
        ? [d.protocol ?? "Digital", d.sound ? "con sonido" : ""].filter(Boolean).join(" · ")
        : form.system === "analogico"
          ? `Analógico ${d.current === "ac" ? "AC" : d.current === "dc" ? "DC" : ""}`.trim()
          : undefined,
    ],
    ["Decoder", form.system === "digital" ? d.decoder : undefined],
    ["Dirección", form.system === "digital" ? form.dcc_address : undefined],
    ["Compañía", form.railway],
    ["Compra", form.purchase_price ? `${form.purchase_price} €` : undefined],
    ["Ubicación", form.location],
  ];
  const title = form.name || [form.railway, form.road_number].filter(Boolean).join(" ") || "Nueva pieza";
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[96px]">
        <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.08em] text-fg3">Vista previa de la ficha</p>
        <div className="overflow-hidden rounded-xl border border-ln bg-s1">
          <div className="aspect-[4/3] border-b border-ln">
            <PhotoBox src={cover} alt="Portada" kind={(form.kind || "locomotora") as Kind} />
          </div>
          <div className="p-4">
            <div className="flex gap-1.5">
              {form.scale && <ScaleBadge scale={form.scale} />}
              {form.epoch && <Tag>Ép. {form.epoch}</Tag>}
            </div>
            <p className="mt-2 text-[19px] font-semibold leading-tight">{title}</p>
            <p className="font-mono text-[14px] text-fg3">
              {[form.manufacturer, form.catalog_ref].filter(Boolean).join(" · ") || "Fabricante · referencia"}
            </p>
            <dl className="mt-3 flex flex-col gap-1.5 text-[14px]">
              {rows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-fg3">{k}</dt>
                    <dd className="text-right font-mono">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </div>
    </aside>
  );
}
