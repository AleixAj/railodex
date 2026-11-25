import type { Metadata } from "next";
import { safeNext } from "@/lib/redirects";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, confirmado, next } = await searchParams;
  const notice = error ? "El enlace no es válido o ha caducado. Vuelve a intentarlo." : undefined;
  const info = confirmado ? "Email confirmado. Ya puedes entrar con tu email y contraseña." : undefined;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="photo-placeholder relative hidden flex-col justify-end p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" aria-hidden />
        <div className="relative max-w-lg">
          <p className="mb-3 font-mono text-[13px] tracking-[0.08em] text-fg3">RAILODEX · TU COLECCIÓN</p>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight">
            Cada locomotora, en su sitio.
          </h1>
          <p className="mt-4 text-lg text-fg2">
            Cataloga tus locomotoras, coches y vagones con todo detalle: referencia, rodaje, decoder, compra y
            mantenimiento.
          </p>
        </div>
      </section>

      <section className="flex flex-col items-center justify-center gap-8 px-5 py-12">
        <div className="text-center">
          <span className="font-display text-4xl font-bold tracking-tight">Railodex</span>
          <p className="mt-2 text-fg2">Entra o crea tu cuenta gratis.</p>
        </div>
        <LoginForm notice={notice} info={info} next={safeNext(next)} />
      </section>
    </div>
  );
}
