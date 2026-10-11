"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Modal } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api-client";
import { Field, fieldErrorsFrom, inputCls, useSaveState, type FieldErrors } from "./fields";

/** Exportar os próprios dados e desativar a conta (direitos do titular, LGPD). */
export function PrivacyCard({ hasPassword, isDoctor }: { hasPassword: boolean; isDoctor: boolean }) {
  const [open,     setOpen]     = useState(false);
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [errors,   setErrors]   = useState<FieldErrors>({});
  const save = useSaveState();

  const ready = hasPassword ? password.length > 0 : confirm.trim().toUpperCase() === "DESATIVAR";

  async function deactivate(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setErrors({});
    save.start();
    try {
      await apiFetch("/api/profile/deactivate", {
        method: "POST",
        body:   hasPassword ? { password } : { confirm },
      });
      await signOut({ callbackUrl: "/auth/login" });
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      save.fail(err);
    }
  }

  function close() {
    if (save.saving) return;
    setOpen(false);
    setPassword("");
    setConfirm("");
    setErrors({});
    save.reset();
  }

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-medium text-slate-900">Baixar meus dados</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {isDoctor
            ? "Seu cadastro, formação, agenda e o resumo da sua atuação, em um arquivo JSON."
            : "Cadastro, saúde, consultas, receitas, pesagens e mensagens, em um arquivo JSON."}
        </p>
        <a
          href="/api/profile/export"
          download
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 4v12M6 10l6 6 6-6M5 20h14" />
          </svg>
          Baixar arquivo
        </a>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="font-medium text-slate-900">Desativar conta</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Você deixa de conseguir entrar. Prontuários e receitas continuam guardados, como a lei exige
          (20 anos). Para voltar, fale com o suporte.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 cursor-pointer rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          Desativar minha conta
        </button>
      </div>

      <Modal open={open} onClose={close} title="Desativar conta" size="sm">
        <form onSubmit={(e) => void deactivate(e)} noValidate className="space-y-4">
          <p className="text-sm text-slate-600">
            {isDoctor
              ? "Você sai da lista de médicos e não consegue mais entrar. Consultas marcadas precisam ser concluídas ou canceladas antes."
              : "Você não consegue mais entrar. Consultas marcadas precisam ser concluídas ou canceladas antes."}
          </p>
          {hasPassword ? (
            <Field label="Digite sua senha para confirmar" htmlFor="da-pass" error={errors["password"]}>
              <input
                id="da-pass" type="password" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </Field>
          ) : (
            <Field label='Digite "DESATIVAR" para confirmar' htmlFor="da-confirm" error={errors["confirm"]}>
              <input
                id="da-confirm" type="text" autoComplete="off"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
              />
            </Field>
          )}
          {save.state.kind === "error" && !Object.values(errors).some(Boolean) && (
            <p role="alert" className="text-xs font-medium text-red-600">{save.state.msg}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button" onClick={close} disabled={save.saving}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={!ready || save.saving}
              className="cursor-pointer rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {save.saving ? "Desativando..." : "Desativar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
