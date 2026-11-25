"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "oscuro" | "claro";

// The <html data-theme> attribute is the single source of truth, so every toggle
// on the page (top bar, settings) stays in sync without sharing state.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/**
 * Switches light/dark instantly in the browser. The cookie is only there so the
 * server renders the right theme on the next visit (no flash of the wrong one).
 */
export function ThemeToggle({
  initial,
  withLabel = false,
  className = "",
}: {
  initial: Theme;
  withLabel?: boolean;
  className?: string;
}) {
  const theme = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "claro" ? "claro" : "oscuro"),
    () => initial,
  );
  const next: Theme = theme === "oscuro" ? "claro" : "oscuro";

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const html = document.documentElement;
    const apply = () => {
      html.dataset.theme = next;
      document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      apply();
      return;
    }

    // The new theme grows as a circle from the button (see .theme-switching in globals.css).
    const box = event.currentTarget.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    html.style.setProperty("--reveal-x", `${x}px`);
    html.style.setProperty("--reveal-y", `${y}px`);
    html.style.setProperty("--reveal-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    html.classList.add("theme-switching");
    document.startViewTransition(apply).finished.finally(() => html.classList.remove("theme-switching"));
  };

  const Icon = theme === "oscuro" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Cambiar a modo ${next}`}
      title={`Modo ${next}`}
      className={className}
    >
      <Icon className="h-[18px] w-[18px]" />
      {withLabel && <span>Cambiar a modo {next}</span>}
    </button>
  );
}
