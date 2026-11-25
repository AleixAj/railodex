"use client";

// One component per wizard step. Each gets the form plus the setters it needs.

import type { Dispatch, SetStateAction } from "react";
import { Cpu, Gauge, ImagePlus, TriangleAlert } from "lucide-react";
import {
  CONDITIONS,
  COUPLERS,
  DECODER_BRANDS,
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
  type Traction,
} from "@/lib/catalog";
import type { ItemDetails } from "@/lib/types";
import { KIND_ICONS, field, Label } from "@/components/ui";
import { WheelDiagram } from "@/components/wheel-diagram";
import type { ItemPayload } from "@/app/(app)/anadir/actions";
import { Choice, FunctionsEditor, PhotoThumb, Toggle } from "./fields";

export type StepProps = {
  form: ItemPayload;
  setForm: Dispatch<SetStateAction<ItemPayload>>;
  set: <K extends keyof ItemPayload>(key: K, value: ItemPayload[K]) => void;
  setD: <K extends keyof ItemDetails>(key: K, value: ItemDetails[K]) => void;
};

export const isTractor = (kind: string) => kind === "locomotora" || kind === "automotor";

// Coaches and wagons have no traction or decoder, so those get cleared when switching to them.
export function StepKind({ form, setForm }: StepProps) {
  return (
    <>
      <p className="text-fg2">Las siguientes preguntas se adaptan a lo que elijas.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {KINDS.map((k) => {
          const Icon = KIND_ICONS[k.id];
          const on = form.kind === k.id;
          return (
            <button
              key={k.id}
              onClick={() =>
                setForm((f) =>
                  isTractor(k.id) ? { ...f, kind: k.id } : { ...f, kind: k.id, traction: null, system: null },
                )
              }
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
  );
}

export function StepTraction({ form, setForm, setD }: StepProps) {
  const kind = form.kind;
  return (
    <>
      <p className="text-fg2">¿Cómo se mueve el tren real? Solo te preguntamos lo que tiene sentido para ese tipo.</p>
      <Choice
        options={TRACTIONS.map((t) => ({ id: t.id, label: t.label }))}
        value={form.traction ?? ""}
        onChange={(v) =>
          setForm((f) => ({ ...f, traction: v, details: { ...f.details, wheelArrangement: undefined } }))
        }
        big
      />
      {form.traction && (
        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="wa" hint={form.traction === "vapor" ? "UIC · Whyte" : "UIC · AAR"}>
              Rodaje
            </Label>
            <select
              id="wa"
              className={field}
              value={form.details.wheelArrangement ?? ""}
              onChange={(e) => setD("wheelArrangement", e.target.value || undefined)}
            >
              <option value="">Sin indicar</option>
              {WHEEL_ARRANGEMENTS[form.traction as Traction].map((w) => (
                <option key={w.uic} value={w.uic}>
                  {w.uic}
                  {w.alt && w.alt !== w.uic ? `  ·  ${w.alt}` : ""}
                </option>
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
          <Toggle
            label="Generador de humo"
            value={form.details.smokeGenerator}
            onChange={(v) => setD("smokeGenerator", v)}
          />
        </div>
      )}
      {(form.traction === "diesel" || form.traction === "hibrida") && (
        <div>
          <Label>Transmisión</Label>
          <Choice
            options={[
              { id: "electrica", label: "Eléctrica" },
              { id: "hidraulica", label: "Hidráulica" },
              { id: "mecanica", label: "Mecánica" },
            ]}
            value={form.details.transmission ?? ""}
            onChange={(v) => setD("transmission", v as ItemDetails["transmission"])}
          />
        </div>
      )}
      {form.traction === "electrica" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="panto">Pantógrafos</Label>
            <input
              id="panto"
              type="number"
              min={0}
              max={4}
              className={field}
              value={form.details.pantographs ?? ""}
              onChange={(e) => setD("pantographs", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="flex items-end">
            <Toggle
              label="Toma de corriente por catenaria"
              value={form.details.catenaryPickup}
              onChange={(v) => setD("catenaryPickup", v)}
            />
          </div>
        </div>
      )}
      {kind === "automotor" && (
        <div className="max-w-[200px]">
          <Label htmlFor="units">Número de coches</Label>
          <input
            id="units"
            type="number"
            min={1}
            max={20}
            className={field}
            value={form.details.units ?? ""}
            onChange={(e) => setD("units", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      )}
    </>
  );
}

export function StepRolling({ form, setD }: StepProps) {
  const kind = form.kind;
  return (
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
        <Toggle
          label="Iluminación interior"
          value={form.details.interiorLighting}
          onChange={(v) => setD("interiorLighting", v)}
        />
        <Toggle
          label="Cinemática de enganche corto"
          value={form.details.closeCoupling}
          onChange={(v) => setD("closeCoupling", v)}
        />
      </div>
    </>
  );
}

type Address = { id: string; name: string; address: number };

export function StepSystem({
  form,
  setForm,
  set,
  setD,
  addresses,
  itemId,
}: StepProps & { addresses: Address[]; itemId?: string }) {
  // Another piece already using this DCC address?
  const conflict =
    form.system === "digital" && form.dcc_address
      ? addresses.find((a) => a.address === Number(form.dcc_address) && a.id !== itemId)
      : undefined;
  const freeAddress = () => {
    const used = new Set(addresses.map((a) => a.address));
    let n = Number(form.dcc_address) || 3;
    while (used.has(n) && n < 10239) n++;
    return n;
  };

  return (
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
            <Choice
              options={PROTOCOLS.map((p) => ({ id: p, label: p }))}
              value={form.details.protocol ?? ""}
              onChange={(v) => setD("protocol", v)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Decoder</Label>
              <Choice
                options={[
                  { id: "fabrica", label: "De fábrica" },
                  { id: "instalado", label: "Instalado después" },
                ]}
                value={form.details.decoderOrigin ?? ""}
                onChange={(v) => setD("decoderOrigin", v as "fabrica" | "instalado")}
              />
            </div>
            <div>
              <Label htmlFor="decoder">Marca y modelo</Label>
              <input
                id="decoder"
                list="decoders"
                className={field}
                value={form.details.decoder ?? ""}
                onChange={(e) => setD("decoder", e.target.value)}
                placeholder="p. ej. ESU LokSound 5"
              />
              <datalist id="decoders">
                {DECODER_BRANDS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="addr" hint="1 – 10239">
                Dirección digital
              </Label>
              <input
                id="addr"
                inputMode="numeric"
                className={`${field} font-mono`}
                value={form.dcc_address}
                onChange={(e) => set("dcc_address", e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="p. ej. 3"
              />
            </div>
            <div>
              <Label htmlFor="fw">Firmware</Label>
              <input
                id="fw"
                className={`${field} font-mono`}
                value={form.details.firmware ?? ""}
                onChange={(e) => setD("firmware", e.target.value)}
                placeholder="p. ej. 5.10.172"
              />
            </div>
          </div>
          {conflict && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-lg border border-red/40 bg-red2 p-3 text-red"
            >
              <TriangleAlert className="h-5 w-5 flex-none" />
              <span className="flex-1">
                La dirección {form.dcc_address} ya la usa {conflict.name}.
              </span>
              <button
                onClick={() => set("dcc_address", String(freeAddress()))}
                className="rounded-lg border border-red/50 px-3 py-1.5 font-medium hover:bg-red2"
              >
                Usar {freeAddress()} (libre)
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2 rounded-lg border border-ln bg-s3 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Toggle label="Sonido" value={form.details.sound} onChange={(v) => setD("sound", v)} />
              {form.details.sound && (
                <input
                  aria-label="Altavoz"
                  className={`${field} h-10 max-w-[240px]`}
                  value={form.details.speaker ?? ""}
                  onChange={(e) => setD("speaker", e.target.value)}
                  placeholder="Altavoz, p. ej. Sugar Cube"
                />
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
            <Choice
              options={[
                { id: "dc", label: "Continua · 2 carriles" },
                { id: "ac", label: "Alterna · 3 carriles (Märklin)" },
              ]}
              value={form.details.current ?? ""}
              onChange={(v) => setD("current", v as "dc" | "ac")}
            />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-ln bg-s3 p-3">
            <Toggle
              label="Preparada para digital"
              value={form.details.digitalReady}
              onChange={(v) => setD("digitalReady", v)}
            />
            {form.details.digitalReady && (
              <div>
                <Label>Interfaz</Label>
                <Choice
                  options={INTERFACES.map((i) => ({ id: i, label: i }))}
                  value={form.details.interface ?? ""}
                  onChange={(v) => setD("interface", v)}
                  mono
                />
              </div>
            )}
            <Toggle
              label="Luces direccionales"
              value={form.details.directionalLights}
              onChange={(v) => setD("directionalLights", v)}
            />
          </div>
        </>
      )}
    </>
  );
}

export function StepIdentity({ form, set, setD }: StepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="mf" hint="obligatorio">
          Fabricante
        </Label>
        <input
          id="mf"
          list="mfs"
          className={field}
          value={form.manufacturer}
          onChange={(e) => set("manufacturer", e.target.value)}
          placeholder="p. ej. Roco"
        />
        <datalist id="mfs">
          {MANUFACTURERS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
      <div>
        <Label htmlFor="ref">Referencia de catálogo</Label>
        <input
          id="ref"
          className={`${field} font-mono`}
          value={form.catalog_ref}
          onChange={(e) => set("catalog_ref", e.target.value)}
          placeholder="p. ej. 73845"
        />
      </div>
      <div className="sm:col-span-2">
        <Label hint="obligatorio">Escala</Label>
        <Choice
          options={SCALES.map((s) => ({ id: s.id, label: `${s.label} · ${s.ratio}` }))}
          value={form.scale}
          onChange={(v) => set("scale", v)}
          mono
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="name" hint="si lo dejas vacío lo creamos con la compañía y la matrícula">
          Nombre
        </Label>
        <input
          id="name"
          className={field}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="p. ej. RENFE 333.014 «Talgo»"
        />
      </div>
      <div>
        <Label htmlFor="rw">Compañía</Label>
        <input
          id="rw"
          list="rws"
          className={field}
          value={form.railway}
          onChange={(e) => set("railway", e.target.value)}
          placeholder="p. ej. RENFE"
        />
        <datalist id="rws">
          {RAILWAYS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>
      <div>
        <Label htmlFor="road">Serie y número (matrícula)</Label>
        <input
          id="road"
          className={`${field} font-mono`}
          value={form.road_number}
          onChange={(e) => set("road_number", e.target.value)}
          placeholder="p. ej. 333.014"
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Época NEM</Label>
        <Choice
          options={EPOCHS.map((e) => ({ id: e, label: e }))}
          value={form.epoch}
          onChange={(v) => set("epoch", v === form.epoch ? "" : v)}
          mono
        />
      </div>
      <div>
        <Label htmlFor="livery">Librea / decoración</Label>
        <input
          id="livery"
          className={field}
          value={form.details.livery ?? ""}
          onChange={(e) => setD("livery", e.target.value)}
          placeholder="p. ej. Gris y amarillo Talgo"
        />
      </div>
      <div>
        <Label htmlFor="coupler">Enganche</Label>
        <select
          id="coupler"
          className={field}
          value={form.details.coupler ?? ""}
          onChange={(e) => setD("coupler", e.target.value || undefined)}
        >
          <option value="">Sin indicar</option>
          {COUPLERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="year">Año del modelo</Label>
        <input
          id="year"
          inputMode="numeric"
          className={field}
          value={form.details.modelYear ?? ""}
          onChange={(e) =>
            setD("modelYear", e.target.value ? Number(e.target.value.replace(/\D/g, "").slice(0, 4)) : undefined)
          }
          placeholder="p. ej. 2019"
        />
      </div>
      <div>
        <Label htmlFor="len" hint="entre topes">
          Longitud (mm)
        </Label>
        <input
          id="len"
          inputMode="numeric"
          className={field}
          value={form.details.lengthMm ?? ""}
          onChange={(e) =>
            setD("lengthMm", e.target.value ? Number(e.target.value.replace(/\D/g, "").slice(0, 5)) : undefined)
          }
          placeholder="p. ej. 241"
        />
      </div>
      <div>
        <Label htmlFor="ean">Código EAN</Label>
        <input
          id="ean"
          inputMode="numeric"
          className={`${field} font-mono`}
          value={form.details.ean ?? ""}
          onChange={(e) => setD("ean", e.target.value.replace(/\D/g, "").slice(0, 14))}
        />
      </div>
      <div>
        <Label htmlFor="ltd" hint="p. ej. 123/500">
          Edición limitada
        </Label>
        <input
          id="ltd"
          className={field}
          value={form.details.limitedEdition ?? ""}
          onChange={(e) => setD("limitedEdition", e.target.value)}
        />
      </div>
    </div>
  );
}

export function StepPurchase({ form, set, setD }: StepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="price">Precio de compra (€)</Label>
        <input
          id="price"
          inputMode="decimal"
          className={field}
          value={form.purchase_price}
          onChange={(e) => set("purchase_price", e.target.value)}
          placeholder="p. ej. 289"
        />
      </div>
      <div>
        <Label htmlFor="pdate">Fecha de compra</Label>
        <input
          id="pdate"
          type="date"
          className={field}
          value={form.purchase_date}
          onChange={(e) => set("purchase_date", e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Origen</Label>
        <Choice
          options={ORIGINS.map((o) => ({ id: o.id, label: o.label }))}
          value={form.details.origin ?? ""}
          onChange={(v) => setD("origin", v)}
        />
      </div>
      <div>
        <Label htmlFor="seller">Tienda o vendedor</Label>
        <input
          id="seller"
          className={field}
          value={form.details.seller ?? ""}
          onChange={(e) => setD("seller", e.target.value)}
          placeholder="p. ej. Trenes Ibéricos"
        />
      </div>
      <div>
        <Label htmlFor="value" hint="opcional">
          Valor estimado actual (€)
        </Label>
        <input
          id="value"
          inputMode="decimal"
          className={field}
          value={form.estimated_value}
          onChange={(e) => set("estimated_value", e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Estado de la pieza</Label>
        <Choice
          options={CONDITIONS.map((c) => ({ id: c.id, label: c.label }))}
          value={form.condition}
          onChange={(v) => set("condition", v)}
        />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Toggle label="Caja original" value={form.details.hasBox} onChange={(v) => setD("hasBox", v)} />
        <Toggle
          label="Instrucciones / documentación"
          value={form.details.hasInstructions}
          onChange={(v) => setD("hasInstructions", v)}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>¿La tienes ya?</Label>
        <Choice
          options={STATUSES.map((s) => ({ id: s.id, label: s.label }))}
          value={form.status}
          onChange={(v) => set("status", v)}
        />
      </div>
    </div>
  );
}

export type PhotoState = {
  keptPhotos: { id: string; path: string; url: string }[];
  setKeptPhotos: Dispatch<SetStateAction<{ id: string; path: string; url: string }[]>>;
  newPhotos: { file: File; url: string }[];
  setNewPhotos: Dispatch<SetStateAction<{ file: File; url: string }[]>>;
};

export function StepPhotos({ form, set, keptPhotos, setKeptPhotos, newPhotos, setNewPhotos }: StepProps & PhotoState) {
  return (
    <>
      <div>
        <Label>Fotos</Label>
        <p className="mb-3 text-[15px] text-fg3">
          La primera es la portada. Se reducen automáticamente antes de subirlas.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {keptPhotos.map((p, i) => (
            <PhotoThumb
              key={p.id}
              url={p.url}
              first={i === 0}
              onRemove={() => setKeptPhotos((ps) => ps.filter((x) => x.id !== p.id))}
            />
          ))}
          {newPhotos.map((p, i) => (
            <PhotoThumb
              key={p.url}
              url={p.url}
              first={keptPhotos.length === 0 && i === 0}
              onRemove={() => {
                URL.revokeObjectURL(p.url);
                setNewPhotos((ps) => ps.filter((x) => x.url !== p.url));
              }}
            />
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
          <input
            id="loc"
            className={field}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="p. ej. Salón › Vitrina 1 › Estante 2"
          />
        </div>
        <div>
          <Label htmlFor="tags" hint="separadas por comas">
            Etiquetas
          </Label>
          <input
            id="tags"
            className={field}
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="p. ej. Talgo, Sonido, Favorita"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <textarea
            id="notes"
            rows={4}
            className={`${field} h-auto py-2.5`}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
