"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { btn, field } from "@/components/ui";
import { createComposition, type FormState } from "./actions";

export function NewComposition() {
  const [state, action, pending] = useActionState<FormState, FormData>(createComposition, {});
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input name="name" aria-label="Nombre de la composición" placeholder="Nombre, p. ej. «Talgo III RENFE»" className={field} required maxLength={120} />
        {state.error && <p className="mt-1.5 text-[15px] text-red">{state.error}</p>}
      </div>
      <button className={btn.primary} disabled={pending}>
        <Plus className="h-[18px] w-[18px]" /> {pending ? "Creando…" : "Nueva composición"}
      </button>
    </form>
  );
}
