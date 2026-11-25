"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "./actions";
import { btn, field, Label } from "@/components/ui";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, { mode: "entrar" });
  const [mode, setMode] = useState<"entrar" | "registro">(state.mode);
  const current = state.info ? "entrar" : mode;

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-6 grid grid-cols-2 rounded-[12px] border border-ln bg-s1 p-1" role="tablist">
        {(["entrar", "registro"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={current === m}
            onClick={() => setMode(m)}
            className={`h-10 rounded-[9px] text-[15px] font-medium ${current === m ? "bg-s2 text-fg" : "text-fg3 hover:text-fg"}`}
          >
            {m === "entrar" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="mode" value={current} />
        {current === "registro" && (
          <div>
            <Label htmlFor="name">Tu nombre</Label>
            <input id="name" name="name" autoComplete="name" className={field} placeholder="Javier" />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <input id="email" name="email" type="email" required autoComplete="email" className={field} />
        </div>
        <div>
          <Label htmlFor="password" hint={current === "registro" ? "mínimo 8 caracteres" : undefined}>
            Contraseña
          </Label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={current === "registro" ? 8 : undefined}
            autoComplete={current === "registro" ? "new-password" : "current-password"}
            className={field}
          />
        </div>

        {(state.error || notice) && (
          <p role="alert" className="rounded-[10px] border border-red/40 bg-red2 px-3 py-2.5 text-[15px] text-red">
            {state.error ?? notice}
          </p>
        )}
        {state.info && (
          <p role="status" className="rounded-[10px] border border-grn/40 bg-grn2 px-3 py-2.5 text-[15px] text-grn">
            {state.info}
          </p>
        )}

        <button className={`${btn.primary} mt-1 h-12`} disabled={pending}>
          {pending ? "Un momento…" : current === "entrar" ? "Entrar" : "Crear cuenta gratis"}
        </button>
      </form>
    </div>
  );
}
