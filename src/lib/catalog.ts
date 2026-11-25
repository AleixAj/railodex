// Listas de opciones de la app. Si hace falta un fabricante o rodaje nuevo, se añade aquí.

export const KINDS = [
  { id: "locomotora", label: "Locomotora", hint: "Vapor, diésel, eléctrica", icon: "TrainFront" },
  { id: "automotor", label: "Automotor / unidad múltiple", hint: "Ferrobús, TER, Schienenbus", icon: "TramFront" },
  { id: "coche", label: "Coche de viajeros", hint: "Talgo, Silberling, coche cama", icon: "Armchair" },
  { id: "vagon", label: "Vagón de mercancías", hint: "Tolva, cisterna, plataforma", icon: "Container" },
  { id: "accesorio", label: "Accesorio", hint: "Vías, edificios, señales, figuras", icon: "Signpost" },
] as const;
export type Kind = (typeof KINDS)[number]["id"];

export const TRACTIONS = [
  { id: "vapor", label: "Vapor" },
  { id: "diesel", label: "Diésel" },
  { id: "electrica", label: "Eléctrica" },
  { id: "hibrida", label: "Híbrida / otra" },
] as const;
export type Traction = (typeof TRACTIONS)[number]["id"];

/** Rodajes en notación UIC, con su equivalencia (Whyte para vapor, AAR para el resto). */
export const WHEEL_ARRANGEMENTS: Record<Traction, { uic: string; alt?: string }[]> = {
  vapor: [
    { uic: "B", alt: "0-4-0" },
    { uic: "C", alt: "0-6-0" },
    { uic: "D", alt: "0-8-0" },
    { uic: "E", alt: "0-10-0" },
    { uic: "1'C", alt: "2-6-0" },
    { uic: "1'D", alt: "2-8-0" },
    { uic: "1'E", alt: "2-10-0" },
    { uic: "2'C", alt: "4-6-0" },
    { uic: "2'D", alt: "4-8-0" },
    { uic: "1'C1'", alt: "2-6-2" },
    { uic: "1'D1'", alt: "2-8-2" },
    { uic: "2'C1'", alt: "4-6-2" },
    { uic: "2'D1'", alt: "4-8-2" },
    { uic: "1'D2'", alt: "2-8-4" },
    { uic: "2'D2'", alt: "4-8-4" },
  ],
  diesel: [
    { uic: "B", alt: "B" },
    { uic: "C", alt: "C" },
    { uic: "Bo'Bo'", alt: "B-B" },
    { uic: "B'B'", alt: "B-B" },
    { uic: "Co'Co'", alt: "C-C" },
    { uic: "C'C'", alt: "C-C" },
    { uic: "A1A'A1A'", alt: "A1A-A1A" },
    { uic: "1'Co'Co'1'", alt: "1-C-C-1" },
  ],
  electrica: [
    { uic: "Bo'Bo'", alt: "B-B" },
    { uic: "B'B'", alt: "B-B" },
    { uic: "Co'Co'", alt: "C-C" },
    { uic: "B'B'B'", alt: "B-B-B" },
    { uic: "Bo'Bo'Bo'", alt: "B-B-B" },
    { uic: "1'Do1'", alt: "1-D-1" },
    { uic: "1'C'C1'", alt: "1-C-C-1" },
  ],
  hibrida: [
    { uic: "Bo'Bo'", alt: "B-B" },
    { uic: "Co'Co'", alt: "C-C" },
  ],
};

export const SCALES = [
  { id: "H0", label: "H0", ratio: "1:87", gauge: "16,5 mm", color: "var(--sc-h0)" },
  { id: "N", label: "N", ratio: "1:160", gauge: "9 mm", color: "var(--sc-n)" },
  { id: "TT", label: "TT", ratio: "1:120", gauge: "12 mm", color: "var(--sc-tt)" },
  { id: "Z", label: "Z", ratio: "1:220", gauge: "6,5 mm", color: "var(--sc-z)" },
  { id: "0", label: "0", ratio: "1:43,5", gauge: "32 mm", color: "var(--sc-0)" },
  { id: "1", label: "1", ratio: "1:32", gauge: "45 mm", color: "var(--sc-1)" },
  { id: "G", label: "G", ratio: "1:22,5", gauge: "45 mm", color: "var(--sc-g)" },
  { id: "H0m", label: "H0m", ratio: "1:87", gauge: "12 mm", color: "var(--sc-h0)" },
  { id: "H0e", label: "H0e", ratio: "1:87", gauge: "9 mm", color: "var(--sc-h0)" },
] as const;

