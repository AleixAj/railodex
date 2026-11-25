import type { Metadata } from "next";
import Link from "next/link";
import { DatabaseBackup, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { Importer } from "./importer";

export const metadata: Metadata = { title: "Importar y exportar" };

export default async function ImportarPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("items").select("manufacturer, catalog_ref");
  const existing = (data ?? []).map((i) => `${i.manufacturer.toLowerCase()}|${(i.catalog_ref ?? "").toLowerCase()}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-tight">Importar y exportar</h1>
        <p className="mt-1 text-fg2">Trae tu lista de Excel, o llévate tus datos cuando quieras: son tuyos.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold">Exportar</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <ExportCard
            href="/importar/csv"
            download
            icon={FileSpreadsheet}
            title="Colección en CSV"
            text="Se abre con Excel o Google Sheets."
          />
          <ExportCard
            href="/importar/seguro"
            icon={ShieldCheck}
            title="Informe para el seguro"
            text="Listado con fotos, estado y valores, listo para imprimir o guardar en PDF."
          />
          <ExportCard
            href="/importar/copia"
            download
            icon={DatabaseBackup}
            title="Copia de seguridad"
            text="Todos tus datos en un archivo JSON (sin las fotos)."
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold">Importar desde Excel o CSV</h2>
        <Card className="p-5">
          <Importer existing={existing} />
        </Card>
      </section>
    </div>
  );
}

function ExportCard({
  href,
  icon: Icon,
  title,
  text,
  download,
}: {
  href: string;
  icon: typeof ShieldCheck;
  title: string;
  text: string;
  download?: boolean;
}) {
  const className = "press flex items-start gap-3 rounded-xl border border-ln bg-s1 p-4 hover:border-ln2";
  const body = (
    <>
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] bg-s2 text-ambtx">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-[15px] text-fg2">{text}</span>
      </span>
    </>
  );
  // Downloads need a plain <a>, otherwise the client router tries to render the file as a page.
  return download ? (
    <a href={href} download className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
