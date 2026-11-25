import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";

const SECTIONS: Record<string, { title: string; text: string }> = {
  composiciones: { title: "Composiciones", text: "Agrupa una locomotora y sus coches en un tren completo, con longitud total y avisos de enganches o épocas que no casan." },
  deseos: { title: "Deseos y preventas", text: "Piezas que quieres, con precio objetivo y prioridad. Una preventa pasará a tu colección con un botón." },
  mantenimiento: { title: "Mantenimiento", text: "Calendario de engrases y limpiezas con recordatorios. De momento puedes apuntar el historial desde la ficha de cada pieza." },
  ubicaciones: { title: "Ubicaciones", text: "Vitrinas, estantes y cajas con etiquetas QR. De momento la ubicación se escribe en cada pieza." },
  digital: { title: "Digital", text: "Todas tus direcciones digitales y decoders en una lista, con aviso de duplicados." },
  estadisticas: { title: "Estadísticas", text: "Evolución del valor, gasto por año y fabricante, y progreso de series." },
  importar: { title: "Importar y exportar", text: "Importar desde Excel/CSV con vista previa, y exportar a CSV o PDF para el seguro." },
  ajustes: { title: "Ajustes y perfil", text: "Idioma, moneda, privacidad y tu plan (Gratis o Pro)." },
};

export async function generateMetadata({ params }: PageProps<"/[seccion]">): Promise<Metadata> {
  const { seccion } = await params;
  return { title: SECTIONS[seccion]?.title ?? "Railodex" };
}

export default async function SeccionPage({ params }: PageProps<"/[seccion]">) {
  const { seccion } = await params;
  const s = SECTIONS[seccion];
  if (!s) notFound();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[34px] font-bold tracking-tight">{s.title}</h1>
      <Card className="max-w-2xl p-6">
        <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.08em] text-ambtx">Próximamente</p>
        <p className="text-[17px] text-fg2">{s.text}</p>
      </Card>
    </div>
  );
}
