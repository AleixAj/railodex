"use client";

// Small form controls used across the wizard steps.

import { Plus, X } from "lucide-react";
import { DEFAULT_FUNCTIONS } from "@/lib/catalog";
import { PhotoBox, Tag, btn, field, Label } from "@/components/ui";

export function Choice({
  options,
  value,
  onChange,
  big,
  mono,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  big?: boolean;
  mono?: boolean;
}) {
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
            className={`press rounded-full border px-3.5 text-[15px] ${big ? "h-14 rounded-xl text-[17px] font-semibold" : "h-10"} ${mono ? "font-mono" : ""} ${
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

export function Toggle({ label, value, onChange }: { label: string; value?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 flex-none rounded-full transition-colors duration-200 ${value ? "bg-amb" : "bg-ln2"}`}
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-out)] ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
      <span className="text-[16px]">{label}</span>
    </label>
  );
}

export function FunctionsEditor({
  value,
  onChange,
}: {
  value: { key: string; label: string }[];
  onChange: (v: { key: string; label: string }[]) => void;
}) {
  const list = value;
  const update = (i: number, label: string) => onChange(list.map((f, j) => (j === i ? { ...f, label } : f)));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>Tabla de funciones</Label>
        {list.length === 0 && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FUNCTIONS)}
            className="text-[15px] text-ambtx hover:underline"
          >
            Rellenar las habituales
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {list.map((f, i) => (
          <div key={f.key} className="flex items-center gap-2">
            <span className="w-12 font-mono font-semibold text-ambtx">{f.key}</span>
            <input
              aria-label={`Función ${f.key}`}
              className={`${field} h-10`}
              value={f.label}
              onChange={(e) => update(i, e.target.value)}
              placeholder="Luces, bocina, humo…"
            />
            <button
              type="button"
              onClick={() => onChange(list.filter((_, j) => j !== i).map((x, j) => ({ ...x, key: `F${j}` })))}
              aria-label={`Quitar ${f.key}`}
              className="rounded p-2 text-fg3 hover:text-red"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {list.length < 69 && (
          <button
            type="button"
            onClick={() => onChange([...list, { key: `F${list.length}`, label: "" }])}
            className={`${btn.ghost} self-start`}
          >
            <Plus className="h-4 w-4" /> Añadir función F{list.length}
          </button>
        )}
      </div>
    </div>
  );
}

export function PhotoThumb({ url, first, onRemove }: { url: string; first: boolean; onRemove: () => void }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-ln">
      <PhotoBox src={url} alt="Foto de la pieza" />
      {first && (
        <span className="absolute left-2 top-2">
          <Tag tone="amb">Portada</Tag>
        </span>
      )}
      <button
        onClick={onRemove}
        aria-label="Quitar foto"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg/80 text-fg hover:text-red"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
