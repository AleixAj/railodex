"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LayoutGrid, List, Search, Table2, X } from "lucide-react";
import { EPOCHS, KINDS, SCALES } from "@/lib/catalog";

const SELECT =
  "h-11 rounded-[10px] border border-ln2 bg-s1 px-3 pr-8 text-[15px] text-fg focus:border-amb focus:outline-none data-[on=true]:border-amb data-[on=true]:bg-amb2";

export function FilterBar({ manufacturers, railways }: { manufacturers: string[]; railways: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string) => {
    // Read the live URL: a delayed search mustn't undo a filter picked in the meantime.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // Search as you type, but wait until they stop for a moment so each letter isn't a request.
  const [text, setText] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const search = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => set("q", value.trim()), 300);
  };

  const view = params.get("vista") ?? "cuadricula";
  const active = ["q", "escala", "tipo", "sistema", "compania", "epoca", "fabricante"].some((k) => params.get(k));

  const select = (key: string, label: string, options: { value: string; label: string }[]) => (
    <select
      aria-label={label}
      value={params.get(key) ?? ""}
      data-on={Boolean(params.get(key))}
      onChange={(e) => set(key, e.target.value)}
      className={SELECT}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className={`flex flex-col gap-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative min-w-[220px] flex-1 sm:max-w-[300px]"
          onSubmit={(e) => {
            e.preventDefault();
            clearTimeout(timer.current);
            set("q", text.trim());
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg3" />
          <input
            name="q"
            type="search"
            value={text}
            onChange={(e) => search(e.target.value)}
            placeholder="Buscar en la colección"
            aria-label="Buscar en la colección"
            className="h-11 w-full rounded-[10px] border border-ln2 bg-s1 pl-10 pr-3 text-[15px] placeholder:text-fg3 focus:border-amb focus:outline-none"
          />
        </form>
        {select(
          "escala",
          "Escala",
          SCALES.map((s) => ({ value: s.id, label: `${s.label} · ${s.ratio}` })),
        )}
        {select(
          "tipo",
          "Tipo",
          KINDS.map((k) => ({ value: k.id, label: k.label })),
        )}
        {select(
          "compania",
          "Compañía",
          railways.map((r) => ({ value: r, label: r })),
        )}
        {select(
          "epoca",
          "Época",
          EPOCHS.map((e) => ({ value: e, label: `Época ${e}` })),
        )}
        {select("sistema", "Sistema", [
          { value: "digital", label: "Digital" },
          { value: "analogico", label: "Analógico" },
        ])}
        {select(
          "fabricante",
          "Fabricante",
          manufacturers.map((m) => ({ value: m, label: m })),
        )}
        {active && (
          <button
            onClick={() => {
              setText("");
              clearTimeout(timer.current);
              startTransition(() => router.replace(`${pathname}${view !== "cuadricula" ? `?vista=${view}` : ""}`));
            }}
            className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-3 text-[15px] text-ambtx hover:bg-s2"
          >
            <X className="h-4 w-4" /> Quitar filtros
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <select
            aria-label="Ordenar"
            value={params.get("orden") ?? "recientes"}
            onChange={(e) => set("orden", e.target.value === "recientes" ? "" : e.target.value)}
            className={SELECT}
          >
            <option value="recientes">Fecha de alta</option>
            <option value="nombre">Nombre</option>
            <option value="valor">Valor</option>
            <option value="referencia">Referencia</option>
            <option value="compra">Fecha de compra</option>
          </select>
          <div className="flex rounded-[10px] border border-ln2 bg-s1 p-0.5" role="group" aria-label="Vista">
            {[
              { id: "cuadricula", icon: LayoutGrid, label: "Cuadrícula" },
              { id: "lista", icon: List, label: "Lista" },
              { id: "tabla", icon: Table2, label: "Tabla" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => set("vista", v.id === "cuadricula" ? "" : v.id)}
                aria-pressed={view === v.id}
                title={v.label}
                className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${view === v.id ? "bg-s2 text-ambtx" : "text-fg3 hover:text-fg"}`}
              >
                <v.icon className="h-[18px] w-[18px]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
