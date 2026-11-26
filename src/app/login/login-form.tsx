"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "./actions";
import { btn, field, Label } from "@/components/ui";

type Mode = "entrar" | "registro" | "recuperar";

export function LoginForm({ notice, info, next }: { notice?: string; info?: string; next: string }) {
  const [mode, setMode] = useState<Mode>("entrar");
  const [state, action, pending] = useActionState<AuthState, FormData>(async (prev, formData) => {
    const result = await authenticate(prev, formData);
    // After signing up, switch to "Entrar" so they can log in once they've confirmed.
    if (result.info && formData.get("mode") === "registro") setMode("entrar");
    return result;
  }, {});

  const error = state.error ?? notice;
  const message = state.info ?? (state.error ? undefined : info);

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-6 grid grid-cols-2 rounded-[12px] border border-ln bg-s1 p-1" role="tablist">
        {(["entrar", "registro"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m || (m === "entrar" && mode === "recuperar")}
            onClick={() => setMode(m)}
            className={`h-10 rounded-[9px] text-[15px] font-medium ${mode === m || (m === "entrar" && mode === "recuperar") ? "bg-s2 text-fg" : "text-fg3 hover:text-fg"}`}
          >
            {m === "entrar" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="next" value={next} />
        {mode === "registro" && (
          <div>
            <Label htmlFor="name">Tu nombre</Label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              maxLength={60}
              className={field}
              placeholder="p. ej. Javier"
            />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.email}
            className={field}
          />
        </div>
        {mode === "recuperar" ? (
          <p className="text-[15px] text-fg2">
            Te enviaremos un enlace para entrar y elegir una contraseña nueva.{" "}
            <button type="button" onClick={() => setMode("entrar")} className="text-ambtx hover:underline">
              Volver
            </button>
          </p>
        ) : (
          <div>
            <Label htmlFor="password" hint={mode === "registro" ? "mínimo 8 caracteres" : undefined}>
              Contraseña
            </Label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "registro" ? 8 : undefined}
              autoComplete={mode === "registro" ? "new-password" : "current-password"}
              className={field}
            />
            {mode === "entrar" && (
              <button
                type="button"
                onClick={() => setMode("recuperar")}
                className="mt-2 text-[14px] text-fg3 hover:text-ambtx"
              >
                ¿Has olvidado la contraseña?
              </button>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-[10px] border border-red/40 bg-red2 px-3 py-2.5 text-[15px] text-red">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-[10px] border border-grn/40 bg-grn2 px-3 py-2.5 text-[15px] text-grn">
            {message}
          </p>
        )}

        <button className={`${btn.primary} mt-1 h-12`} disabled={pending}>
          {pending
            ? "Un momento…"
            : mode === "entrar"
              ? "Entrar"
              : mode === "registro"
                ? "Crear cuenta gratis"
                : "Enviarme el enlace"}
        </button>
      </form>
    </div>
  );
}
