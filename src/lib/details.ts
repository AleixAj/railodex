// Cleans the `details` blob before it's saved. Only known fields get through, with the
// right type, and only the ones that make sense for this piece: switching a loco from
// digital to analogue, or a loco into a coach, drops the fields that no longer apply.

import type { ItemDetails } from "./types";

type Field = "text" | "bool" | "int";

const SPEC: Record<keyof ItemDetails, Field | "functions"> = {
  wheelArrangement: "text",
  tender: "bool",
  smokeGenerator: "bool",
  transmission: "text",
  pantographs: "int",
  catenaryPickup: "bool",
  units: "int",
  wagonSubtype: "text",
  interiorLighting: "bool",
  closeCoupling: "bool",
  protocol: "text",
  decoderOrigin: "text",
  decoder: "text",
  sound: "bool",
  speaker: "text",
  railcom: "bool",
  firmware: "text",
  functions: "functions",
  current: "text",
  digitalReady: "bool",
  interface: "text",
  directionalLights: "bool",
  livery: "text",
  modelYear: "int",
  ean: "text",
  lengthMm: "int",
  limitedEdition: "text",
  coupler: "text",
  origin: "text",
  seller: "text",
  hasBox: "bool",
  hasInstructions: "bool",
};

const ALWAYS = [
  "livery",
  "modelYear",
  "ean",
  "lengthMm",
  "limitedEdition",
  "coupler",
  "origin",
  "seller",
  "hasBox",
  "hasInstructions",
] as const;
const TRACTOR = ["wheelArrangement"] as const;
const BY_TRACTION: Record<string, readonly (keyof ItemDetails)[]> = {
  vapor: ["tender", "smokeGenerator"],
  diesel: ["transmission"],
  hibrida: ["transmission"],
  electrica: ["pantographs", "catenaryPickup"],
};
const ROLLING = ["wagonSubtype", "interiorLighting", "closeCoupling"] as const;
const DIGITAL = [
  "protocol",
  "decoderOrigin",
  "decoder",
  "sound",
  "speaker",
  "railcom",
  "firmware",
  "functions",
] as const;
const ANALOGUE = ["current", "digitalReady", "interface", "directionalLights"] as const;

const ENUMS: Partial<Record<keyof ItemDetails, readonly string[]>> = {
  transmission: ["electrica", "hidraulica", "mecanica"],
  decoderOrigin: ["fabrica", "instalado"],
  current: ["dc", "ac"],
};

function clean(field: Field | "functions", value: unknown) {
  switch (field) {
    case "text": {
      const s = typeof value === "string" ? value.trim().slice(0, 200) : "";
      return s || undefined;
    }
    case "bool":
      return typeof value === "boolean" ? value : undefined;
    case "int": {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isInteger(n) && n >= 0 && n <= 100000 ? n : undefined;
    }
    case "functions": {
      if (!Array.isArray(value)) return undefined;
      const list = value
        .filter((f) => f && typeof f.label === "string" && f.label.trim())
        .slice(0, 69)
        .map((f, i) => ({ key: `F${i}`, label: String(f.label).trim().slice(0, 60) }));
      return list.length ? list : undefined;
    }
  }
}

export function sanitizeDetails(
  raw: unknown,
  piece: { kind: string; traction: string | null; system: string | null },
): ItemDetails {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const tractor = piece.kind === "locomotora" || piece.kind === "automotor";
  const rolling = piece.kind === "coche" || piece.kind === "vagon";

  const allowed = new Set<keyof ItemDetails>(ALWAYS);
  if (tractor && piece.traction) {
    TRACTOR.forEach((k) => allowed.add(k));
    (BY_TRACTION[piece.traction] ?? []).forEach((k) => allowed.add(k));
  }
  if (piece.kind === "automotor") allowed.add("units");
  if (rolling) ROLLING.forEach((k) => allowed.add(k));
  if (tractor && piece.system === "digital") DIGITAL.forEach((k) => allowed.add(k));
  if (tractor && piece.system === "analogico") ANALOGUE.forEach((k) => allowed.add(k));

  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = clean(SPEC[key], input[key]);
    if (value === undefined) continue;
    const options = ENUMS[key];
    if (options && !options.includes(value as string)) continue;
    out[key] = value;
  }
  // A speaker or an interface only means something when the toggle above it is on.
  if (!out.sound) delete out.speaker;
  if (!out.digitalReady) delete out.interface;
  return out as ItemDetails;
}
