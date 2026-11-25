"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanBarcode, Search, Sparkles } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";

/** The quick ways to add a piece, shown above the step-by-step form. */
export function AddPaths({ startScanning }: { startScanning: boolean }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(startScanning);

  // Reload the page with the code; the server checks whether you already own it.
  const handleCode = useCallback(
    (code: string) => {
      setScanning(false);
      router.push(`/anadir?ean=${encodeURIComponent(code)}`);
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => setScanning(true)}
          className="flex items-center gap-3 rounded-xl border border-ln2 bg-s1 p-3.5 text-left hover:border-amb"
        >
          <ScanBarcode className="h-6 w-6 flex-none text-ambtx" strokeWidth={1.5} />
          <span className="min-w-0">
            <span className="block font-semibold">Escanear código de barras</span>
            <span className="block truncate text-[14px] text-fg3">Apunta al EAN de la caja</span>
          </span>
        </button>
        <Soon icon={Search} title="Buscar en el catálogo" text="Escribe «Roco 73845» y se rellena solo" />
        <Soon icon={Sparkles} title="Foto con IA" text="Propone fabricante, modelo y escala" />
      </div>
      {scanning && <BarcodeScanner onCode={handleCode} onClose={() => setScanning(false)} />}
    </div>
  );
}

function Soon({ icon: Icon, title, text }: { icon: typeof Search; title: string; text: string }) {
  return (
    <div className="hidden items-center gap-3 rounded-xl border border-dashed border-ln2 p-3.5 text-fg3 sm:flex" aria-disabled>
      <Icon className="h-6 w-6 flex-none" strokeWidth={1.5} />
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-semibold text-fg2">
          {title} <span className="rounded border border-ln2 px-1 font-mono text-[11px] font-normal">pronto</span>
        </span>
        <span className="block truncate text-[14px]">{text}</span>
      </span>
    </div>
  );
}
