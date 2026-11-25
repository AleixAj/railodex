import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { coversOf } from "@/lib/photos";
import { KINDS, TRACTIONS, labelOf } from "@/lib/catalog";
import { money } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Card, EmptyState, PhotoBox, ScaleBadge, Tag } from "@/components/ui";
import { ListItemMotion } from "@/components/motion";
import { FilterBar } from "./filter-bar";

export const metadata: Metadata = { title: "Mi colección" };

const ORDER: Record<string, { column: string; ascending: boolean }> = {
  recientes: { column: "created_at", ascending: false },
  nombre: { column: "name", ascending: true },
  valor: { column: "estimated_value", ascending: false },
  referencia: { column: "catalog_ref", ascending: true },
  compra: { column: "purchase_date", ascending: false },
};

const worth = (i: Item) => Number(i.estimated_value ?? i.purchase_price ?? 0);

export default async function ColeccionPage({ searchParams }: PageProps<"/coleccion">) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const { supabase } = await requireUser();

  let query = supabase
    .from("items")
    .select(
      "id, kind, traction, system, name, manufacturer, catalog_ref, scale, epoch, railway, road_number, dcc_address, status, purchase_price, estimated_value, location, details, item_photos(path, position)",
    );

  // Strip characters that mean something inside a PostgREST filter.
  const q = get("q")
    .replace(/[%,()"\\*]/g, " ")
    .trim();
  if (q) {
    const like = `"%${q}%"`;
    query = query.or(
      `name.ilike.${like},catalog_ref.ilike.${like},road_number.ilike.${like},manufacturer.ilike.${like},railway.ilike.${like}`,
    );
  }
  if (get("escala")) query = query.eq("scale", get("escala"));
  if (get("tipo")) query = query.eq("kind", get("tipo"));
  if (get("sistema")) query = query.eq("system", get("sistema"));
  if (get("compania")) query = query.eq("railway", get("compania"));
  if (get("epoca")) query = query.eq("epoch", get("epoca"));
  if (get("fabricante")) query = query.eq("manufacturer", get("fabricante"));
  const order = ORDER[get("orden")] ?? ORDER.recientes;
  query = query.order(order.column, { ascending: order.ascending, nullsFirst: false });

  const [{ data, error }, { data: facets }] = await Promise.all([
    query,
    supabase.from("items").select("manufacturer, railway"),
  ]);
  const items = (data ?? []) as Item[];
  // The value shown falls back to the purchase price, so sort by that same number.
  if (get("orden") === "valor") items.sort((a, b) => worth(b) - worth(a));
  const manufacturers = [...new Set((facets ?? []).map((f) => f.manufacturer).filter(Boolean))].sort();
  const railways = [...new Set((facets ?? []).map((f) => f.railway).filter(Boolean) as string[])].sort();
  const total = facets?.length ?? 0;
  const covers = coversOf(items);
  const value = items.filter((i) => i.status !== "vendida").reduce((s, i) => s + worth(i), 0);
  const view = get("vista") || "cuadricula";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Mi colección</h1>
        <span className="font-mono text-[14px] text-fg3">
          {items.length} {items.length === 1 ? "pieza" : "piezas"} · {money(value)}
        </span>
      </div>

      {total > 0 && <FilterBar manufacturers={manufacturers} railways={railways} />}

      {error && (
        <p role="alert" className="rounded-[10px] border border-red/40 bg-red2 px-3 py-2.5 text-red">
          No se ha podido cargar la colección. Recarga la página.
        </p>
      )}

      {total === 0 ? (
        <EmptyState
          title="Aún no tienes piezas"
          text="Empieza por tu locomotora favorita. Luego podrás filtrar por escala, compañía, época o sistema."
          action={{ href: "/anadir", label: "Añadir pieza" }}
        />
      ) : items.length === 0 ? (
        <Card className="px-6 py-12 text-center text-fg2">Ninguna pieza coincide con estos filtros.</Card>
      ) : view === "tabla" ? (
        <TableView items={items} />
      ) : view === "lista" ? (
        <ListView items={items} covers={covers} />
      ) : (
        <GridView items={items} covers={covers} />
      )}
    </div>
  );
}

function subtitle(i: Item) {
  const traction = i.traction ? labelOf(TRACTIONS, i.traction).toLowerCase() : "";
  return [labelOf(KINDS, i.kind), traction].filter(Boolean).join(" ");
}

