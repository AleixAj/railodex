import Link from "next/link";
import { TrainTrack } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-5 text-center">
      <TrainTrack className="h-12 w-12 text-ln2" strokeWidth={1.25} />
      <p className="font-mono text-[13px] tracking-[0.08em] text-fg3">ERROR 404</p>
      <h1 className="font-display text-3xl font-bold tracking-tight">Esta vía no lleva a ningún sitio</h1>
      <p className="max-w-md text-fg2">La página no existe o la pieza ya no está en tu colección.</p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center rounded-[10px] bg-amb px-4 font-semibold text-[#1a1714] hover:brightness-110"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
