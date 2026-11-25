import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";

const SECTIONS: Record<string, { title: string; text: string }> = {
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