function GridView({ items, covers }: { items: Item[]; covers: Record<string, string> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((i) => (
        <ListItemMotion key={i.id} type="filter">
          <Link
            href={`/coleccion/${i.id}`}
            className="lazy-card press zoom-on-hover group block overflow-hidden rounded-xl border border-ln bg-s1 hover:border-ln2"
          >
            <div className="relative aspect-[4/3] border-b border-ln">
              <PhotoBox src={covers[i.id]} alt={i.name} kind={i.kind} />
              {!covers[i.id] && (
                <span className="absolute bottom-3 left-3 font-mono text-[12px] tracking-[0.06em] text-fg3">
                  SIN FOTO
                </span>
              )}
              {i.status !== "coleccion" && (
                <span className="absolute right-3 top-3">
                  <Tag tone="amb">
                    {i.status === "preventa" ? "Preventa" : i.status === "prestada" ? "Prestada" : "Vendida"}
                  </Tag>
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5">
                <ScaleBadge scale={i.scale} />
                {i.epoch && <Tag>Ép. {i.epoch}</Tag>}
                {i.system === "digital" && <Tag>{i.details?.protocol ?? "Digital"}</Tag>}
                <span className="ml-auto font-semibold">{money(i.estimated_value ?? i.purchase_price)}</span>
              </div>
              <p className="mt-2.5 truncate text-[18px] font-semibold group-hover:text-ambtx">{i.name}</p>
              <p className="truncate font-mono text-[14px] text-fg3">
                {[i.manufacturer, i.catalog_ref].filter(Boolean).join(" ")}
              </p>
            </div>
          </Link>
        </ListItemMotion>
      ))}
    </div>
  );
}

function ListView({ items, covers }: { items: Item[]; covers: Record<string, string> }) {
  return (
    <Card className="divide-y divide-ln overflow-hidden">
      {items.map((i) => (
        <Link key={i.id} href={`/coleccion/${i.id}`} className="lazy-row flex items-center gap-4 p-3 hover:bg-s2/50">
          <div className="h-14 w-20 flex-none overflow-hidden rounded-md border border-ln">
            <PhotoBox src={covers[i.id]} alt={i.name} kind={i.kind} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{i.name}</p>
            <p className="truncate text-[14px] text-fg3">
              <span className="font-mono">{[i.manufacturer, i.catalog_ref].filter(Boolean).join(" ")}</span> ·{" "}
              {subtitle(i)}
              {i.railway ? ` · ${i.railway}` : ""}
            </p>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <ScaleBadge scale={i.scale} />
            {i.epoch && <Tag>{i.epoch}</Tag>}
          </div>
          <span className="w-20 text-right font-semibold">{money(i.estimated_value ?? i.purchase_price)}</span>
        </Link>
      ))}
    </Card>
  );
}

function TableView({ items }: { items: Item[] }) {
  const th =
    "whitespace-nowrap px-3 py-2.5 text-left font-mono text-[12px] font-normal uppercase tracking-[0.06em] text-fg3";
  const td = "whitespace-nowrap px-3 py-2.5";
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-[15px]">
        <thead className="border-b border-ln">
          <tr>
            <th className={th}>Esc.</th>
            <th className={th}>Referencia</th>
            <th className={th}>Modelo</th>
            <th className={th}>Tipo</th>
            <th className={th}>Compañía</th>
            <th className={th}>Época</th>
            <th className={th}>Matrícula</th>
            <th className={th}>Sistema</th>
            <th className={th}>Dirección</th>
            <th className={th}>Ubicación</th>
            <th className={`${th} text-right`}>Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ln">
          {items.map((i) => (
            <tr key={i.id} className="hover:bg-s2/50">
              <td className={td}>
                <ScaleBadge scale={i.scale} />
              </td>
              <td className={`${td} font-mono`}>{[i.manufacturer, i.catalog_ref].filter(Boolean).join(" ")}</td>
              <td className={td}>
                <Link href={`/coleccion/${i.id}`} className="font-semibold hover:text-ambtx">
                  {i.name}
                </Link>
              </td>
              <td className={`${td} text-fg2`}>{subtitle(i)}</td>
              <td className={td}>{i.railway ?? "—"}</td>
              <td className={td}>{i.epoch ?? "—"}</td>
              <td className={`${td} font-mono`}>{i.road_number ?? "—"}</td>
              <td className={`${td} text-fg2`}>
                {i.system === "digital"
                  ? (i.details?.protocol ?? "Digital")
                  : i.system === "analogico"
                    ? `Analóg. ${i.details?.current === "ac" ? "AC" : "DC"}`
                    : "—"}
              </td>
              <td className={`${td} font-mono`}>{i.dcc_address ?? "—"}</td>
              <td className={`${td} text-fg2`}>{i.location ?? "—"}</td>
              <td className={`${td} text-right font-semibold`}>{money(i.estimated_value ?? i.purchase_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
