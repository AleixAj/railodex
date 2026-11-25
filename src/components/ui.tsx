import Link from "next/link";
import { Armchair, Container, Signpost, TrainFront, TramFront, type LucideIcon } from "lucide-react";
import { scaleInfo, type Kind } from "@/lib/catalog";

export const KIND_ICONS: Record<Kind, LucideIcon> = {
  locomotora: TrainFront,
  automotor: TramFront,
  coche: Armchair,
  vagon: Container,
  accesorio: Signpost,
};

export function ScaleBadge({ scale }: { scale: string }) {
  const info = scaleInfo(scale);
  const color = info?.color ?? "var(--fg3)";
  return (
    <span
      className="inline-flex h-6 items-center rounded-md border px-1.5 font-mono text-[13px] font-semibold"
      style={{
        color,
        borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
        background: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      {info?.label ?? scale}
    </span>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "amb" | "grn" | "red";
}) {
  const tones = {
    neutral: "border-ln2 text-fg2",
    amb: "border-amb/50 bg-amb2 text-ambtx",
    grn: "border-grn/40 bg-grn2 text-grn",
    red: "border-red/40 bg-red2 text-red",
  };
  return (
    <span className={`inline-flex h-6 items-center rounded-md border px-1.5 font-mono text-[13px] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-xl border border-ln bg-s1 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[17px] font-semibold">{children}</h2>
      {aside}
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-amb px-4 font-semibold text-[#1a1714] transition hover:brightness-110 disabled:opacity-50",
  secondary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-ln2 bg-s1 px-4 font-medium text-fg transition hover:bg-s2 disabled:opacity-50",
  ghost:
    "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-3 font-medium text-fg2 transition hover:bg-s2 hover:text-fg",
  danger:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-red/40 bg-red2 px-4 font-medium text-red transition hover:brightness-110",
};

export const field =
  "h-11 w-full rounded-[10px] border border-ln2 bg-s3 px-3 text-fg placeholder:text-fg3 focus:border-amb focus:outline-none";

export function Label({ children, htmlFor, hint }: { children: React.ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-2 text-[15px] font-medium text-fg2">
      {children}
      {hint && <span className="font-mono text-[12px] font-normal text-fg3">{hint}</span>}
    </label>
  );
}

export function PhotoBox({
  src,
  alt,
  className = "",
  kind,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  kind?: Kind;
}) {
  const Icon = kind ? KIND_ICONS[kind] : TrainFront;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- URLs firmadas de Supabase, temporales
    return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`photo-placeholder flex h-full w-full items-center justify-center ${className}`}
      aria-label="Sin foto"
    >
      <Icon className="h-10 w-10 text-ln2" strokeWidth={1.25} />
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { href: string; label: string };
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <TrainFront className="h-12 w-12 text-ln2" strokeWidth={1.25} />
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <p className="max-w-md text-fg2">{text}</p>
      {action && (
        <Link href={action.href} className={`${btn.primary} mt-2`}>
          {action.label}
        </Link>
      )}
    </Card>
  );
}
