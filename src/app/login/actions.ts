"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/redirects";
import { siteOrigin } from "@/lib/site";

export type AuthState = { error?: string; info?: string; email?: string };

const MESSAGES: Record<string, string> = {
  invalid_credentials: "El email o la contraseña no son correctos.",
  email_not_confirmed: "Aún no has confirmado tu email. Revisa tu bandeja de entrada.",
  user_already_exists: "Ya hay una cuenta con ese email. Prueba a entrar.",
  weak_password: "La contraseña es demasiado débil. Usa al menos 8 caracteres.",
  over_email_send_rate_limit: "Se han enviado demasiados emails. Espera unos minutos.",
  over_request_rate_limit: "Demasiados intentos seguidos. Espera un momento y vuelve a probar.",
};

export async function authenticate(prev: AuthState, formData: FormData): Promise<AuthState> {
  const mode = formData.get("mode") === "registro" ? "registro" : "entrar";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const next = safeNext(formData.get("next"));

  // `email` goes back with every error so the form doesn't wipe it.
  if (!email || !password) return { email, error: "Escribe tu email y tu contraseña." };
  if (mode === "registro" && password.length < 8) {
    return { email, error: "La contraseña tiene que tener al menos 8 caracteres." };
  }

  const supabase = await createClient();

  if (mode === "entrar") {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { email, error: MESSAGES[error.code ?? ""] ?? "No se ha podido entrar. Inténtalo de nuevo." };
    redirect(next);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) return { email, error: MESSAGES[error.code ?? ""] ?? "No se ha podido crear la cuenta." };

  // If email confirmation is turned off in Supabase we already have a session.
  if (data.session) redirect(next);
  // Supabase answers the same whether or not the email already had an account,
  // so nobody can use this form to find out who's registered.
  return { email, info: "Listo. Si el email es correcto te llegará un enlace para confirmar la cuenta." };
}
