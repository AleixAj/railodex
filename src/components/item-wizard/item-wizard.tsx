"use client";

// Add / edit wizard. This file only holds the state, the step list and saving;
// each step's fields live in steps.tsx.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Item, ItemDetails } from "@/lib/types";
import { btn } from "@/components/ui";
import { saveItem, type ItemPayload } from "@/app/(app)/anadir/actions";
import { createClient } from "@/lib/supabase/client";
import { toPayload } from "./payload";
import { syncPhotos } from "./photos";
import { Preview } from "./preview";
import {
  isTractor,
  StepIdentity,
  StepKind,
  StepPhotos,
  StepPurchase,
  StepRolling,
  StepSystem,
  StepTraction,
} from "./steps";

type StepId = "tipo" | "traccion" | "sistema" | "identificacion" | "compra" | "fotos" | "revision";

const STEP_LABELS: Record<StepId, string> = {
  tipo: "Tipo",
  traccion: "Tracción",
  sistema: "Sistema",
  identificacion: "Identificación",
  compra: "Compra y origen",
  fotos: "Fotos y ubicación",
  revision: "Revisión",
};

export type ExistingPhoto = { id: string; path: string; url: string };

type Props = {
  userId: string;
  initial?: Partial<Item>;
  existingPhotos?: ExistingPhoto[];
  addresses: { id: string; name: string; address: number }[];
  mode: "crear" | "editar";
};

