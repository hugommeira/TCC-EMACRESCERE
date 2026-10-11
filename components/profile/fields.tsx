"use client";

import { useState } from "react";
import { ApiError, mensagemDeErro } from "@/lib/api-client";

// Peças comuns dos formulários do perfil (paciente e médico).

export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:bg-slate-50 disabled:text-slate-500";

export function Field({
  label, htmlFor, error, hint, children, className = "",
}: {
  label: string; htmlFor: string; error?: string | undefined; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={`mb-1 block text-xs font-semibold ${error ? "text-red-600" : "text-slate-600"}`}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

/** (11) 98765-4321 enquanto digita; a API recebe só os dígitos. */
export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2)  return d.length ? `(${d}` : "";
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export type FieldErrors = Record<string, string | undefined>;

/** Erros por campo vindos da API (422 do zod) → primeiro texto de cada campo. */
export function fieldErrorsFrom(err: unknown): FieldErrors {
  if (!(err instanceof ApiError)) return {};
  const out: FieldErrors = {};
  for (const [k, v] of Object.entries(err.fieldErrors)) out[k] = v?.[0];
  return out;
}

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: Date } | { kind: "error"; msg: string };

/** Estado de "Salvar" com mensagem de sucesso/erro. */
export function useSaveState() {
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  return {
    state,
    saving: state.kind === "saving",
    start:  () => setState({ kind: "saving" }),
    done:   () => setState({ kind: "saved", at: new Date() }),
    fail:   (err: unknown) => setState({ kind: "error", msg: mensagemDeErro(err) }),
    reset:  () => setState({ kind: "idle" }),
  };
}

export function SaveBar({
  state, dirty, label = "Salvar alterações", onCancel,
}: {
  state: SaveState; dirty: boolean; label?: string; onCancel?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
      <p role="status" aria-live="polite" className="mr-auto text-xs">
        {state.kind === "error" && <span className="font-medium text-red-600">{state.msg}</span>}
        {state.kind === "saved" && !dirty && (
          <span className="text-emerald-700">
            ✓ Salvo às {state.at.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {dirty && state.kind !== "error" && state.kind !== "saving" && (
          <span className="text-amber-700">Alterações não salvas</span>
        )}
      </p>
      {onCancel && dirty && (
        <button
          type="button"
          onClick={onCancel}
          disabled={state.kind === "saving"}
          className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
        >
          Desfazer
        </button>
      )}
      <button
        type="submit"
        disabled={!dirty || state.kind === "saving"}
        className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {state.kind === "saving" ? "Salvando..." : label}
      </button>
    </div>
  );
}

/** Lista editável de itens curtos (alergias, medicamentos). */
export function TagInput({
  id, values, onChange, placeholder, emptyText,
}: {
  id: string; values: string[]; onChange: (v: string[]) => void; placeholder: string; emptyText: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v.slice(0, 80)]);
    setDraft("");
  }

  return (
    <div>
      {values.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li key={v} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`Remover ${v}`}
                className="cursor-pointer rounded-full p-0.5 text-brand-600 hover:bg-brand-100"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-xs italic text-slate-400">{emptyText}</p>
      )}
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={draft}
          maxLength={80}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="flex-none cursor-pointer rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
