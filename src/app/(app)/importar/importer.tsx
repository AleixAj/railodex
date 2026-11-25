"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheck, FileUp, TriangleAlert } from "lucide-react";
import { BOM, COLUMNS, mapHeaders, parseCsv } from "@/lib/csv";
import { toItemRow, type ImportRow } from "@/lib/import-row";
import { btn, Card } from "@/components/ui";
import { importItems, type ImportResult } from "./actions";

type Preview = { rows: ImportRow[]; matched: string[]; ignored: string[] };

export function Importer({ existing }: { existing: string[] }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();

  // "roco|73845" style keys of what the user already has, to flag likely duplicates.
  const owned = new Set(existing);

  async function readFile(file: File) {
    setResult(null);
    setFileError("");
    const table = parseCsv(await file.text());
    if (table.length < 2) {
      setFileError("El archivo está vacío o solo tiene la cabecera.");
      setPreview(null);
      return;
    }
    const [headers, ...body] = table;
    const keys = mapHeaders(headers);
    if (!keys.includes("manufacturer") || !keys.includes("scale")) {
      setFileError("No encuentro las columnas «Fabricante» y «Escala». Descarga la plantilla para ver el formato.");
      setPreview(null);
      return;
    }
    const rows = body.map((cells) => {
      const row: ImportRow = {};
      keys.forEach((k, i) => {
        if (k) row[k] = cells[i] ?? "";
      });
      return row;
    });
    setPreview({
      rows,
      matched: headers.filter((_, i) => keys[i]),
      ignored: headers.filter((h, i) => !keys[i] && h.trim()),
    });
  }

  const checked = preview?.rows.map((r) => {
    const item = toItemRow(r);
    const dupe = item && owned.has(`${item.manufacturer.toLowerCase()}|${(item.catalog_ref ?? "").toLowerCase()}`);
    return { raw: r, item, dupe: Boolean(dupe && item?.catalog_ref) };
  });
  const okCount = checked?.filter((c) => c.item).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className={`${btn.primary} cursor-pointer`}>
          <FileUp className="h-[18px] w-[18px]" /> Elegir archivo CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              e.target.value = "";
            }}
          />
        </label>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(BOM + COLUMNS.map((c) => c.header).join(";"))}`}
          download="plantilla-railodex.csv"
          className={btn.ghost}
        >
          Descargar plantilla
        </a>
      </div>
      <p className="text-[15px] text-fg3">
        Desde Excel: Archivo → Guardar como → CSV. Obligatorias: Fabricante y Escala. Admite fechas como 18/11/2025 y
        precios como 289,50.
      </p>

      {fileError && (
        <p role="alert" className="rounded-lg border border-red/40 bg-red2 p-3 text-red">
          {fileError}
        </p>
      )}

      {result?.imported !== undefined && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-grn/40 bg-grn2 p-3 text-grn">
          <CircleCheck className="h-5 w-5" />
          {result.imported} {result.imported === 1 ? "pieza importada" : "piezas importadas"}
          {result.skipped ? `, ${result.skipped} sin importar (faltaban datos o se llegó al límite)` : ""}.
          <Link href="/coleccion" className="ml-auto underline">
            Ver colección
          </Link>
        </p>
      )}
      {result?.error && (
        <p role="alert" className="rounded-lg border border-red/40 bg-red2 p-3 text-red">
          {result.error}
        </p>
      )}

      {preview && checked && !result?.imported && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-ln p-4">
            <p className="mr-auto text-[15px]">
              <strong>{okCount}</strong> de {checked.length} filas listas.
              {preview.ignored.length > 0 && (
                <span className="text-fg3"> Columnas que no se usan: {preview.ignored.join(", ")}.</span>
              )}
            </p>
            <button onClick={() => setPreview(null)} className={btn.ghost}>
              Cancelar
            </button>
            <button
              onClick={() => start(async () => setResult(await importItems(preview.rows)))}
              disabled={pending || okCount === 0}
              className={btn.primary}
            >
              {pending ? "Importando…" : `Importar ${okCount}`}
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-[14px]">
              <thead className="sticky top-0 bg-s1">
                <tr className="text-left font-mono text-[12px] uppercase tracking-[0.06em] text-fg3">
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Fabricante · ref.</th>
                  <th className="px-3 py-2">Escala</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ln">
                {checked.slice(0, 200).map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-fg3">{i + 2}</td>
                    <td className="px-3 py-2">{c.item?.name ?? c.raw.name ?? "—"}</td>
                    <td className="px-3 py-2 font-mono">
                      {[c.raw.manufacturer, c.raw.catalog_ref].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-3 py-2 font-mono">{c.raw.scale || "—"}</td>
                    <td className="px-3 py-2">
                      {!c.item ? (
                        <span className="flex items-center gap-1.5 text-red">
                          <TriangleAlert className="h-4 w-4" /> Falta fabricante o escala
                        </span>
                      ) : c.dupe ? (
                        <span className="flex items-center gap-1.5 text-ambtx">
                          <TriangleAlert className="h-4 w-4" /> Puede que ya la tengas
                        </span>
                      ) : (
                        <span className="text-grn">Lista</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {checked.length > 200 && <p className="p-3 text-[14px] text-fg3">Y {checked.length - 200} filas más…</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