export function ItemWizard({ userId, initial, existingPhotos = [], addresses, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ItemPayload>(() => toPayload(initial));
  const [step, setStep] = useState<StepId>(mode === "editar" ? "identificacion" : "tipo");
  const [keptPhotos, setKeptPhotos] = useState(existingPhotos);
  const [newPhotos, setNewPhotos] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();

  const set = <K extends keyof ItemPayload>(key: K, value: ItemPayload[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setD = <K extends keyof ItemDetails>(key: K, value: ItemDetails[K]) =>
    setForm((f) => ({ ...f, details: { ...f.details, [key]: value } }));
  const stepProps = { form, setForm, set, setD };

  // Which steps show up depends on the kind of piece.
  const tractor = isTractor(form.kind);
  const rolling = form.kind === "coche" || form.kind === "vagon";
  const steps = useMemo<StepId[]>(() => {
    const list: StepId[] = ["tipo"];
    if (tractor || rolling) list.push("traccion");
    if (tractor) list.push("sistema");
    list.push("identificacion", "compra", "fotos", "revision");
    return list;
  }, [tractor, rolling]);
  const idx = steps.indexOf(step);

  const missing = [!form.kind && "tipo", !form.manufacturer.trim() && "fabricante", !form.scale && "escala"].filter(Boolean);
  const canSave = missing.length === 0;

  const go = (to: number) => {
    setError("");
    setStep(steps[Math.max(0, Math.min(steps.length - 1, to))]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = (andAnother = false) => {
    if (!canSave) {
      setError(`Faltan datos obligatorios: ${missing.join(", ")}.`);
      setStep(form.kind ? "identificacion" : "tipo");
      return;
    }
    setError("");
    startSaving(async () => {
      const res = await saveItem(form, mode === "editar" ? initial?.id : undefined);
      if (res.error || !res.id) {
        setError(res.error ?? "No se ha podido guardar.");
        return;
      }

      const failed = await syncPhotos(createClient(), {
        userId,
        itemId: res.id,
        before: existingPhotos,
        kept: keptPhotos,
        added: newPhotos.map((p) => p.file),
      });
      newPhotos.forEach((p) => URL.revokeObjectURL(p.url));

      // The piece is already saved, so go to its page even if a photo failed;
      // staying here would create it a second time on the next save.
      if (failed) {
        alert(`La pieza se ha guardado, pero ${failed} foto(s) no se han podido subir. Puedes volver a añadirlas desde Editar.`);
      } else if (andAnother) {
        // Keep the shared fields (type, maker, scale, railway, epoch, purchase) so a set of coaches goes in quickly.
        setForm((f) => ({ ...f, name: "", catalog_ref: "", road_number: "", dcc_address: "", notes: "", details: { ...f.details, ean: undefined } }));
        setNewPhotos([]);
        setKeptPhotos([]);
        setStep("identificacion");
        router.refresh();
        window.scrollTo({ top: 0 });
        return;
      }
      router.push(`/coleccion/${res.id}`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h1 className="font-display text-[34px] font-bold tracking-tight">{mode === "editar" ? "Editar pieza" : "Nueva pieza"}</h1>
        <span className="text-fg3">Solo son obligatorios tipo, fabricante y escala.</span>
      </div>

      <Stepper steps={steps} current={step} onPick={(i) => (form.kind || i === 0 ? go(i) : undefined)} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 rounded-xl border border-ln bg-s1 p-5 sm:p-7">
          <p className="font-mono text-[13px] text-fg3">Paso {idx + 1} de {steps.length}</p>
          <h2 className="mt-1 font-display text-[28px] font-bold tracking-tight">{STEP_LABELS[step]}</h2>

          <div className="mt-5 flex flex-col gap-6">
            {step === "tipo" && <StepKind {...stepProps} />}
            {step === "traccion" && tractor && <StepTraction {...stepProps} />}
            {step === "traccion" && rolling && <StepRolling {...stepProps} />}
            {step === "sistema" && <StepSystem {...stepProps} addresses={addresses} itemId={initial?.id} />}
            {step === "identificacion" && <StepIdentity {...stepProps} />}
            {step === "compra" && <StepPurchase {...stepProps} />}
            {step === "fotos" && (
              <StepPhotos {...stepProps} keptPhotos={keptPhotos} setKeptPhotos={setKeptPhotos} newPhotos={newPhotos} setNewPhotos={setNewPhotos} />
            )}
            {step === "revision" && (
              <>
                <p className="text-fg2">Revisa que todo esté bien. Podrás editarla cuando quieras.</p>
                {!canSave && (
                  <p role="alert" className="rounded-lg border border-red/40 bg-red2 p-3 text-red">
                    Faltan datos obligatorios: {missing.join(", ")}.
                  </p>
                )}
                {mode === "crear" && (
                  <button onClick={() => save(true)} disabled={saving} className={`${btn.secondary} self-start`}>
                    <Plus className="h-4 w-4" /> Guardar y añadir otra parecida
                  </button>
                )}
              </>
            )}

            {error && <p role="alert" className="rounded-lg border border-red/40 bg-red2 p-3 text-red">{error}</p>}
          </div>

          <div className="mt-8 flex items-center justify-between gap-2 border-t border-ln pt-5">
            <button onClick={() => go(idx - 1)} disabled={idx === 0} className={`${btn.ghost} disabled:invisible`}>
              <ChevronLeft className="h-4 w-4" /> Atrás
            </button>
            <div className="flex gap-2">
              {step !== "revision" && canSave && (
                <button onClick={() => save()} disabled={saving} className={btn.secondary}>
                  {saving ? "Guardando…" : "Guardar ya"}
                </button>
              )}
              {step === "revision" ? (
                <button onClick={() => save()} disabled={saving || !canSave} className={btn.primary}>
                  <Check className="h-[18px] w-[18px]" /> {saving ? "Guardando…" : mode === "editar" ? "Guardar cambios" : "Guardar pieza"}
                </button>
              ) : (
                <button onClick={() => go(idx + 1)} disabled={step === "tipo" && !form.kind} className={btn.primary}>
                  Siguiente <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <Preview form={form} cover={keptPhotos[0]?.url ?? newPhotos[0]?.url} />
      </div>
    </div>
  );
}

function Stepper({ steps, current, onPick }: { steps: StepId[]; current: StepId; onPick: (i: number) => void }) {
  const idx = steps.indexOf(current);
  return (
    <ol className="flex gap-1 overflow-x-auto pb-1" aria-label="Pasos">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = s === current;
        return (
          <li key={s} className="flex flex-none items-center">
            <button
              onClick={() => onPick(i)}
              aria-current={active ? "step" : undefined}
              className={`flex h-10 items-center gap-2 rounded-full px-3 text-[15px] ${active ? "bg-amb2 font-semibold text-ambtx" : done ? "text-fg2 hover:bg-s2" : "text-fg3 hover:bg-s2"}`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[12px] ${active ? "bg-amb text-[#1a1714]" : done ? "bg-grn text-[#12110f]" : "border border-ln2"}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {STEP_LABELS[s]}
            </button>
            {i < steps.length - 1 && <span className="mx-1 h-px w-5 bg-ln2" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
