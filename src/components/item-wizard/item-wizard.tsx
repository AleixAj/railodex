"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Cpu, Gauge, ImagePlus, Plus, TriangleAlert, X } from "lucide-react";
import {
  CONDITIONS,
  COUPLERS,
  DECODER_BRANDS,
  DEFAULT_FUNCTIONS,
  EPOCHS,
  INTERFACES,
  KINDS,
  MANUFACTURERS,
  ORIGINS,
  PROTOCOLS,
  RAILWAYS,
  SCALES,
  STATUSES,
  TRACTIONS,
  WAGON_SUBTYPES,
  WHEEL_ARRANGEMENTS,
  labelOf,
  type Kind,
  type Traction,
} from "@/lib/catalog";
import type { Item, ItemDetails } from "@/lib/types";
import { KIND_ICONS, PhotoBox, ScaleBadge, Tag, btn, field, Label } from "@/components/ui";
import { WheelDiagram } from "@/components/wheel-diagram";
import { saveItem, type ItemPayload } from "@/app/(app)/anadir/actions";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "./compress";

type StepId = "tipo" | "traccion" | "sistema" | "identificacion" | "compra" | "fotos" | "revision";
const STEP_LABELS: Record<StepId, string> = {
  tipo: "Tipo",
  traccion: "Tracción",
  sistema: "Sistema",
  identificacion: "Identificación",
  compra: "Compra y origen",
  fotos: "Fotos y ubicación",
  revision: "Revisión",
};

export type ExistingPhoto = { id: string; path: string; url: string };

