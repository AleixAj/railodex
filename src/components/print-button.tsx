"use client";

import { Printer } from "lucide-react";
import { btn } from "@/components/ui";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className={btn.primary}>
      <Printer className="h-[18px] w-[18px]" /> {label}
    </button>
  );
}
