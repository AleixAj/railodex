"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Plus, Search } from "lucide-react";
import { Sidebar } from "./sidebar";
import { signOut } from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({
  children,
  count,
  theme,
  userLabel,
}: {
  children: React.ReactNode;
  count: number;
  theme: "oscuro" | "claro";
  userLabel: string;
}) {
  const [open, setOpen] = useState(false);
  // On phones the floating button covered the wizard's Next button.
  const pathname = usePathname();
  const inWizard = pathname === "/anadir" || pathname.endsWith("/editar");

  return (
    <div className="flex min-h-dvh">
      <Sidebar count={count} open={open} onClose={() => setOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-ln bg-bg/90 backdrop-blur print:hidden">
          <div className="flex h-[72px] items-center gap-3 px-4 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-[10px] border border-ln2 p-2.5 text-fg2 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <form action="/coleccion" className="relative ml-auto w-full max-w-[420px]" role="search">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg3" />
              <input
                name="q"
                placeholder="Buscar piezas, referencias, matrículas…"
                aria-label="Buscar en la colección"
                className="h-11 w-full rounded-[10px] border border-ln2 bg-s1 pl-10 pr-3 text-[15px] placeholder:text-fg3 focus:border-amb focus:outline-none"
              />
            </form>

            <ThemeToggle
              initial={theme}
              className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-ln2 bg-s1 text-fg2 hover:text-fg"
            />

            <Link
              href="/anadir"
              className="hidden h-11 items-center gap-2 rounded-[10px] bg-amb px-4 font-semibold text-[#1a1714] hover:brightness-110 sm:inline-flex"
            >
              <Plus className="h-[18px] w-[18px]" /> Añadir pieza
            </Link>

            <form action={signOut}>
              <button
                className="flex h-11 items-center gap-2 rounded-[10px] px-3 text-fg2 hover:bg-s2 hover:text-fg"
                title={`Cerrar sesión (${userLabel})`}
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </form>
          </div>
          <div className="rail-rule" aria-hidden />
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>

      {!inWizard && (
        <Link
          href="/anadir"
          className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-amb text-[#1a1714] shadow-lg sm:hidden print:hidden"
          aria-label="Añadir pieza"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}
