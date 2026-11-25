"use client";

import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Kind } from "@/lib/catalog";
import { PhotoBox, ScaleBadge, btn, field } from "@/components/ui";
import {
  addToComposition,
  deleteComposition,
  removeFromComposition,
  renameComposition,
  reorderComposition,
} from "../actions";

export type Member = { id: string; name: string; kind: Kind; scale: string; ref: string; cover?: string };

export function CompositionHeader({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {editing ? (
        <form
          className="flex flex-1 gap-2"
          action={(fd) => start(async () => { await renameComposition(id, String(fd.get("name") ?? "")); setEditing(false); })}
        >
          <input name="name" defaultValue={name} aria-label="Nombre" className={`${field} max-w-md text-[20px]`} autoFocus maxLength={120} />
          <button className={btn.primary} disabled={pending}>Guardar</button>
          <button type="button" onClick={() => setEditing(false)} className={btn.ghost}>Cancelar</button>
        </form>
      ) : (
        <>
          <h1 className="font-display text-[34px] font-bold tracking-tight">{name}</h1>
          <button onClick={() => setEditing(true)} className={btn.ghost} aria-label="Cambiar nombre">
            <Pencil className="h-4 w-4" />
          </button>
        </>
      )}
      <button onClick={() => dialog.current?.showModal()} className={`${btn.danger} ml-auto`}>
        <Trash2 className="h-[18px] w-[18px]" /> Eliminar
      </button>
      <dialog ref={dialog} className="m-auto w-[min(420px,calc(100%-32px))] rounded-xl border border-ln2 bg-s1 p-6 text-fg backdrop:bg-black/60">
        <h2 className="font-display text-2xl font-bold">¿Eliminar la composición?</h2>
        <p className="mt-2 text-fg2">Se borra solo la composición. Las piezas siguen en tu colección.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => dialog.current?.close()} className={btn.secondary}>Cancelar</button>
          <button onClick={() => start(() => deleteComposition(id))} disabled={pending} className={btn.danger}>Sí, eliminar</button>
        </div>
      </dialog>
    </div>
  );
}

export function Train({ id, members, available }: { id: string; members: Member[]; available: { id: string; label: string }[] }) {
  const [list, setList] = useOptimistic(members);
  const [pending, start] = useTransition();
  const [toAdd, setToAdd] = useState("");

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    start(async () => {
      setList(next);
      await reorderComposition(id, next.map((x) => x.id));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-ln bg-s1 p-4">
        {list.length === 0 ? (
          <p className="py-8 text-center text-fg3">Añade la locomotora y los coches de este tren.</p>
        ) : (
          <ol className="flex min-w-max items-end gap-1.5" aria-label="Orden del tren, de cabeza a cola">
            {list.map((m, i) => (
              <li key={m.id} className="w-[180px] flex-none">
                <Link href={`/coleccion/${m.id}`} className="block overflow-hidden rounded-lg border border-ln hover:border-ln2">
                  <div className="relative aspect-[16/9]">
                    <PhotoBox src={m.cover} alt={m.name} kind={m.kind} />
                    <span className="absolute left-1.5 top-1.5 rounded bg-bg/80 px-1.5 font-mono text-[12px]">{i + 1}</span>
                  </div>
                </Link>
                <p className="mt-1.5 truncate text-[15px] font-semibold">{m.name}</p>
                <p className="flex items-center gap-1.5 truncate font-mono text-[12px] text-fg3">
                  <ScaleBadge scale={m.scale} /> {m.ref}
                </p>
                <div className="mt-1.5 flex gap-1">
                  <button onClick={() => move(i, i - 1)} disabled={i === 0 || pending} aria-label={`Mover ${m.name} hacia la cabeza`} className="flex h-9 flex-1 items-center justify-center rounded-md border border-ln2 text-fg2 hover:text-fg disabled:opacity-30">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(i, i + 1)} disabled={i === list.length - 1 || pending} aria-label={`Mover ${m.name} hacia la cola`} className="flex h-9 flex-1 items-center justify-center rounded-md border border-ln2 text-fg2 hover:text-fg disabled:opacity-30">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => start(async () => { setList(list.filter((x) => x.id !== m.id)); await removeFromComposition(id, m.id); })}
                    disabled={pending}
                    aria-label={`Quitar ${m.name} del tren`}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-ln2 text-fg3 hover:text-red"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 h-1.5 rounded-full bg-[repeating-linear-gradient(90deg,var(--rail)_0_6px,transparent_6px_12px)]" aria-hidden />
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        action={() => start(async () => { await addToComposition(id, toAdd); setToAdd(""); })}
      >
        <select aria-label="Pieza para añadir" value={toAdd} onChange={(e) => setToAdd(e.target.value)} className={`${field} sm:max-w-md`}>
          <option value="">{available.length ? "Elige una pieza de tu colección…" : "No quedan piezas por añadir"}</option>
          {available.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <button className={btn.primary} disabled={!toAdd || pending}>
          <Plus className="h-[18px] w-[18px]" /> Añadir al final
        </button>
      </form>
    </div>
  );
}
