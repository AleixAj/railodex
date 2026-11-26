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

export function Card({ className = "", id, children }: { className?: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`rounded-xl border border-ln bg-s1 ${className}`}>
      {children}
    </section>
  );
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
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-amb px-4 font-semibold text-[#1a1714] press hover:brightness-110 disabled:opacity-50",
  secondary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-ln2 bg-s1 px-4 font-medium text-fg press hover:bg-s2 disabled:opacity-50",
  ghost:
    "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-3 font-medium text-fg2 press hover:bg-s2 hover:text-fg",
  danger:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-red/40 bg-red2 px-4 font-medium text-red press hover:brightness-110",
};

export const field =
  "h-11 w-full rounded-[10px] border border-ln2 bg-s3 px-3 text-fg transition-[border-color,background-color] duration-150 placeholder:text-fg3 focus:border-amb focus:outline-none";

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
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  kind?: Kind;
  /** The main photo on screen: load it straight away instead of lazily. */
  priority?: boolean;
}) {
  const Icon = kind ? KIND_ICONS[kind] : TrainFront;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- already resized WebP served by /foto, next/image would add nothing
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
      />
    );
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
      <div className="relative w-28 overflow-hidden pb-2" aria-hidden>
        <TrainFront className="train-in mx-auto h-12 w-12 text-ln2" strokeWidth={1.25} />
        <div className="rail-rule absolute inset-x-0 bottom-0" />
      </div>
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
