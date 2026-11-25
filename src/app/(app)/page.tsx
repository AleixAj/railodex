import Link from "next/link";
import { FileUp, Library, Plus, ScanBarcode } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { coverUrls } from "@/lib/items";
import { EPOCHS, KINDS, scaleInfo, labelOf, EVENT_KINDS } from "@/lib/catalog";
import { completeness, longToday, money, shortDate } from "@/lib/format";
import type { Item, ItemEvent } from "@/lib/types";
import { Card, EmptyState, PhotoBox, ScaleBadge, SectionTitle } from "@/components/ui";

export default async function InicioPage() {
  const { supabase, name } = await requireUser();

  const [{ data: itemsData }, { data: eventsData }] = await Promise.all([
    supabase
      .from("items")
      .select("id, kind, name, manufacturer, catalog_ref, scale, epoch, railway, road_number, system, dcc_address, condition, status, purchase_price, purchase_date, estimated_value, location, details, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("item_events")
      .select("id, item_id, happened_on, kind, title, cost, items(name)")
      .order("happened_on", { ascending: false })
      .limit(4),
  ]);

  const items = (itemsData ?? []) as Item[];
  const owned = items.filter((i) => i.status !== "vendida");
  const events = (eventsData ?? []) as unknown as (ItemEvent & { items: { name: string } | null })[];
  const latest = owned.slice(0, 5);
  const covers = await coverUrls(supabase, latest.map((i) => i.id));

  const invested = owned.reduce((s, i) => s + Number(i.purchase_price ?? 0), 0);
  const value = owned.reduce((s, i) => s + Number(i.estimated_value ?? i.purchase_price ?? 0), 0);
  const avgComplete = owned.length ? Math.round(owned.reduce((s, i) => s + completeness(i), 0) / owned.length) : 0;

  const addresses = owned.filter((i) => i.dcc_address !== null);
  const byAddress = new Map<number, number>();
  addresses.forEach((i) => byAddress.set(i.dcc_address!, (byAddress.get(i.dcc_address!) ?? 0) + 1));
  const duplicated = [...byAddress.entries()].filter(([, n]) => n > 1).map(([a]) => a);

  const countBy = (key: (i: Item) => string | null) => {
    const m = new Map<string, number>();
    owned.forEach((i) => {
      const k = key(i);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    });
    return m;
  };
  const byScale = [...countBy((i) => i.scale).entries()].sort((a, b) => b[1] - a[1]);
  const byKind = countBy((i) => i.kind);
  const byEpoch = countBy((i) => i.epoch);
  const digital = owned.filter((i) => i.system === "digital").length;
  const preorders = items.filter((i) => i.status === "preventa");
  const firstName = name.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-fg3">{longToday()}</p>
        <h1 className="mt-1 font-display text-[34px] font-bold tracking-tight">
          {firstName ? `Hola, ${firstName}` : "Tu colección"}
        </h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction href="/anadir" icon={Plus} title="Añadir una pieza" text="Busca, escanea o rellénala a mano" primary />
        <QuickAction href="/coleccion" icon={Library} title="Ver mi colección" text={`${owned.length} piezas`} />
        <QuickAction href="/anadir?camino=escanear" icon={ScanBarcode} title="Escanear una caja" text="Con el código de barras" soon />
        <QuickAction href="/importar" icon={FileUp} title="Importar mi lista" text="Desde Excel o CSV" soon />
      </div>

      {owned.length === 0 ? (
        <EmptyState
          title="Tu vitrina está vacía"
          text="Añade tu primera locomotora o vagón. Solo hacen falta el tipo, el fabricante y la escala; lo demás lo puedes completar después."
          action={{ href: "/anadir", label: "Añadir mi primera pieza" }}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Piezas en colección" value={String(owned.length)} sub={`${owned.filter((i) => i.kind === "locomotora" || i.kind === "automotor").length} tractoras · ${owned.filter((i) => i.kind === "coche" || i.kind === "vagon").length} remolcadas`} />
            <Stat label="Valor estimado" value={money(value)} sub={`Invertido ${money(invested)}`} />
            <Stat label="Ficha completa (media)" value={`${avgComplete} %`} sub="Completa las fichas desde cada pieza" />
            <Stat
              label="Direcciones digitales"
              value={String(addresses.length)}
              sub={duplicated.length ? `Duplicadas: ${duplicated.join(", ")}` : "Ninguna duplicada"}
              alert={duplicated.length > 0}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <SectionTitle aside={<span className="font-mono text-[13px] text-fg3">{owned.length} piezas</span>}>Por escala</SectionTitle>
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-s2">
                {byScale.map(([s, n]) => (
                  <div key={s} style={{ width: `${(n / owned.length) * 100}%`, background: scaleInfo(s)?.color ?? "var(--fg3)" }} />
                ))}
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {byScale.map(([s, n]) => (
                  <li key={s} className="flex items-center gap-2 text-[15px]">
                    <ScaleBadge scale={s} />
                    <span className="font-mono text-[13px] text-fg3">{scaleInfo(s)?.ratio}</span>
                    <span className="ml-auto font-mono">{n}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <SectionTitle>Por tipo</SectionTitle>
              <ul className="mt-4 flex flex-col gap-3">
                {KINDS.filter((k) => byKind.get(k.id)).map((k) => (
                  <li key={k.id}>
                    <div className="flex justify-between text-[15px]">
                      <span>{k.label}</span>
                      <span className="font-mono">{byKind.get(k.id)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-s2">
                      <div className="h-full rounded-full bg-amb" style={{ width: `${((byKind.get(k.id) ?? 0) / owned.length) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <SectionTitle>Por época NEM</SectionTitle>
              <EpochBars counts={byEpoch} />
            </Card>

            <Card className="p-5">
              <SectionTitle>Digital / analógico</SectionTitle>
              <Donut pct={Math.round((digital / owned.length) * 100)} />
              <ul className="mt-3 flex flex-col gap-1.5 text-[15px]">
                <li className="flex justify-between"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-amb" />Digital</span><span className="font-mono">{digital}</span></li>
                <li className="flex justify-between"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-ln2" />Analógico</span><span className="font-mono">{owned.filter((i) => i.system === "analogico").length}</span></li>
                <li className="flex justify-between text-fg3"><span>Sin indicar</span><span className="font-mono">{owned.filter((i) => !i.system).length}</span></li>
              </ul>
            </Card>
          </div>

          <div className="grid gap-3 xl:grid-cols-[2fr_1fr]">
            <Card className="p-5">
              <SectionTitle aside={<Link href="/coleccion" className="text-[15px] text-ambtx hover:underline">Ver colección</Link>}>
                Últimas añadidas
              </SectionTitle>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {latest.map((i) => (
                  <Link key={i.id} href={`/coleccion/${i.id}`} className="group">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-ln">
                      <PhotoBox src={covers[i.id]} alt={i.name} kind={i.kind} />
                      <span className="absolute left-2 top-2"><ScaleBadge scale={i.scale} /></span>
                    </div>
                    <p className="mt-2 truncate text-[15px] font-semibold group-hover:text-ambtx">{i.name}</p>
                    <p className="truncate font-mono text-[13px] text-fg3">{[i.manufacturer, i.catalog_ref].filter(Boolean).join(" ")}</p>
                  </Link>
                ))}
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <Card className="p-5">
                <SectionTitle>Historial reciente</SectionTitle>
                {events.length === 0 ? (
                  <p className="mt-3 text-[15px] text-fg3">Aún no hay mantenimientos apuntados. Se añaden desde la ficha de cada pieza.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-3">
                    {events.map((e) => (
                      <li key={e.id}>
                        <Link href={`/coleccion/${e.item_id}`} className="block hover:text-ambtx">
                          <p className="text-[15px] font-semibold">{e.title}</p>
                          <p className="text-[14px] text-fg3">{labelOf(EVENT_KINDS, e.kind)} · {e.items?.name} · {shortDate(e.happened_on)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              {preorders.length > 0 && (
                <Card className="p-5">
                  <SectionTitle>Preventas pendientes</SectionTitle>
                  <ul className="mt-3 flex flex-col gap-3">
                    {preorders.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        <Link href={`/coleccion/${p.id}`} className="block hover:text-ambtx">
                          <p className="text-[15px] font-semibold">{p.name}</p>
                          <p className="font-mono text-[13px] text-fg3">{p.manufacturer} {p.catalog_ref}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, text, primary, soon }: { href: string; icon: typeof Plus; title: string; text: string; primary?: boolean; soon?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-xl border p-4 transition ${
        primary ? "border-amb/60 bg-amb2 hover:border-amb" : "border-ln bg-s1 hover:border-ln2"
      }`}
    >
      <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-[10px] ${primary ? "bg-amb text-[#1a1714]" : "bg-s2 text-fg2"}`}>
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-[17px] font-semibold">
          {title}
          {soon && <span className="rounded border border-ln2 px-1 font-mono text-[11px] font-normal text-fg3">pronto</span>}
        </span>
        <span className="block text-[15px] text-fg2">{text}</span>
      </span>
    </Link>
  );
}

function Stat({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-[15px] text-fg2">{label}</p>
      <p className="mt-1 font-display text-[32px] font-bold tracking-tight">{value}</p>
      <p className={`text-[14px] ${alert ? "text-red" : "text-fg3"}`}>{sub}</p>
    </Card>
  );
}

function EpochBars({ counts }: { counts: Map<string, number> }) {
  const max = Math.max(1, ...counts.values());
  return (
    <div className="mt-4 flex h-[150px] items-end gap-2">
      {EPOCHS.map((e) => {
        const n = counts.get(e) ?? 0;
        return (
          <div key={e} className="flex flex-1 flex-col items-center gap-1">
            <span className="font-mono text-[12px] text-fg3">{n || ""}</span>
            <div className="w-full rounded-t bg-amb" style={{ height: `${(n / max) * 100}px`, opacity: n ? 1 : 0.15, minHeight: 3 }} />
            <span className="font-mono text-[13px] text-fg2">{e}</span>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto mt-3 h-[100px] w-[100px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--s2)" strokeWidth="12" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--amb)" strokeWidth="12" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold">{pct} %</span>
    </div>
  );
}
