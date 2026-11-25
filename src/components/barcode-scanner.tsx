"use client";

import { useEffect, useRef, useState } from "react";
import { ScanBarcode, X } from "lucide-react";
import { btn, field, Label } from "@/components/ui";

// BarcodeDetector isn't in TypeScript's DOM types yet.
type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/**
 * Reads the EAN on a model's box with the camera. BarcodeDetector works on Chrome for
 * Android and on Macs; everywhere else (iPhone, Windows, Firefox) you type the number.
 */
export function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [supported] = useState(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [cameraError, setCameraError] = useState("");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!supported) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();

        const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
        const detector = new Ctor({ formats: FORMATS });
        timer = setInterval(async () => {
          if (!video.current || video.current.readyState < 2) return;
          const found = await detector.detect(video.current).catch(() => []);
          // The scanner may have been closed while that detect() was still running.
          if (stopped) return;
          if (found[0]?.rawValue) {
            stopped = true;
            clearInterval(timer);
            onCode(found[0].rawValue);
          }
        }, 300);
      } catch {
        setCameraError("No se ha podido abrir la cámara. Revisa el permiso o escribe el código a mano.");
      }
    })();

    // Turn the camera off when the scanner closes.
    return () => {
      stopped = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [supported, onCode]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ln2 bg-s1 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-semibold">
          <ScanBarcode className="h-5 w-5 text-ambtx" /> Escanear código de barras
        </p>
        <button onClick={onClose} aria-label="Cerrar escáner" className="rounded p-1.5 text-fg3 hover:text-fg">
          <X className="h-5 w-5" />
        </button>
      </div>

      {supported && !cameraError ? (
        <div className="relative aspect-[4/3] max-w-md overflow-hidden rounded-lg bg-black">
          <video ref={video} muted playsInline className="h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-amb/80"
            aria-hidden
          />
          <p className="absolute inset-x-0 bottom-2 text-center text-[14px] text-white/80">
            Apunta al código de la caja
          </p>
        </div>
      ) : (
        <p className="text-[15px] text-fg2">
          {cameraError ||
            "Este navegador no puede leer códigos con la cámara. Escribe los números que hay debajo de las barras."}
        </p>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.length >= 8) onCode(typed);
        }}
      >
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="ean-typed">O escríbelo</Label>
          <input
            id="ean-typed"
            inputMode="numeric"
            value={typed}
            onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, 14))}
            className={`${field} font-mono`}
            placeholder="p. ej. 9005033738454"
          />
        </div>
        <button className={btn.primary} disabled={typed.length < 8}>
          Usar código
        </button>
      </form>
    </div>
  );
}
