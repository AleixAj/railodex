import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";
import { Card, ScaleBadge, Tag } from "@/components/ui";

export const metadata: Metadata = { title: "Digital" };

export default async function DigitalPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("items")
    .select("id, name, kind, scale, manufacturer, catalog_ref, system, dcc_address, status, details")
    .in("kind", ["locomotora", "automotor"])
    .neq("status", "vendida")
    .order("dcc_address", { ascending: true, nullsFirst: false });
  const tractors = (data ?? []) as Item[];

  const digital = tractors.filter((t) => t.system === "digital");
  const ready = tractors.filter((t) => t.system === "analogico" && t.details?.digitalReady);
  const noAddress = digital.filter((t) => t.dcc_address === null);

  const count = new Map<number, number>();
  digital.forEach((t) => t.dcc_address !== null && count.set(t.dcc_address, (count.get(t.dcc_address) ?? 0) + 1));
  const duplicated = new Set([...count.entries()].filter(([, n]) => n > 1).map(([a]) => a));

  const decoders = new Map<string, number>();
  digital.forEach((t) => {
    const d = t.details?.decoder?.trim() || "Sin indicar";
    decoders.set(d, (decoders.get(d) ?? 0) + 1);
  });

  const th = "whitespace-nowrap px-3 py-2.5 text-left font-mono text-[12px] font-normal uppercase tracking-[0.06em] text-fg3";
  const td = "whitespace-nowrap px-3 py-2.5";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Digital</h1>
        <p className="mt-1 text-fg2">Direcciones y decoders de tus locomotoras, para no repetir dirección al programarlas.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Mini label="Digitales" value={String(digital.length)} />
        <Mini label="Direcciones repetidas" value={String(duplicated.size)} alert={duplicated.size > 0} />
        <Mini label="Digitales sin dirección" value={String(noAddress.length)} />
        <Mini label="Analógicas preparadas" value={String(ready.length)} />
      </div>

      {duplicated.size > 0 && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red/40 bg-red2 p-3 text-red">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-none" />
          Direcciones usadas por más de una locomotora: {[...duplicated].join(", ")}. Si van a circular a la vez, cámbiale la dirección a una.
        </p>
      )}

      {digital.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Cpu className="h-10 w-10 text-ln2" strokeWidth={1.25} />
          <p className="text-fg2">Ninguna locomotora marcada como digital todavía.</p>
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[2fr_1fr]">
          <Card className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="border-b border-ln">
                <tr>
                  <th className={th}>Dirección</th>
                  <th className={th}>Locomotora</th>
                  <th className={th}>Esc.</th>
                  <th className={th}>Protocolo</th>
                  <th className={th}>Decoder</th>
                  <th className={th}>Sonido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ln">
                {digital.map((t) => {
                  const dup = t.dcc_address !== null && duplicated.has(t.dcc_address);
                  return (
                    <tr key={t.id} className={dup ? "bg-red2" : "hover:bg-s2/50"}>
                      <td className={`${td} font-mono text-[17px] ${dup ? "text-red" : "text-ambtx"}`}>{t.dcc_address ?? "—"}</td>
                      <td className={td}>
                        <Link href={`/coleccion/${t.id}`} className="font-semibold hover:text-ambtx">{t.name}</Link>
                        <span className="block font-mono text-[13px] text-fg3">{[t.manufacturer, t.catalog_ref].filter(Boolean).join(" ")}</span>
                      </td>
                      <td className={td}><ScaleBadge scale={t.scale} /></td>
                      <td className={td}>{t.details?.protocol ? <Tag>{t.details.protocol}</Tag> : "—"}</td>
                      <td className={`${td} text-fg2`}>{t.details?.decoder ?? "—"}</td>
                      <td className={td}>{t.details?.sound ? "Sí" : "No"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="flex flex-col gap-3">
            <Card className="p-5">
              <h2 className="text-[17px] font-semibold">Decoders instalados</h2>
              <ul className="mt-3 flex flex-col gap-2 text-[15px]">
                {[...decoders.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => (
                  <li key={d} className="flex justify-between gap-3"><span>{d}</span><span className="font-mono">{n}</span></li>
                ))}
              </ul>
            </Card>
            {ready.length > 0 && (
              <Card className="p-5">
                <h2 className="text-[17px] font-semibold">Listas para digitalizar</h2>
                <ul className="mt-3 flex flex-col gap-2 text-[15px]">
                  {ready.map((t) => (
                    <li key={t.id} className="flex justify-between gap-3">
                      <Link href={`/coleccion/${t.id}`} className="truncate hover:text-ambtx">{t.name}</Link>
                      <span className="flex-none font-mono text-[13px] text-fg3">{t.details?.interface ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-[15px] text-fg2">{label}</p>
      <p className={`mt-1 font-display text-[24px] font-bold ${alert ? "text-red" : ""}`}>{value}</p>
    </Card>
  );
}
