import type { Kind, Traction } from "./catalog";

/** Fields that depend on the kind of piece. Stored in items.details (jsonb). */
export type ItemDetails = {
  // Traction
  wheelArrangement?: string;
  tender?: boolean;
  smokeGenerator?: boolean;
  transmission?: "electrica" | "hidraulica" | "mecanica";
  pantographs?: number;
  catenaryPickup?: boolean;
  units?: number;
  wagonSubtype?: string;
  interiorLighting?: boolean;
  closeCoupling?: boolean;
  // Digital
  protocol?: string;
  decoderOrigin?: "fabrica" | "instalado";
  decoder?: string;
  sound?: boolean;
  speaker?: string;
  railcom?: boolean;
  firmware?: string;
  functions?: { key: string; label: string }[];
  // Analogue
  current?: "dc" | "ac";
  digitalReady?: boolean;
  interface?: string;
  directionalLights?: boolean;
  // Identification
  livery?: string;
  modelYear?: number;
  ean?: string;
  lengthMm?: number;
  limitedEdition?: string;
  coupler?: string;
  // Purchase
  origin?: string;
  seller?: string;
  hasBox?: boolean;
  hasInstructions?: boolean;
};

export type Item = {
  id: string;
  user_id: string;
  kind: Kind;
  traction: Traction | null;
  system: "digital" | "analogico" | null;
  name: string;
  manufacturer: string;
  catalog_ref: string | null;
  scale: string;
  epoch: string | null;
  railway: string | null;
  road_number: string | null;
  dcc_address: number | null;
  condition: string | null;
  status: string;
  purchase_price: number | null;
  estimated_value: number | null;
  currency: string;
  purchase_date: string | null;
  location: string | null;
  tags: string[];
  notes: string | null;
  details: ItemDetails;
  created_at: string;
  updated_at: string;
};

export type ItemPhoto = { id: string; item_id: string; path: string; position: number };

export type ItemEvent = {
  id: string;
  item_id: string;
  happened_on: string;
  kind: string;
  title: string;
  cost: number | null;
  notes: string | null;
};
