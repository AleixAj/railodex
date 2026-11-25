import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Copy, MapPin, Pencil, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { photoUrls } from "@/lib/items";
import {
  CONDITIONS,
  EVENT_KINDS,
  KINDS,
  ORIGINS,
  TRACTIONS,
  WHEEL_ARRANGEMENTS,
  labelOf,
  scaleInfo,
} from "@/lib/catalog";
import { completeness, money, shortDate } from "@/lib/format";
import type { Item, ItemEvent, ItemPhoto } from "@/lib/types";
import { Card, ScaleBadge, SectionTitle, Tag, btn } from "@/components/ui";
import { WheelDiagram } from "@/components/wheel-diagram";
import {
  AddEventForm,
  CompositionPicker,
  DeleteEventButton,
  DeleteItemButton,
  Gallery,
  StatusSelect,
} from "./client-parts";

export async function generateMetadata({ params }: PageProps<"/coleccion/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("items").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Pieza" };
}

export default async function FichaPage({ params, searchParams }: PageProps<"/coleccion/[id]">) {
  const { id } = await params;
  const failedPhotos = Number((await searchParams).fotos_fallidas) || 0;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();

  const [{ data: itemData }, { data: photosData }, { data: eventsData }, { data: compsData }, { data: linksData }] =
    await Promise.all([
      supabase.from("items").select("*").eq("id", id).maybeSingle(),
      supabase.from("item_photos").select("*").eq("item_id", id).order("position"),
      supabase.from("item_events").select("*").eq("item_id", id).order("happened_on", { ascending: false }),
      supabase.from("compositions").select("id, name").order("name"),
      supabase.from("composition_items").select("composition_id").eq("item_id", id),
    ]);
  if (!itemData) notFound();

  const inTrains = new Set((linksData ?? []).map((l) => l.composition_id));
  const compositions = (compsData ?? []).map((c) => ({ ...c, member: inTrains.has(c.id) }));

  const item = itemData as Item;
  const d = item.details ?? {};
  const photos = (photosData ?? []) as ItemPhoto[];
  const events = (eventsData ?? []) as ItemEvent[];
  const urlsById = await photoUrls(supabase, photos);
  const urls = photos.map((p) => urlsById[p.id]).filter(Boolean);

  let duplicate: { id: string; name: string } | null = null;
  if (item.dcc_address !== null && item.status !== "vendida") {
    const { data } = await supabase
      .from("items")
      .select("id, name")
      .eq("dcc_address", item.dcc_address)
      .neq("id", item.id)
      .neq("status", "vendida")
      .limit(1)
      .maybeSingle();
    duplicate = data;
  }

  const pct = completeness(item, photos.length);
  const wa =
    item.traction && d.wheelArrangement
      ? WHEEL_ARRANGEMENTS[item.traction]?.find((w) => w.uic === d.wheelArrangement)
      : undefined;
  const altLabel = item.traction === "vapor" ? "Whyte" : "AAR";
  const kindLine = [
    labelOf(KINDS, item.kind),
    item.traction ? labelOf(TRACTIONS, item.traction).toLowerCase() : d.wagonSubtype?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");
  const eventsTotal = events.reduce((s, e) => s + Number(e.cost ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {failedPhotos > 0 && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red/40 bg-red2 p-3 text-red">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-none" />
          La pieza se ha guardado, pero{" "}
          {failedPhotos === 1 ? "una foto no se ha podido subir" : `${failedPhotos} fotos no se han podido subir`}.
          Puedes volver a añadirlas desde Editar.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/coleccion" className={btn.ghost}>
          <ChevronLeft className="h-4 w-4" /> Colección
        </Link>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/coleccion/${item.id}/editar`} className={btn.secondary}>
            <Pencil className="h-[18px] w-[18px]" /> Editar
          </Link>
          <Link href={`/anadir?duplicar=${item.id}`} className={btn.secondary}>
            <Copy className="h-[18px] w-[18px]" /> Duplicar
          </Link>
          <CompositionPicker itemId={item.id} compositions={compositions} />
          <DeleteItemButton itemId={item.id} name={item.name} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Gallery urls={urls} name={item.name} kind={item.kind} />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <ScaleBadge scale={item.scale} />
            {item.epoch && <Tag>Época {item.epoch}</Tag>}
            <StatusSelect itemId={item.id} status={item.status} />
          </div>
          <div>
            <h1 className="font-display text-[36px] font-bold leading-[1.05] tracking-tight">{item.name}</h1>
            <p className="mt-1 text-[17px] text-fg2">
              {[kindLine, item.railway, item.manufacturer].filter(Boolean).join(" · ")}
            </p>
          </div>

          <Card className="grid grid-cols-1 divide-y divide-ln sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Mono label="Referencia" value={[item.manufacturer, item.catalog_ref].filter(Boolean).join(" ")} />
            <Mono label="Matrícula" value={item.road_number ?? "—"} />
            <Mono
              label="Dirección"
              value={item.dcc_address !== null ? String(item.dcc_address) : "—"}
              accent={item.dcc_address !== null}
            />
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-[15px] text-fg2">Valor estimado</p>
              <p className="mt-1 font-display text-[28px] font-bold">
                {money(item.estimated_value ?? item.purchase_price, item.currency)}
              </p>
              <p className="text-[14px] text-fg3">Compra {money(item.purchase_price, item.currency)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[15px] text-fg2">Ficha completa</p>
              <p className="mt-1 font-display text-[28px] font-bold">{pct} %</p>
              <div className="mt-2 h-1.5 rounded-full bg-s2">
                <div className="h-full rounded-full bg-amb" style={{ width: `${pct}%` }} />
              </div>
            </Card>
          </div>

          {(item.location || item.condition) && (
            <Card className="flex items-center gap-3 px-4 py-3">
              <MapPin className="h-[18px] w-[18px] text-fg3" />
              <span className="flex-1">{item.location ?? "Sin ubicación"}</span>
              {item.condition && <span className="text-fg2">{labelOf(CONDITIONS, item.condition)}</span>}
            </Card>
          )}
        </div>
      </div>

      {(item.kind === "locomotora" || item.kind === "automotor" || item.system) && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl font-bold">Técnico</h2>
          <div className="grid gap-3 lg:grid-cols-3">
            {d.wheelArrangement && (
              <Card className="p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[15px] text-fg2">Rodaje</span>
                  {wa?.alt && (
                    <span className="font-mono text-[13px] text-fg3">
                      {altLabel} {wa.alt}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-[30px] font-semibold">{d.wheelArrangement}</p>
                <WheelDiagram uic={d.wheelArrangement} />
                <p className="mt-2 flex gap-4 text-[13px] text-fg3">
                  <span className="flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-full bg-amb" />
                    Eje motor
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-full border border-fg3" />
                    Eje portante
                  </span>
                </p>
              </Card>
            )}
            <Card className="p-5">
              <p className="text-[15px] text-fg2">Medidas y rodadura</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <Spec label="Longitud" value={d.lengthMm ? `${d.lengthMm} mm` : undefined} />
                <Spec
                  label="Escala"
                  value={
                    scaleInfo(item.scale)
                      ? `${scaleInfo(item.scale)!.ratio} · ${scaleInfo(item.scale)!.gauge}`
                      : item.scale
                  }
                />
                <Spec label="Enganche" value={d.coupler} />
                <Spec
                  label="Transmisión"
                  value={
                    d.transmission
                      ? { electrica: "Eléctrica", hidraulica: "Hidráulica", mecanica: "Mecánica" }[d.transmission]
                      : undefined
                  }
                />
                {item.traction === "vapor" && (
                  <Spec label="Ténder" value={d.tender === undefined ? undefined : d.tender ? "Sí" : "No"} />
                )}
                {item.traction === "vapor" && (
                  <Spec
                    label="Humo"
                    value={d.smokeGenerator === undefined ? undefined : d.smokeGenerator ? "Sí" : "No"}
                  />
                )}
                {item.traction === "electrica" && <Spec label="Pantógrafos" value={d.pantographs?.toString()} />}
              </dl>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-fg2">Sistema</span>
                {item.system === "digital" && d.protocol && <Tag tone="amb">{d.protocol}</Tag>}
              </div>
              {item.system === "digital" ? (
                <>
                  <p className="mt-1 text-[20px] font-semibold">{d.decoder ?? "Decoder sin indicar"}</p>
                  <dl className="mt-3 flex flex-col gap-1.5 text-[15px]">
                    <Row
                      label="Origen"
                      value={
                        d.decoderOrigin === "instalado"
                          ? "Instalado después"
                          : d.decoderOrigin === "fabrica"
                            ? "De fábrica"
                            : undefined
                      }
                    />
                    <Row label="Sonido" value={d.sound ? (d.speaker ? `Sí · ${d.speaker}` : "Sí") : "No"} />
                    <Row label="RailCom" value={d.railcom ? "Sí" : "No"} />
                    <Row label="Firmware" value={d.firmware} mono />
                  </dl>
                </>
              ) : item.system === "analogico" ? (
                <>
                  <p className="mt-1 text-[20px] font-semibold">
                    Analógico · {d.current === "ac" ? "alterna (3 carriles)" : "continua (2 carriles)"}
                  </p>
                  <dl className="mt-3 flex flex-col gap-1.5 text-[15px]">
                    <Row
                      label="Preparada para digital"
                      value={d.digitalReady ? `Sí${d.interface ? ` · ${d.interface}` : ""}` : "No"}
                    />
                    <Row
                      label="Luces direccionales"
                      value={d.directionalLights === undefined ? undefined : d.directionalLights ? "Sí" : "No"}
                    />
                  </dl>
                </>
              ) : (
                <p className="mt-2 text-fg3">Sin indicar.</p>
              )}
              {duplicate && (
                <Link
                  href={`/coleccion/${duplicate.id}`}
                  className="mt-3 flex items-start gap-2 rounded-lg border border-red/40 bg-red2 p-2.5 text-[14px] text-red"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
                  La dirección {item.dcc_address} también la usa {duplicate.name}
                </Link>
              )}
            </Card>
          </div>

          {item.system === "digital" && d.functions && d.functions.length > 0 && (
            <Card className="p-5">
              <SectionTitle
                aside={<span className="font-mono text-[13px] text-fg3">{d.functions.length} funciones</span>}
              >
                Funciones del decoder
              </SectionTitle>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {d.functions.map((f) => (
                  <div key={f.key} className="flex items-start gap-2.5 rounded-lg border border-ln bg-s3 px-3 py-2.5">
                    <span className="font-mono font-semibold text-ambtx">{f.key}</span>
                    <span className="text-[15px] leading-snug">{f.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle>Identificación</SectionTitle>
          <dl className="mt-3 flex flex-col gap-2 text-[15px]">
            <Row label="Fabricante" value={item.manufacturer} />
            <Row label="Referencia" value={item.catalog_ref ?? undefined} mono />
            <Row label="Año del modelo" value={d.modelYear?.toString()} />
            <Row label="EAN" value={d.ean} mono />
            <Row label="Edición limitada" value={d.limitedEdition || "No"} />
          </dl>
        </Card>
        <Card className="p-5">
          <SectionTitle>El tren real</SectionTitle>
          <dl className="mt-3 flex flex-col gap-2 text-[15px]">
            <Row label="Compañía" value={item.railway ?? undefined} />
            <Row label="Matrícula" value={item.road_number ?? undefined} mono />
            <Row label="Época NEM" value={item.epoch ?? undefined} />
            <Row label="Librea" value={d.livery} />
            {d.wagonSubtype && <Row label="Subtipo" value={d.wagonSubtype} />}
            {d.units && <Row label="Unidades" value={String(d.units)} />}
          </dl>
        </Card>
        <Card className="p-5">
          <SectionTitle>Compra</SectionTitle>
          <dl className="mt-3 flex flex-col gap-2 text-[15px]">
            <Row
              label="Precio"
              value={item.purchase_price !== null ? money(item.purchase_price, item.currency) : undefined}
            />
            <Row label="Fecha" value={item.purchase_date ? shortDate(item.purchase_date) : undefined} />
            <Row label="Origen" value={d.origin ? labelOf(ORIGINS, d.origin) : undefined} />
            <Row label="Tienda / vendedor" value={d.seller} />
            <Row label="Caja original" value={d.hasBox === undefined ? undefined : d.hasBox ? "Sí" : "No"} />
            <Row
              label="Instrucciones"
              value={d.hasInstructions === undefined ? undefined : d.hasInstructions ? "Sí" : "No"}
            />
          </dl>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[17px] font-semibold">Historial</h2>
            <div className="flex items-center gap-3">
              {eventsTotal > 0 && <span className="font-mono text-[13px] text-fg3">Total {money(eventsTotal)}</span>}
              <AddEventForm itemId={item.id} />
            </div>
          </div>
          {events.length === 0 ? (
            <p className="mt-3 text-[15px] text-fg3">
              Apunta aquí limpiezas, engrases, reparaciones o la digitalización.
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-4 border-l border-ln pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-amb bg-bg" />
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-mono text-[13px] text-fg3">
                        {shortDate(e.happened_on)} <Tag>{labelOf(EVENT_KINDS, e.kind)}</Tag>
                      </p>
                      <p className="mt-1 font-semibold">{e.title}</p>
                      {e.notes && <p className="text-[15px] text-fg2">{e.notes}</p>}
                    </div>
                    {e.cost !== null && <span className="font-mono">{money(e.cost)}</span>}
                    <DeleteEventButton itemId={item.id} eventId={e.id} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card className="p-5">
          <SectionTitle>Notas</SectionTitle>
          <p className="mt-3 whitespace-pre-line text-[15px] text-fg2">{item.notes || "Sin notas."}</p>
          {item.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Mono({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg3">{label}</p>
      <p className={`mt-0.5 font-mono text-[17px] ${accent ? "text-ambtx" : ""}`}>{value}</p>
    </div>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[13px] text-fg3">{label}</dt>
      <dd className="font-mono">{value || "—"}</dd>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-fg3">{label}</dt>
      <dd className={`text-right ${mono ? "font-mono" : ""} ${value ? "" : "text-fg3"}`}>{value || "—"}</dd>
    </div>
  );
}
