import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Printer, QrCode } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { coversOf } from "@/lib/photos";
import { buildTree, isInside, splitLocation, joinLocation, type LocationNode } from "@/lib/locations";
import { money } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Card, PhotoBox, ScaleBadge, btn } from "@/components/ui";

export const metadata: Metadata = { title: "Ubicaciones" };

export default async function UbicacionesPage({ searchParams }: PageProps<"/ubicaciones">) {
  const { l } = await searchParams;
  const selected = typeof l === "string" ? l : "";
  const { supabase } = await requireUser();

  const { data } = await supabase
    .from("items")
    .select(
      "id, name, kind, scale, manufacturer, catalog_ref, location, estimated_value, purchase_price, status, item_photos(path, position)",
    )
    .neq("status", "vendida")
    .order("name");
  const items = (data ?? []) as Item[];
  const { roots, unassigned } = buildTree(items.map((i) => i.location));

  const inside =
    selected === "__sin__"
      ? items.filter((i) => splitLocation(i.location).length === 0)
      : selected
        ? items.filter((i) => isInside(i.location, selected))
        : [];
  const covers = coversOf(inside);
  const crumbs = selected && selected !== "__sin__" ? splitLocation(selected) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-[34px] font-bold tracking-tight">Ubicaciones</h1>
          <p className="mt-1 text-fg2">
            Dónde está cada pieza. Se escribe en cada ficha como ruta, p. ej. «Salón › Vitrina 1 › Estante 2».
          </p>
        </div>
        {roots.length > 0 && (
          <Link href="/ubicaciones/etiquetas" className={btn.secondary}>
            <Printer className="h-[18px] w-[18px]" /> Imprimir etiquetas QR
          </Link>
        )}
      </div>

      {roots.length === 0 && unassigned === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <MapPin className="h-10 w-10 text-ln2" strokeWidth={1.25} />
          <p className="text-fg2">
            Aún no hay piezas. Al añadirlas, indica su ubicación en el paso «Fotos y ubicación».
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
          <Card className="p-3">
            <nav aria-label="Árbol de ubicaciones">
              <Tree nodes={roots} selected={selected} />
              {unassigned > 0 && (
                <Link
                  href="/ubicaciones?l=__sin__"
                  className={`mt-1 flex h-10 items-center justify-between rounded-lg px-3 text-[15px] ${selected === "__sin__" ? "bg-amb2 text-ambtx" : "text-fg3 hover:bg-s2"}`}
                >
                  Sin ubicación <span className="font-mono text-[13px]">{unassigned}</span>
                </Link>
              )}
            </nav>
          </Card>

          <div className="flex flex-col gap-3">
            {!selected ? (
              <Card className="px-6 py-12 text-center text-fg2">Elige una ubicación para ver qué hay dentro.</Card>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {selected === "__sin__" ? (
                    <h2 className="text-[20px] font-semibold">Sin ubicación</h2>
                  ) : (
                    <h2 className="flex flex-wrap items-center gap-1 text-[20px] font-semibold">
                      {crumbs.map((c, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight className="h-4 w-4 text-fg3" />}
                          <Link
                            href={`/ubicaciones?l=${encodeURIComponent(joinLocation(crumbs.slice(0, i + 1)))}`}
                            className="hover:text-ambtx"
                          >
                            {c}
                          </Link>
                        </span>
                      ))}
                    </h2>
                  )}
                  <span className="font-mono text-[14px] text-fg3">
                    {inside.length} {inside.length === 1 ? "pieza" : "piezas"} ·{" "}
                    {money(inside.reduce((s, i) => s + Number(i.estimated_value ?? i.purchase_price ?? 0), 0))}
                  </span>
                  {selected !== "__sin__" && (
                    <Link
                      href={`/ubicaciones/etiquetas?l=${encodeURIComponent(selected)}`}
                      className={`${btn.ghost} ml-auto`}
                    >
                      <QrCode className="h-4 w-4" /> Etiqueta
                    </Link>
                  )}
                </div>
                <Card className="divide-y divide-ln">
                  {inside.map((i) => (
                    <Link key={i.id} href={`/coleccion/${i.id}`} className="flex items-center gap-3 p-3 hover:bg-s2/50">
                      <div className="h-12 w-16 flex-none overflow-hidden rounded-md border border-ln">
                        <PhotoBox src={covers[i.id]} alt={i.name} kind={i.kind} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{i.name}</p>
                        <p className="truncate text-[14px] text-fg3">{i.location ?? "—"}</p>
                      </div>
                      <ScaleBadge scale={i.scale} />
                    </Link>
                  ))}
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Tree({ nodes, selected, depth = 0 }: { nodes: LocationNode[]; selected: string; depth?: number }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((n) => {
        const active = selected.toLowerCase() === n.path.toLowerCase();
        return (
          <li key={n.path}>
            <Link
              href={`/ubicaciones?l=${encodeURIComponent(n.path)}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center justify-between gap-2 rounded-lg pr-3 text-[15px] ${active ? "bg-amb2 font-semibold text-ambtx" : "text-fg2 hover:bg-s2 hover:text-fg"}`}
              style={{ paddingLeft: 12 + depth * 16 }}
            >
              <span className="truncate">{n.name}</span>
              <span className="font-mono text-[13px] text-fg3">{n.count}</span>
            </Link>
            {n.children.length > 0 && <Tree nodes={n.children} selected={selected} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}
