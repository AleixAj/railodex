"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Plus, TrainTrack, Trash2, X } from "lucide-react";
import { addToComposition } from "@/app/(app)/composiciones/actions";
import { EVENT_KINDS, STATUSES } from "@/lib/catalog";
import { todayISO } from "@/lib/dates";
import type { Kind } from "@/lib/catalog";
import { PhotoBox, btn, field, Label } from "@/components/ui";
import { addEvent, deleteEvent, deleteItem, setStatus, type EventState } from "./actions";

export function Gallery({ urls, name, kind }: { urls: string[]; name: string; kind: Kind }) {
  const [i, setI] = useState(0);
  const n = urls.length;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-ln bg-s1">
        <PhotoBox src={urls[i]} alt={`${name}, foto ${i + 1}`} kind={kind} />
        {n > 1 && (
          <>
            <button onClick={() => setI((i - 1 + n) % n)} aria-label="Foto anterior" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ln2 bg-bg/80 backdrop-blur">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setI((i + 1) % n)} aria-label="Foto siguiente" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ln2 bg-bg/80 backdrop-blur">
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-md bg-bg/80 px-2 py-0.5 font-mono text-[13px]">{i + 1} / {n}</span>
          </>
        )}
        {n === 0 && <span className="absolute bottom-3 left-3 font-mono text-[12px] tracking-[0.06em] text-fg3">SIN FOTOS · AÑÁDELAS AL EDITAR</span>}
      </div>
      {n > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {urls.map((u, idx) => (
            <button key={u} onClick={() => setI(idx)} aria-label={`Ver foto ${idx + 1}`} className={`aspect-[4/3] overflow-hidden rounded-lg border ${idx === i ? "border-amb" : "border-ln"}`}>
              <PhotoBox src={u} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatusSelect({ itemId, status }: { itemId: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Estado de la pieza"
      value={status}
      disabled={pending}
      onChange={(e) => start(() => setStatus(itemId, e.target.value))}
      className="h-9 rounded-lg border border-ln2 bg-s1 px-2 text-[14px]"
    >
      {STATUSES.map((s) => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  );
}

export function DeleteItemButton({ itemId, name }: { itemId: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <button onClick={() => dialog.current?.showModal()} className={btn.danger}>
        <Trash2 className="h-[18px] w-[18px]" /> Eliminar
      </button>
      <dialog ref={dialog} className="m-auto w-[min(440px,calc(100%-32px))] rounded-xl border border-ln2 bg-s1 p-6 text-fg backdrop:bg-black/60">
        <h2 className="font-display text-2xl font-bold">¿Eliminar esta pieza?</h2>
        <p className="mt-2 text-fg2">
          Se borrarán <strong className="text-fg">{name}</strong>, sus fotos y su historial. No se puede deshacer.
          Si la has vendido, mejor cambia su estado a «Vendida».
        </p>
        {error && <p className="mt-3 text-red">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => dialog.current?.close()} className={btn.secondary}>Cancelar</button>
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await deleteItem(itemId);
                if (res?.error) setError(res.error);
              })
            }
            className={btn.danger}
          >
            {pending ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </dialog>
    </>
  );
}

export function AddEventForm({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<EventState, FormData>(async (prev, formData) => {
    const res = await addEvent(itemId, prev, formData);
    if (res.ok) setOpen(false);
    return res;
  }, {});

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${btn.secondary} h-10 text-[15px]`}>
        <Plus className="h-4 w-4" /> Añadir
      </button>
    );
  }
  return (
    <form action={action} className="mt-3 flex w-full flex-col gap-3 rounded-lg border border-ln bg-s3 p-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Nueva entrada</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded p-1 text-fg3 hover:text-fg"><X className="h-4 w-4" /></button>
      </div>
      <div>
        <Label htmlFor="ev-title">¿Qué se ha hecho?</Label>
        <input id="ev-title" name="title" required className={field} placeholder="Limpieza de ruedas y engrase" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="ev-kind">Tipo</Label>
          <select id="ev-kind" name="kind" className={field}>
            {EVENT_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="ev-date">Fecha</Label>
          <input id="ev-date" name="happened_on" type="date" className={field} defaultValue={todayISO()} />
        </div>
        <div>
          <Label htmlFor="ev-cost">Coste €</Label>
          <input id="ev-cost" name="cost" inputMode="decimal" className={field} placeholder="0" />
        </div>
      </div>
      <div>
        <Label htmlFor="ev-notes">Notas</Label>
        <input id="ev-notes" name="notes" className={field} placeholder="Opcional" />
      </div>
      {state.error && <p className="text-red">{state.error}</p>}
      <button className={btn.primary} disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
    </form>
  );
}

/** Lists your trains and adds this piece to the end of the one you pick. */
export function CompositionPicker({ itemId, compositions }: { itemId: string; compositions: { id: string; name: string; member: boolean }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [added, setAdded] = useState<string[]>([]);

  return (
    <>
      <button onClick={() => dialog.current?.showModal()} className={btn.secondary}>
        <TrainTrack className="h-[18px] w-[18px]" /> Añadir a composición
      </button>
      <dialog ref={dialog} className="m-auto w-[min(420px,calc(100%-32px))] rounded-xl border border-ln2 bg-s1 p-5 text-fg backdrop:bg-black/60">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Añadir a composición</h2>
          <button onClick={() => dialog.current?.close()} aria-label="Cerrar" className="rounded p-1 text-fg3 hover:text-fg"><X className="h-5 w-5" /></button>
        </div>
        {compositions.length === 0 ? (
          <p className="mt-3 text-fg2">
            Aún no tienes composiciones. <Link href="/composiciones" className="text-ambtx underline">Crea una</Link>.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
            {compositions.map((c) => {
              const inside = c.member || added.includes(c.id);
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-ln px-3 py-2">
                  <Link href={`/composiciones/${c.id}`} className="truncate hover:text-ambtx">{c.name}</Link>
                  {inside ? (
                    <span className="flex items-center gap-1 text-[14px] text-grn"><Check className="h-4 w-4" /> Dentro</span>
                  ) : (
                    <button
                      disabled={pending}
                      onClick={() => start(async () => { await addToComposition(c.id, itemId); setAdded((a) => [...a, c.id]); })}
                      className="rounded-md border border-ln2 px-2.5 py-1 text-[14px] hover:border-amb hover:text-ambtx"
                    >
                      Añadir
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </dialog>
    </>
  );
}

export function DeleteEventButton({ itemId, eventId }: { itemId: string; eventId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => deleteEvent(itemId, eventId))}
      aria-label="Borrar entrada"
      className="rounded p-1.5 text-fg3 hover:bg-s2 hover:text-red"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
