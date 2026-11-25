"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Cpu,
  Gem,
  Heart,
  Home,
  Library,
  MapPin,
  Settings,
  TrainTrack,
  Wrench,
  X,
} from "lucide-react";
import { FREE_PLAN_LIMIT } from "@/lib/catalog";

const MAIN = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/coleccion", label: "Colección", icon: Library, count: true },
  { href: "/composiciones", label: "Composiciones", icon: TrainTrack },
  { href: "/deseos", label: "Deseos y preventas", icon: Heart },
  { href: "/mantenimiento", label: "Mantenimiento", icon: Wrench },
  { href: "/ubicaciones", label: "Ubicaciones", icon: MapPin },
  { href: "/digital", label: "Digital", icon: Cpu },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
];
const FOOT = [
  { href: "/importar", label: "Importar / exportar", icon: ArrowLeftRight },
  { href: "/ajustes", label: "Ajustes y perfil", icon: Settings },
];

export function Sidebar({ count, open, onClose }: { count: number; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const pct = Math.min(100, Math.round((count / FREE_PLAN_LIMIT) * 100));

  const link = (item: (typeof MAIN)[number]) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        className={`flex h-11 items-center gap-3 rounded-[10px] px-3 text-[16px] transition ${
          active ? "bg-s2 font-semibold text-fg" : "text-fg2 hover:bg-s2/60 hover:text-fg"
        }`}
      >
        <Icon className={`h-[18px] w-[18px] ${active ? "text-ambtx" : ""}`} strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        {"count" in item && item.count && <span className="font-mono text-[13px] text-fg3">{count}</span>}
      </Link>
    );
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-ln bg-bg transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center gap-3 border-b border-ln px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-ln2 font-mono text-[10px] text-fg3">
            logo
          </div>
          <span className="font-display text-[22px] font-bold tracking-tight">Railodex</span>
          <button onClick={onClose} className="ml-auto rounded-md p-2 text-fg3 hover:bg-s2 lg:hidden" aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Principal">
          {MAIN.map(link)}
        </nav>

        <div className="mx-3 mb-3 rounded-xl border border-ln bg-s1 p-3">
          <div className="mb-2 flex items-center justify-between text-[14px]">
            <span className="text-fg2">Plan Gratis</span>
            <span className="font-mono text-fg3">
              {count}/{FREE_PLAN_LIMIT}
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-s2">
            <div className="h-full rounded-full bg-amb" style={{ width: `${pct}%` }} />
          </div>
          <Link
            href="/ajustes"
            className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-ln2 text-[15px] font-medium hover:bg-s2"
          >
            <Gem className="h-4 w-4 text-ambtx" /> Pasar a Pro
          </Link>
        </div>

        <nav className="flex flex-col gap-1 border-t border-ln p-3" aria-label="Cuenta">
          {FOOT.map((f) => link(f as (typeof MAIN)[number]))}
        </nav>
      </aside>
    </>
  );
}
