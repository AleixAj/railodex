import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, email, name } = await requireUser();
  const { count } = await supabase.from("items").select("id", { count: "exact", head: true });
  const theme = (await cookies()).get("theme")?.value === "claro" ? "claro" : "oscuro";

  return (
    <AppShell count={count ?? 0} theme={theme} userLabel={name || email}>
      {children}
    </AppShell>
  );
}
