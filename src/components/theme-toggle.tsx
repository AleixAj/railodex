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

  const toggle = () => {
    document.documentElement.dataset.theme = next;
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
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
