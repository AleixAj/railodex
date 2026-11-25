"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";

export type SettingsState = { error?: string; ok?: string };

export async function updateName(prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const name = String(fd.get("name") ?? "").trim().slice(0, 60);
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({ data: { name } });
  if (error) return { error: "No se ha podido guardar el nombre." };
  revalidatePath("/", "layout");
  return { ok: "Nombre guardado." };
}

export async function updatePassword(prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const password = String(fd.get("password") ?? "");
  const repeat = String(fd.get("repeat") ?? "");
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (password !== repeat) return { error: "Las dos contraseñas no coinciden." };

  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({ password });
  if (error?.code === "same_password") return { error: "Es la misma contraseña que ya tenías." };
  if (error?.code === "reauthentication_needed") {
    return { error: "Por seguridad, cierra sesión, vuelve a entrar y cámbiala justo después." };
  }
  if (error) return { error: "No se ha podido cambiar la contraseña." };
  return { ok: "Contraseña cambiada." };
}
