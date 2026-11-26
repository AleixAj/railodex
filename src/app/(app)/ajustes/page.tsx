import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Check, DatabaseBackup, FileSpreadsheet, LogOut, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { FREE_PLAN_LIMIT } from "@/lib/catalog";
import { signOut } from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, btn } from "@/components/ui";
import { NameForm, PasswordForm } from "./forms";

export const metadata: Metadata = { title: "Ajustes y perfil" };

// Prices are a first guess so the screen looks real; nothing can be bought yet.
const PLANS = [
  {
    id: "gratis",
    name: "Gratis",
    price: "0 €",
    note: "para siempre",
    features: [
      `Hasta ${FREE_PLAN_LIMIT} piezas`,
      "Ficha completa y fotos",
      "Composiciones y lista de deseos",
      "Exportar a CSV",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "3 €/mes",
    note: "o 29 € al año",
    features: [
      "Piezas ilimitadas",
      "Reconocimiento por foto con IA",
      "Valor de mercado y su evolución",
      "Informe para el seguro con tu marca",
      "Recordatorios de mantenimiento",
    ],
  },
  {
    id: "profesional",
    name: "Profesional / Club",
    price: "A medida",
    note: "tiendas, restauradores y clubes",
    features: [
      "Varias personas en una colección",
      "Permisos: ver, editar, administrar",
      "Stock y fichas de venta",
      "Préstamos entre socios",
    ],
  },
];

export default async function AjustesPage({ searchParams }: PageProps<"/ajustes">) {
  const { recuperar } = await searchParams;
  const { supabase, email, name } = await requireUser();
  const { count } = await supabase.from("items").select("id", { count: "exact", head: true });
  const theme = (await cookies()).get("theme")?.value === "claro" ? "claro" : "oscuro";
  const used = count ?? 0;

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <h1 className="font-display text-[34px] font-bold tracking-tight">Ajustes y perfil</h1>

      <Card className="p-5">
        <h2 className="text-[17px] font-semibold">Perfil</h2>
        <p className="mt-1 text-[15px] text-fg3">
          Entras con <span className="text-fg2">{email}</span>.
        </p>
        <div className="mt-4">
          <NameForm name={name} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-[17px] font-semibold">Apariencia</h2>
        <ThemeToggle initial={theme} withLabel className={`${btn.secondary} mt-3`} />
      </Card>

      <Card id="contrasena" className={`scroll-mt-24 p-5 ${recuperar ? "border-amb" : ""}`}>
        <h2 className="text-[17px] font-semibold">Contraseña</h2>
        {recuperar && (
          <p role="status" className="mt-2 text-ambtx">
            Has entrado con el enlace del email. Elige ahora tu contraseña nueva.
          </p>
        )}
        <div className="mt-4">
          <PasswordForm />
        </div>
      </Card>

      <section id="planes" className="flex scroll-mt-24 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[20px] font-semibold">Tu plan</h2>
          <span className="font-mono text-[14px] text-fg3">
            Gratis · {used}/{FREE_PLAN_LIMIT} piezas
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PLANS.map((p) => {
            const current = p.id === "gratis";
            return (
              <Card key={p.id} className={`flex flex-col p-5 ${p.id === "pro" ? "border-amb/60" : ""}`}>
                <p className="font-semibold">{p.name}</p>
                <p className="mt-2 font-display text-[28px] font-bold">{p.price}</p>
                <p className="text-[14px] text-fg3">{p.note}</p>
                <ul className="mt-4 flex flex-1 flex-col gap-2 text-[15px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-grn" /> {f}
                    </li>
                  ))}
                </ul>
                <button disabled className={`${current ? btn.secondary : btn.primary} mt-5 w-full`}>
                  {current ? "Plan actual" : "Próximamente"}
                </button>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="p-5">
        <h2 className="text-[17px] font-semibold">Tus datos</h2>
        <p className="mt-1 text-[15px] text-fg3">Puedes llevártelos cuando quieras.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/importar/csv" download className={btn.secondary}>
            <FileSpreadsheet className="h-[18px] w-[18px]" /> Descargar CSV
          </a>
          <a href="/importar/copia" download className={btn.secondary}>
            <DatabaseBackup className="h-[18px] w-[18px]" /> Copia de seguridad
          </a>
          {process.env.NODE_ENV !== "production" && (
            <Link href="/demo" className={btn.ghost}>
              <Sparkles className="h-[18px] w-[18px]" /> Colección de ejemplo
            </Link>
          )}
        </div>
      </Card>

      <form action={signOut}>
        <button className={btn.ghost}>
          <LogOut className="h-[18px] w-[18px]" /> Cerrar sesión
        </button>
      </form>
    </div>
  );
}