export const EPOCHS = ["I", "II", "III", "IV", "V", "VI"] as const;

export const MANUFACTURERS = [
  "Märklin", "Trix", "Minitrix", "Roco", "Fleischmann", "Piko", "Arnold", "Electrotren", "Ibertren", "Mabar",
  "Rivarossi", "Lima", "Jouef", "ACME", "Os.Kar", "ESU", "Brawa", "Liliput", "LS Models", "Sudexpress",
  "Hornby", "Bachmann", "Dapol", "Kato", "Tomix", "Mehano", "Tillig", "Hobbytrain", "Kühn", "LGB",
  "Atlas", "Athearn", "Walthers", "Lionel", "MTH", "Otro",
] as const;

export const RAILWAYS = [
  "RENFE", "Renfe Operadora", "FEVE", "FGC", "Euskotren", "CP", "DB", "DB AG", "DR", "SNCF", "FS", "SBB",
  "ÖBB", "NS", "SNCB", "CFL", "ČSD", "PKP", "BR", "Privada", "Otra",
] as const;

export const WAGON_SUBTYPES = {
  coche: ["Primera", "Segunda", "Mixto", "Cafetería", "Restaurante", "Coche cama", "Litera", "Furgón", "Furgón generador", "Panorámico"],
  vagon: ["Cerrado", "Tolva", "Plataforma", "Cisterna", "Frigorífico", "Portacontenedores", "Portacoches", "Bordes altos", "Jaula", "Grúa / servicio"],
} as const;

export const PROTOCOLS = ["DCC", "mfx", "Motorola", "Selectrix", "Multiprotocolo"] as const;

export const DECODER_BRANDS = [
  "ESU LokSound 5", "ESU LokPilot 5", "Zimo MX", "Zimo MS", "Märklin mLD3", "Märklin mSD3",
  "Doehler & Haass", "Lenz", "Uhlenbrock", "Piko SmartDecoder", "Roco", "TCS", "Digitrax", "Otro",
] as const;

export const INTERFACES = ["NEM 651", "NEM 652", "PluX12", "PluX16", "PluX22", "Next18", "21MTC", "Sin interfaz"] as const;

export const ORIGINS = [
  { id: "tienda", label: "Tienda física" },
  { id: "online", label: "Tienda online" },
  { id: "segunda_mano", label: "Segunda mano" },
  { id: "feria", label: "Feria / bolsa" },
  { id: "subasta", label: "Subasta" },
  { id: "regalo", label: "Regalo" },
  { id: "herencia", label: "Herencia" },
] as const;

export const CONDITIONS = [
  { id: "nuevo", label: "Nuevo" },
  { id: "como_nuevo", label: "Como nuevo" },
  { id: "usado", label: "Usado" },
  { id: "para_reparar", label: "Para reparar" },
  { id: "para_piezas", label: "Para piezas" },
] as const;

export const STATUSES = [
  { id: "coleccion", label: "En mi colección" },
  { id: "preventa", label: "Reservada / preventa" },
  { id: "prestada", label: "Prestada" },
  { id: "vendida", label: "Vendida" },
] as const;

export const EVENT_KINDS = [
  { id: "mantenimiento", label: "Mantenimiento" },
  { id: "reparacion", label: "Reparación" },
  { id: "digitalizacion", label: "Digitalización" },
  { id: "ubicacion", label: "Ubicación" },
  { id: "otro", label: "Otro" },
] as const;

export const COUPLERS = ["NEM 362", "NEM 362 con cinemática", "Märklin Relex", "Kadee", "Rapido", "Tornillo", "Otro"] as const;

export const DEFAULT_FUNCTIONS: { key: string; label: string }[] = [
  { key: "F0", label: "Luces" },
  { key: "F1", label: "Sonido motor" },
  { key: "F2", label: "Bocina larga" },
  { key: "F3", label: "Bocina corta" },
  { key: "F4", label: "Compresor" },
];

export const FREE_PLAN_LIMIT = 100;

export function labelOf<T extends { id: string; label: string }>(list: readonly T[], id?: string | null) {
  return list.find((x) => x.id === id)?.label ?? id ?? "";
}

export function scaleInfo(id?: string | null) {
  return SCALES.find((s) => s.id === id);
}
