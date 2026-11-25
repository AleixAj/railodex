"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { btn, Card } from "@/components/ui";

// Shown inside the app shell when a page fails, so the menu keeps working.
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <Card className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center">
      <TriangleAlert className="h-10 w-10 text-red" strokeWidth={1.5} />
      <h1 className="font-display text-2xl font-bold">Algo ha fallado</h1>
      <p className="text-fg2">No se ha podido cargar esta pantalla. Suele ser un problema de conexión pasajero.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button onClick={() => retry()} className={btn.primary}>
          <RotateCcw className="h-[18px] w-[18px]" /> Reintentar
        </button>
        <Link href="/" className={btn.secondary}>
          Ir al inicio
        </Link>
      </div>
      {digest && <p className="font-mono text-[12px] text-fg3">Código: {digest}</p>}
    </Card>
  );
}
