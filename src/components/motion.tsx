"use client";

import { ViewTransition } from "react";

/**
 * Wraps one item of a list so it glides to its new spot (and fades in/out) when the
 * list changes. It only animates for transitions tagged with `type`, so plain page
 * navigation never triggers it. Needs a stable `key` on the element that uses it.
 */
export function ListItemMotion({ type, children }: { type: string; children: React.ReactNode }) {
  return (
    <ViewTransition
      default="none"
      enter={{ [type]: "list-in", default: "none" }}
      exit={{ [type]: "list-out", default: "none" }}
      update={{ [type]: "list-move", default: "none" }}
    >
      {children}
    </ViewTransition>
  );
}
