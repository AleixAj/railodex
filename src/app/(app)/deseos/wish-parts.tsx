"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Check, ClipboardCopy, PackageCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { KINDS, MANUFACTURERS, RAILWAYS, SCALES } from "@/lib/catalog";
import { btn, field, Label } from "@/components/ui";
import { deleteWish, saveWish, wishToCollection, type WishState } from "./actions";

export type Wish = {
  id: string;
  name: string;
  kind: string | null;
  manufacturer: string | null;
  catalog_ref: string | null;
  scale: string | null;
  railway: string | null;
  priority: number;
  target_price: number | null;
  shop: string | null;
  url: string | null;
  status: "deseo" | "reservada";
  deposit: number | null;
  expected_date: string | null;
  notes: string | null;
};

export function WishDialog({ wish, trigger }: { wish?: Wish; trigger: "nuevo" | "editar" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"deseo" | "reservada">(wish?.status ?? "deseo");
  const [state, action, pending] = useActionState<WishState, FormData>(async (prev, fd) => {
    const res = await saveWish(prev, fd);
    if (res.ok) dialog.current?.close();
    return res;
  }, {});

  return (
    <>
      {trigger === "nuevo" ? (
        <button onClick={() => dialog.current?.showModal()} className={btn.primary}>
          <Plus className="h-[18px] w-[18px]" /> Añadir deseo
        </button>
      ) : (
        <button onClick={() => dialog.current?.showModal()} className="rounded-md p-2 text-fg3 hover:bg-s2 hover:text-fg" aria-label={`Editar ${wish?.name}`}>
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <dialog ref={dialog} className="m-auto max-h-[90dvh] w-[min(640px,calc(100%-24px))] overflow-y-auto rounded-xl border border-ln2 bg-s1 p-5 text-fg backdrop:bg-black/60 sm:p-6">
        <form action={action} className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-bold">{wish ? "Editar deseo" : "Nuevo deseo"}</h2>
          {wish && <input type="hidden" name="id" value={wish.id} />}
          <div>
            <Label htmlFor="w-name" hint="obligatorio">¿Qué pieza quieres?</Label>
            <input id="w-name" name="name" required defaultValue={wish?.name} className={field} placeholder="p. ej. RENFE 333.3 «Faraona»" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="w-mf">Fabricante</Label>
              <input id="w-mf" name="manufacturer" list="w-mfs" defaultValue={wish?.manufacturer ?? ""} className={field} />
              <datalist id="w-mfs">{MANUFACTURERS.map((m) => <option key={m} value={m} />)}</datalist>
            </div>
            <div>
              <Label htmlFor="w-ref">Referencia</Label>
              <input id="w-ref" name="catalog_ref" defaultValue={wish?.catalog_ref ?? ""} className={`${field} font-mono`} />
            </div>
            <div>
              <Label htmlFor="w-kind">Tipo</Label>
              <select id="w-kind" name="kind" defaultValue={wish?.kind ?? ""} className={field}>
                <option value="">Sin indicar</option>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="w-scale">Escala</Label>
              <select id="w-scale" name="scale" defaultValue={wish?.scale ?? ""} className={field}>
                <option value="">Sin indicar</option>
                {SCALES.map((s) => <option key={s.id} value={s.id}>{s.label} · {s.ratio}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="w-rw">Compañía</Label>
              <input id="w-rw" name="railway" list="w-rws" defaultValue={wish?.railway ?? ""} className={field} />
              <datalist id="w-rws">{RAILWAYS.map((r) => <option key={r} value={r} />)}</datalist>
            </div>
            <div>
              <Label htmlFor="w-prio">Prioridad</Label>
              <select id="w-prio" name="priority" defaultValue={String(wish?.priority ?? 2)} className={field}>
                <option value="1">Alta</option>
                <option value="2">Media</option>
                <option value="3">Baja</option>
              </select>
            </div>
            <div>
              <Label htmlFor="w-price">Precio objetivo (€)</Label>
              <input id="w-price" name="target_price" inputMode="decimal" defaultValue={wish?.target_price ?? ""} className={field} />
            </div>
            <div>
              <Label htmlFor="w-shop">Tienda</Label>
              <input id="w-shop" name="shop" defaultValue={wish?.shop ?? ""} className={field} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="w-url">Enlace</Label>
              <input id="w-url" name="url" type="url" defaultValue={wish?.url ?? ""} className={field} placeholder="https://…" />
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <input type="hidden" name="status" value={status} />
            <div className="flex gap-2" role="radiogroup">
              {(["deseo", "reservada"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={`h-10 rounded-full border px-3.5 text-[15px] ${status === s ? "border-amb bg-amb2 text-ambtx" : "border-ln2 bg-s3 text-fg2"}`}
                >
                  {s === "deseo" ? "La quiero" : "Reservada / preventa"}
                </button>
              ))}
            </div>
          </div>
          {status === "reservada" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="w-dep">Señal pagada (€)</Label>
                <input id="w-dep" name="deposit" inputMode="decimal" defaultValue={wish?.deposit ?? ""} className={field} />
              </div>
              <div>
                <Label htmlFor="w-date">Llegada prevista</Label>
                <input id="w-date" name="expected_date" type="date" defaultValue={wish?.expected_date ?? ""} className={field} />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="w-notes">Notas</Label>
            <input id="w-notes" name="notes" defaultValue={wish?.notes ?? ""} className={field} />
          </div>

          {state.error && <p role="alert" className="text-red">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => dialog.current?.close()} className={btn.secondary}>Cancelar</button>
            <button className={btn.primary} disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function WishActions({ wish }: { wish: Wish }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          onClick={() => start(async () => { const r = await wishToCollection(wish.id); if (r?.error) setError(r.error); })}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-grn/40 bg-grn2 px-2.5 text-[14px] font-medium text-grn hover:brightness-110"
          title="Pasar a la colección"
        >
          <PackageCheck className="h-4 w-4" /> <span className="hidden sm:inline">Ya la tengo</span>
        </button>
        <WishDialog wish={wish} trigger="editar" />
        <button
          onClick={() => start(() => deleteWish(wish.id))}
          disabled={pending}
          aria-label={`Borrar ${wish.name}`}
          className="rounded-md p-2 text-fg3 hover:bg-s2 hover:text-red"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="max-w-[260px] text-right text-[13px] text-red">{error}</p>}
    </div>
  );
}

/** Copies the list as plain text, handy for a swap meet or to send to someone. */
export function CopyListButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          setDone(false);
        }
      }}
      className={btn.secondary}
    >
      {done ? <Check className="h-[18px] w-[18px] text-grn" /> : <ClipboardCopy className="h-[18px] w-[18px]" />}
      {done ? "Copiada" : "Copiar lista"}
    </button>
  );
}