export function ItemWizard({
  userId,
  initial,
  existingPhotos = [],
  addresses,
  mode,
}: {
  userId: string;
  initial?: Partial<Item>;
  existingPhotos?: ExistingPhoto[];
  addresses: { id: string; name: string; address: number }[];
  mode: "crear" | "editar";
}) {
  const router = useRouter();
  const [form, setForm] = useState<ItemPayload>(() => toPayload(initial));
  const [step, setStep] = useState<StepId>(mode === "editar" ? "identificacion" : "tipo");
  const [newPhotos, setNewPhotos] = useState<{ file: File; url: string }[]>([]);
  const [keptPhotos, setKeptPhotos] = useState(existingPhotos);
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();

  const kind = form.kind as Kind | "";
  const isTractor = kind === "locomotora" || kind === "automotor";
  const isRolling = kind === "coche" || kind === "vagon";

  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = ["tipo"];
    if (isTractor || isRolling) s.push("traccion");
    if (isTractor) s.push("sistema");
    s.push("identificacion", "compra", "fotos", "revision");
    return s;
  }, [isTractor, isRolling]);
  const idx = steps.indexOf(step);

  const set = <K extends keyof ItemPayload>(key: K, value: ItemPayload[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setD = <K extends keyof ItemDetails>(key: K, value: ItemDetails[K]) =>
    setForm((f) => ({ ...f, details: { ...f.details, [key]: value } }));

  const required = Boolean(kind && form.manufacturer.trim() && form.scale);
  const canNext = step === "tipo" ? Boolean(kind) : true;

  const go = (to: number) => {
    setError("");
    const target = steps[Math.max(0, Math.min(steps.length - 1, to))];
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const conflict =
    form.system === "digital" && form.dcc_address
      ? addresses.find((a) => a.address === Number(form.dcc_address) && a.id !== initial?.id)
      : undefined;
  const freeAddress = () => {
    const used = new Set(addresses.map((a) => a.address));
    let n = Number(form.dcc_address) || 3;
    while (used.has(n) && n < 10239) n++;
    return n;
  };

  const save = (andAnother = false) => {
    if (!required) {
      setError("Faltan datos obligatorios: tipo, fabricante y escala.");
      setStep(!kind ? "tipo" : "identificacion");
      return;
    }
    setError("");
    startSaving(async () => {
      const res = await saveItem(form, mode === "editar" ? initial?.id : undefined);
      if (res.error || !res.id) {
        setError(res.error ?? "No se ha podido guardar.");
        return;
      }
      const itemId = res.id;
      const supabase = createClient();

      // Fotos quitadas al editar
      const removed = existingPhotos.filter((p) => !keptPhotos.some((k) => k.id === p.id));
      if (removed.length) {
        await supabase.from("item_photos").delete().in("id", removed.map((p) => p.id));
        await supabase.storage.from("item-photos").remove(removed.map((p) => p.path));
      }
      // Orden de las que se quedan
      for (const [i, p] of keptPhotos.entries()) {
        await supabase.from("item_photos").update({ position: i }).eq("id", p.id);
      }
      // Fotos nuevas: se comprimen en el navegador antes de subir
      let failed = 0;
      for (const [i, p] of newPhotos.entries()) {
        try {
          const blob = await compressImage(p.file);
          const path = `${userId}/${itemId}/${crypto.randomUUID()}.webp`;
          const up = await supabase.storage.from("item-photos").upload(path, blob, { contentType: "image/webp" });
          if (up.error) throw up.error;
          const ins = await supabase.from("item_photos").insert({ item_id: itemId, path, position: keptPhotos.length + i });
          if (ins.error) throw ins.error;
        } catch {
          failed++;
        }
      }
      newPhotos.forEach((p) => URL.revokeObjectURL(p.url));

      if (failed) {
        setError(`La pieza se ha guardado, pero ${failed} foto(s) no se han podido subir.`);
        router.push(`/coleccion/${itemId}`);
        return;
      }
      if (andAnother) {
        // Mantiene lo común (tipo, fabricante, escala, compañía, época, compra) para meter series rápido
        setForm((f) => ({ ...f, name: "", catalog_ref: "", road_number: "", dcc_address: "", notes: "", details: { ...f.details, ean: undefined } }));
        setNewPhotos([]);
        setKeptPhotos([]);
        setStep("identificacion");
        router.refresh();
        window.scrollTo({ top: 0 });
        return;
      }
      router.push(`/coleccion/${itemId}`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h1 className="font-display text-[34px] font-bold tracking-tight">{mode === "editar" ? "Editar pieza" : "Nueva pieza"}</h1>
        <span className="text-fg3">Solo son obligatorios tipo, fabricante y escala.</span>
      </div>

      <ol className="flex gap-1 overflow-x-auto pb-1" aria-label="Pasos">
        {steps.map((s, i) => {
          const done = i < idx;
          const current = s === step;
          return (
            <li key={s} className="flex flex-none items-center">
              <button
                onClick={() => (kind || s === "tipo" ? go(i) : undefined)}
                aria-current={current ? "step" : undefined}
                className={`flex h-10 items-center gap-2 rounded-full px-3 text-[15px] ${current ? "bg-amb2 font-semibold text-ambtx" : done ? "text-fg2 hover:bg-s2" : "text-fg3 hover:bg-s2"}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[12px] ${current ? "bg-amb text-[#1a1714]" : done ? "bg-grn text-[#12110f]" : "border border-ln2"}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {STEP_LABELS[s]}
              </button>
              {i < steps.length - 1 && <span className="mx-1 h-px w-5 bg-ln2" aria-hidden />}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 rounded-xl border border-ln bg-s1 p-5 sm:p-7">
          <p className="font-mono text-[13px] text-fg3">Paso {idx + 1} de {steps.length}</p>
          <h2 className="mt-1 font-display text-[28px] font-bold tracking-tight">{STEP_LABELS[step]}</h2>

          <div className="mt-5 flex flex-col gap-6">
            {step === "tipo" && (
              <>
                <p className="text-fg2">Las siguientes preguntas se adaptan a lo que elijas.</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {KINDS.map((k) => {
                    const Icon = KIND_ICONS[k.id];
                    const on = form.kind === k.id;
                    return (
                      <button
                        key={k.id}
                        onClick={() => setForm((f) => ({ ...f, kind: k.id, traction: k.id === "locomotora" || k.id === "automotor" ? f.traction : null, system: k.id === "locomotora" || k.id === "automotor" ? f.system : null }))}
                        aria-pressed={on}
                        className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${on ? "border-amb bg-amb2" : "border-ln2 bg-s3 hover:border-fg3"}`}
                      >
                        <Icon className={`h-7 w-7 ${on ? "text-ambtx" : "text-fg2"}`} strokeWidth={1.5} />
                        <span className="text-[18px] font-semibold">{k.label}</span>
                        <span className="text-[15px] text-fg3">{k.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === "traccion" && isTractor && (
              <>
                <p className="text-fg2">¿Cómo se mueve el tren real? Solo te preguntamos lo que tiene sentido para ese tipo.</p>
                <Choice
                  options={TRACTIONS.map((t) => ({ id: t.id, label: t.label }))}
                  value={form.traction ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, traction: v, details: { ...f.details, wheelArrangement: undefined } }))}
                  big
                />
                {form.traction && (
                  <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                    <div>
                      <Label htmlFor="wa" hint={form.traction === "vapor" ? "UIC · Whyte" : "UIC · AAR"}>Rodaje</Label>
                      <select id="wa" className={field} value={form.details.wheelArrangement ?? ""} onChange={(e) => setD("wheelArrangement", e.target.value || undefined)}>
                        <option value="">Sin indicar</option>
                        {WHEEL_ARRANGEMENTS[form.traction as Traction].map((w) => (
                          <option key={w.uic} value={w.uic}>{w.uic}{w.alt ? `  ·  ${w.alt}` : ""}</option>
                        ))}
                      </select>
                    </div>
                    {form.details.wheelArrangement && (
                      <div className="rounded-lg border border-ln bg-s3 p-3">
                        <p className="font-mono text-[12px] text-fg3">VISTA DEL RODAJE</p>
                        <WheelDiagram uic={form.details.wheelArrangement} />
                      </div>
                    )}
                  </div>
                )}
                {form.traction === "vapor" && (
                  <div className="flex flex-col gap-2">
                    <Toggle label="Con ténder" value={form.details.tender} onChange={(v) => setD("tender", v)} />
                    <Toggle label="Generador de humo" value={form.details.smokeGenerator} onChange={(v) => setD("smokeGenerator", v)} />
                  </div>
                )}
                {(form.traction === "diesel" || form.traction === "hibrida") && (
                  <div>
                    <Label>Transmisión</Label>
                    <Choice
                      options={[{ id: "electrica", label: "Eléctrica" }, { id: "hidraulica", label: "Hidráulica" }, { id: "mecanica", label: "Mecánica" }]}
                      value={form.details.transmission ?? ""}
                      onChange={(v) => setD("transmission", v as ItemDetails["transmission"])}
                    />
                  </div>
                )}
                {form.traction === "electrica" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="panto">Pantógrafos</Label>
                      <input id="panto" type="number" min={0} max={4} className={field} value={form.details.pantographs ?? ""} onChange={(e) => setD("pantographs", e.target.value ? Number(e.target.value) : undefined)} />
                    </div>
                    <div className="flex items-end">
                      <Toggle label="Toma de corriente por catenaria" value={form.details.catenaryPickup} onChange={(v) => setD("catenaryPickup", v)} />
                    </div>
                  </div>
                )}
                {kind === "automotor" && (
                  <div className="max-w-[200px]">
                    <Label htmlFor="units">Número de coches</Label>
                    <input id="units" type="number" min={1} max={20} className={field} value={form.details.units ?? ""} onChange={(e) => setD("units", e.target.value ? Number(e.target.value) : undefined)} />
                  </div>
                )}
              </>
            )}

            {step === "traccion" && isRolling && (
              <>
                <div>
                  <Label>Subtipo</Label>
                  <Choice
                    options={WAGON_SUBTYPES[kind as "coche" | "vagon"].map((w) => ({ id: w, label: w }))}
                    value={form.details.wagonSubtype ?? ""}
                    onChange={(v) => setD("wagonSubtype", v)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Toggle label="Iluminación interior" value={form.details.interiorLighting} onChange={(v) => setD("interiorLighting", v)} />
                  <Toggle label="Cinemática de enganche corto" value={form.details.closeCoupling} onChange={(v) => setD("closeCoupling", v)} />
                </div>
              </>
            )}

            {step === "sistema" && (
              <>
                <p className="text-fg2">¿Tu modelo lleva decoder? Si no lo sabes, elige Analógico y cámbialo más tarde.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { id: "digital", label: "Digital", hint: "Decoder, dirección, funciones, sonido", icon: Cpu },
                    { id: "analogico", label: "Analógico", hint: "Corriente continua o alterna, sin decoder", icon: Gauge },
                  ].map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setForm((f) => ({ ...f, system: o.id }))}
                      aria-pressed={form.system === o.id}
                      className={`flex items-center gap-4 rounded-xl border p-4 text-left ${form.system === o.id ? "border-amb bg-amb2" : "border-ln2 bg-s3 hover:border-fg3"}`}
                    >
                      <o.icon className={`h-8 w-8 ${form.system === o.id ? "text-ambtx" : "text-fg2"}`} strokeWidth={1.5} />
                      <span>
                        <span className="block text-[18px] font-semibold">{o.label}</span>
                        <span className="text-[15px] text-fg3">{o.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {form.system === "digital" && (
                  <>
                    <div>
                      <Label>Protocolo</Label>
                      <Choice options={PROTOCOLS.map((p) => ({ id: p, label: p }))} value={form.details.protocol ?? ""} onChange={(v) => setD("protocol", v)} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Decoder</Label>
                        <Choice options={[{ id: "fabrica", label: "De fábrica" }, { id: "instalado", label: "Instalado después" }]} value={form.details.decoderOrigin ?? ""} onChange={(v) => setD("decoderOrigin", v as "fabrica" | "instalado")} />
                      </div>
                      <div>
                        <Label htmlFor="decoder">Marca y modelo</Label>
                        <input id="decoder" list="decoders" className={field} value={form.details.decoder ?? ""} onChange={(e) => setD("decoder", e.target.value)} placeholder="ESU LokSound 5" />
                        <datalist id="decoders">{DECODER_BRANDS.map((d) => <option key={d} value={d} />)}</datalist>
                      </div>
                      <div>
                        <Label htmlFor="addr" hint="1 – 10239">Dirección digital</Label>
                        <input id="addr" inputMode="numeric" className={`${field} font-mono`} value={form.dcc_address} onChange={(e) => set("dcc_address", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="3" />
                      </div>
                      <div>
                        <Label htmlFor="fw">Firmware</Label>
                        <input id="fw" className={`${field} font-mono`} value={form.details.firmware ?? ""} onChange={(e) => setD("firmware", e.target.value)} placeholder="5.10.172" />
                      </div>
                    </div>
                    {conflict && (
                      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red/40 bg-red2 p-3 text-red">
                        <TriangleAlert className="h-5 w-5 flex-none" />
                        <span className="flex-1">La dirección {form.dcc_address} ya la usa {conflict.name}.</span>
                        <button onClick={() => set("dcc_address", String(freeAddress()))} className="rounded-lg border border-red/50 px-3 py-1.5 font-medium hover:bg-red2">
                          Usar {freeAddress()} (libre)
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 rounded-lg border border-ln bg-s3 p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Toggle label="Sonido" value={form.details.sound} onChange={(v) => setD("sound", v)} />
                        {form.details.sound && (
                          <input aria-label="Altavoz" className={`${field} h-10 max-w-[240px]`} value={form.details.speaker ?? ""} onChange={(e) => setD("speaker", e.target.value)} placeholder="Altavoz (p. ej. Sugar Cube)" />
                        )}
                      </div>
                      <Toggle label="RailCom" value={form.details.railcom} onChange={(v) => setD("railcom", v)} />
                    </div>
                    <FunctionsEditor value={form.details.functions ?? []} onChange={(v) => setD("functions", v)} />
                  </>
                )}

                {form.system === "analogico" && (
                  <>
                    <div>
                      <Label>Corriente</Label>
                      <Choice options={[{ id: "dc", label: "Continua · 2 carriles" }, { id: "ac", label: "Alterna · 3 carriles (Märklin)" }]} value={form.details.current ?? ""} onChange={(v) => setD("current", v as "dc" | "ac")} />
                    </div>
                    <div className="flex flex-col gap-3 rounded-lg border border-ln bg-s3 p-3">
                      <Toggle label="Preparada para digital" value={form.details.digitalReady} onChange={(v) => setD("digitalReady", v)} />
                      {form.details.digitalReady && (
                        <div>
                          <Label>Interfaz</Label>
                          <Choice options={INTERFACES.map((i) => ({ id: i, label: i }))} value={form.details.interface ?? ""} onChange={(v) => setD("interface", v)} mono />
                        </div>
                      )}
                      <Toggle label="Luces direccionales" value={form.details.directionalLights} onChange={(v) => setD("directionalLights", v)} />
                    </div>
                  </>
                )}
              </>
            )}

            {step === "identificacion" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="mf" hint="obligatorio">Fabricante</Label>
                  <input id="mf" list="mfs" className={field} value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="Roco" />
                  <datalist id="mfs">{MANUFACTURERS.map((m) => <option key={m} value={m} />)}</datalist>
                </div>
                <div>
                  <Label htmlFor="ref">Referencia de catálogo</Label>
                  <input id="ref" className={`${field} font-mono`} value={form.catalog_ref} onChange={(e) => set("catalog_ref", e.target.value)} placeholder="73845" />
                </div>
                <div className="sm:col-span-2">
                  <Label hint="obligatorio">Escala</Label>
                  <Choice options={SCALES.map((s) => ({ id: s.id, label: `${s.label} · ${s.ratio}` }))} value={form.scale} onChange={(v) => set("scale", v)} mono />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="name" hint="si lo dejas vacío lo creamos con la compañía y la matrícula">Nombre</Label>
                  <input id="name" className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="RENFE 333.014 «Talgo»" />
                </div>
                <div>
                  <Label htmlFor="rw">Compañía</Label>
                  <input id="rw" list="rws" className={field} value={form.railway} onChange={(e) => set("railway", e.target.value)} placeholder="RENFE" />
                  <datalist id="rws">{RAILWAYS.map((r) => <option key={r} value={r} />)}</datalist>
                </div>
                <div>
                  <Label htmlFor="road">Serie y número (matrícula)</Label>
                  <input id="road" className={`${field} font-mono`} value={form.road_number} onChange={(e) => set("road_number", e.target.value)} placeholder="333.014" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Época NEM</Label>
                  <Choice options={EPOCHS.map((e) => ({ id: e, label: e }))} value={form.epoch} onChange={(v) => set("epoch", v === form.epoch ? "" : v)} mono />
                </div>
                <div>
                  <Label htmlFor="livery">Librea / decoración</Label>
                  <input id="livery" className={field} value={form.details.livery ?? ""} onChange={(e) => setD("livery", e.target.value)} placeholder="Gris y amarillo Talgo" />
                </div>
                <div>
                  <Label htmlFor="coupler">Enganche</Label>
                  <select id="coupler" className={field} value={form.details.coupler ?? ""} onChange={(e) => setD("coupler", e.target.value || undefined)}>
                    <option value="">Sin indicar</option>
                    {COUPLERS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="year">Año del modelo</Label>
                  <input id="year" inputMode="numeric" className={field} value={form.details.modelYear ?? ""} onChange={(e) => setD("modelYear", e.target.value ? Number(e.target.value.replace(/\D/g, "").slice(0, 4)) : undefined)} placeholder="2019" />
                </div>
                <div>
                  <Label htmlFor="len" hint="entre topes">Longitud (mm)</Label>
                  <input id="len" inputMode="numeric" className={field} value={form.details.lengthMm ?? ""} onChange={(e) => setD("lengthMm", e.target.value ? Number(e.target.value.replace(/\D/g, "").slice(0, 5)) : undefined)} placeholder="241" />
                </div>
                <div>
                  <Label htmlFor="ean">Código EAN</Label>
                  <input id="ean" inputMode="numeric" className={`${field} font-mono`} value={form.details.ean ?? ""} onChange={(e) => setD("ean", e.target.value.replace(/\D/g, "").slice(0, 14))} />
                </div>
                <div>
                  <Label htmlFor="ltd" hint="p. ej. 123/500">Edición limitada</Label>
                  <input id="ltd" className={field} value={form.details.limitedEdition ?? ""} onChange={(e) => setD("limitedEdition", e.target.value)} />
                </div>
              </div>
            )}

            {step === "compra" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="price">Precio de compra (€)</Label>
                  <input id="price" inputMode="decimal" className={field} value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)} placeholder="289" />
                </div>
                <div>
                  <Label htmlFor="pdate">Fecha de compra</Label>
                  <input id="pdate" type="date" className={field} value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Origen</Label>
                  <Choice options={ORIGINS.map((o) => ({ id: o.id, label: o.label }))} value={form.details.origin ?? ""} onChange={(v) => setD("origin", v)} />
                </div>
                <div>
                  <Label htmlFor="seller">Tienda o vendedor</Label>
                  <input id="seller" className={field} value={form.details.seller ?? ""} onChange={(e) => setD("seller", e.target.value)} placeholder="Trenes Ibéricos" />
                </div>
                <div>
                  <Label htmlFor="value" hint="opcional">Valor estimado actual (€)</Label>
                  <input id="value" inputMode="decimal" className={field} value={form.estimated_value} onChange={(e) => set("estimated_value", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Estado de la pieza</Label>
                  <Choice options={CONDITIONS.map((c) => ({ id: c.id, label: c.label }))} value={form.condition} onChange={(v) => set("condition", v)} />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Toggle label="Caja original" value={form.details.hasBox} onChange={(v) => setD("hasBox", v)} />
                  <Toggle label="Instrucciones / documentación" value={form.details.hasInstructions} onChange={(v) => setD("hasInstructions", v)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>¿La tienes ya?</Label>
                  <Choice options={STATUSES.map((s) => ({ id: s.id, label: s.label }))} value={form.status} onChange={(v) => set("status", v)} />
                </div>
              </div>
            )}

            {step === "fotos" && (
              <>
                <div>
                  <Label>Fotos</Label>
                  <p className="mb-3 text-[15px] text-fg3">La primera es la portada. Se reducen automáticamente antes de subirlas.</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {keptPhotos.map((p, i) => (
                      <PhotoThumb key={p.id} url={p.url} first={i === 0} onRemove={() => setKeptPhotos((ps) => ps.filter((x) => x.id !== p.id))} />
                    ))}
                    {newPhotos.map((p, i) => (
                      <PhotoThumb key={p.url} url={p.url} first={keptPhotos.length === 0 && i === 0} onRemove={() => { URL.revokeObjectURL(p.url); setNewPhotos((ps) => ps.filter((x) => x.url !== p.url)); }} />
                    ))}
                    {keptPhotos.length + newPhotos.length < 8 && (
                      <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ln2 bg-s3 text-fg2 hover:border-amb hover:text-ambtx">
                        <ImagePlus className="h-7 w-7" strokeWidth={1.5} />
                        <span className="text-[15px]">Añadir fotos</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            const files = [...(e.target.files ?? [])].slice(0, 8 - keptPhotos.length - newPhotos.length);
                            setNewPhotos((ps) => [...ps, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="loc">Ubicación en casa</Label>
                    <input id="loc" className={field} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Salón › Vitrina 1 › Estante 2" />
                  </div>
                  <div>
                    <Label htmlFor="tags" hint="separadas por comas">Etiquetas</Label>
                    <input id="tags" className={field} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Talgo, Sonido, Favorita" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="notes">Notas</Label>
                    <textarea id="notes" rows={4} className={`${field} h-auto py-2.5`} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {step === "revision" && (
              <>
                <p className="text-fg2">Revisa que todo esté bien. Podrás editarla cuando quieras.</p>
                {!required && (
                  <p role="alert" className="rounded-lg border border-red/40 bg-red2 p-3 text-red">
                    Faltan datos obligatorios: {[!kind && "tipo", !form.manufacturer.trim() && "fabricante", !form.scale && "escala"].filter(Boolean).join(", ")}.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {mode === "crear" && (
                    <button onClick={() => save(true)} disabled={saving} className={btn.secondary}>
                      <Plus className="h-4 w-4" /> Guardar y añadir otra parecida
                    </button>
                  )}
                </div>
              </>
            )}

            {error && <p role="alert" className="rounded-lg border border-red/40 bg-red2 p-3 text-red">{error}</p>}
          </div>

          <div className="mt-8 flex items-center justify-between gap-2 border-t border-ln pt-5">
            <button onClick={() => go(idx - 1)} disabled={idx === 0} className={`${btn.ghost} disabled:invisible`}>
              <ChevronLeft className="h-4 w-4" /> Atrás
            </button>
            <div className="flex gap-2">
              {step !== "revision" && required && (
                <button onClick={() => save()} disabled={saving} className={btn.secondary}>
                  {saving ? "Guardando…" : "Guardar ya"}
                </button>
              )}
              {step === "revision" ? (
                <button onClick={() => save()} disabled={saving || !required} className={btn.primary}>
                  <Check className="h-[18px] w-[18px]" /> {saving ? "Guardando…" : mode === "editar" ? "Guardar cambios" : "Guardar pieza"}
                </button>
              ) : (
                <button onClick={() => go(idx + 1)} disabled={!canNext} className={btn.primary}>
                  Siguiente <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <Preview form={form} cover={keptPhotos[0]?.url ?? newPhotos[0]?.url} />
      </div>
    </div>
  );
}

function Preview({ form, cover }: { form: ItemPayload; cover?: string }) {
  const d = form.details;
  const rows: [string, string | undefined][] = [
    ["Tipo", [labelOf(KINDS, form.kind), form.traction ? labelOf(TRACTIONS, form.traction).toLowerCase() : d.wagonSubtype?.toLowerCase()].filter(Boolean).join(" ") || undefined],
    ["Rodaje", d.wheelArrangement],
    ["Sistema", form.system === "digital" ? [d.protocol ?? "Digital", d.sound ? "con sonido" : ""].filter(Boolean).join(" · ") : form.system === "analogico" ? `Analógico ${d.current === "ac" ? "AC" : d.current === "dc" ? "DC" : ""}`.trim() : undefined],
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
            <p className="font-mono text-[14px] text-fg3">{[form.manufacturer, form.catalog_ref].filter(Boolean).join(" · ") || "Fabricante · referencia"}</p>
            <dl className="mt-3 flex flex-col gap-1.5 text-[14px]">
              {rows.filter(([, v]) => v).map(([k, v]) => (
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

function Choice({ options, value, onChange, big, mono }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void; big?: boolean; mono?: boolean }) {
  return (
    <div className={big ? "grid grid-cols-2 gap-3 sm:grid-cols-4" : "flex flex-wrap gap-2"} role="radiogroup">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3.5 text-[15px] transition ${big ? "h-14 rounded-xl text-[17px] font-semibold" : "h-10"} ${mono ? "font-mono" : ""} ${
              on ? "border-amb bg-amb2 text-ambtx" : "border-ln2 bg-s3 text-fg2 hover:border-fg3 hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 flex-none rounded-full transition ${value ? "bg-amb" : "bg-ln2"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${value ? "left-6" : "left-1"}`} />
      </button>
      <span className="text-[16px]">{label}</span>
    </label>
  );
}

function FunctionsEditor({ value, onChange }: { value: { key: string; label: string }[]; onChange: (v: { key: string; label: string }[]) => void }) {
  const list = value;
  const update = (i: number, label: string) => onChange(list.map((f, j) => (j === i ? { ...f, label } : f)));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>Tabla de funciones</Label>
        {list.length === 0 && (
          <button type="button" onClick={() => onChange(DEFAULT_FUNCTIONS)} className="text-[15px] text-ambtx hover:underline">
            Rellenar las habituales
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {list.map((f, i) => (
          <div key={f.key} className="flex items-center gap-2">
            <span className="w-12 font-mono font-semibold text-ambtx">{f.key}</span>
            <input aria-label={`Función ${f.key}`} className={`${field} h-10`} value={f.label} onChange={(e) => update(i, e.target.value)} placeholder="Luces, bocina, humo…" />
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i).map((x, j) => ({ ...x, key: `F${j}` })))} aria-label={`Quitar ${f.key}`} className="rounded p-2 text-fg3 hover:text-red">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {list.length < 69 && (
          <button type="button" onClick={() => onChange([...list, { key: `F${list.length}`, label: "" }])} className={`${btn.ghost} self-start`}>
            <Plus className="h-4 w-4" /> Añadir función F{list.length}
          </button>
        )}
      </div>
    </div>
  );
}

function PhotoThumb({ url, first, onRemove }: { url: string; first: boolean; onRemove: () => void }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-ln">
      <PhotoBox src={url} alt="Foto de la pieza" />
      {first && <span className="absolute left-2 top-2"><Tag tone="amb">Portada</Tag></span>}
      <button onClick={onRemove} aria-label="Quitar foto" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg/80 text-fg hover:text-red">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function toPayload(i?: Partial<Item>): ItemPayload {
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
