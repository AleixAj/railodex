"use client";

import { useActionState } from "react";
import { btn, field, Label } from "@/components/ui";
import { updateName, updatePassword, type SettingsState } from "./actions";

function Feedback({ state }: { state: SettingsState }) {
  if (state.error) return <p role="alert" className="text-[15px] text-red">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-[15px] text-grn">{state.ok}</p>;
  return null;
}

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateName, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <input id="name" name="name" defaultValue={state.name ?? name} maxLength={60} autoComplete="name" className={field} />
      </div>
      <Feedback state={state} />
      <button className={`${btn.secondary} self-start`} disabled={pending}>{pending ? "Guardando…" : "Guardar nombre"}</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="pw" hint="mínimo 8">Nueva contraseña</Label>
          <input id="pw" name="password" type="password" minLength={8} required autoComplete="new-password" className={field} />
        </div>
        <div>
          <Label htmlFor="pw2">Repítela</Label>
          <input id="pw2" name="repeat" type="password" minLength={8} required autoComplete="new-password" className={field} />
        </div>
      </div>
      <Feedback state={state} />
      <button className={`${btn.secondary} self-start`} disabled={pending}>{pending ? "Cambiando…" : "Cambiar contraseña"}</button>
    </form>
  );
}
