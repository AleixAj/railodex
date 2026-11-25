"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string; mode: "entrar" | "registro" };

const MESSAGES: Record<string, string> = {
  invalid_credentials: "El email o la contraseña no son correctos.",
  email_not_confirmed: "Aún no has confirmado tu email. Revisa tu bandeja de entrada.",
  user_already_exists: "Ya hay una cuenta con ese email. Prueba a entrar.",
  weak_password: "La contraseña es demasiado débil. Usa al menos 8 caracteres.",
  over_email_send_rate_limit: "Se han enviado demasiados emails. Espera unos minutos.",
};

export async function authenticate(prev: AuthState, formData: FormData): Promise<AuthState> {
  const mode = formData.get("mode") === "registro" ? "registro" : "entrar";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password) return { mode, error: "Escribe tu email y tu contraseña." };
  if (mode === "registro" && password.length < 8) {
    return { mode, error: "La contraseña tiene que tener al menos 8 caracteres." };
  }

  const supabase = await createClient();

  if (mode === "entrar") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { mode, error: MESSAGES[error.code ?? ""] ?? "No se ha podido entrar. Inténtalo de nuevo." };
    redirect("/");
  }

  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { mode, error: MESSAGES[error.code ?? ""] ?? "No se ha podido crear la cuenta." };

  // Si el proyecto no pide confirmar el email, ya hay sesión.
  if (data.session) redirect("/");
  return { mode: "entrar", info: "Cuenta creada. Te hemos enviado un email para confirmarla." };
}
