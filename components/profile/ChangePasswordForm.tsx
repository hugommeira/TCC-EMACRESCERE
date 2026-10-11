"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { apiFetch } from "@/lib/api-client";
import { Field, fieldErrorsFrom, inputCls, useSaveState, type FieldErrors } from "./fields";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

/** Troca de senha. Conta só com Google não tem senha: mostra um aviso no lugar. */
export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [show,   setShow]   = useState(false);
  const save = useSaveState();

  if (!hasPassword) {
    return (
      <p className="text-sm text-slate-600">
        Você entra com a conta Google, então não há senha para trocar aqui. Se quiser
        também entrar com e-mail e senha, use{" "}
        <Link href={"/auth/forgot-password" as Route} className="font-semibold text-brand-700 hover:underline">
          Esqueci minha senha
        </Link>.
      </p>
    );
  }

  const filled = values.currentPassword && values.newPassword && values.confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (values.newPassword !== values.confirmPassword) {
      setErrors({ confirmPassword: "As senhas não conferem" });
      return;
    }
    save.start();
    try {
      await apiFetch("/api/profile/password", { method: "POST", body: values });
      setValues(EMPTY);
      save.done();
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      save.fail(err);
    }
  }

  const input = (k: keyof typeof EMPTY, id: string, autoComplete: string) => (
    <input
      id={id}
      type={show ? "text" : "password"}
      autoComplete={autoComplete}
      value={values[k]}
      maxLength={128}
      onChange={(e) => { setValues((v) => ({ ...v, [k]: e.target.value })); if (save.state.kind !== "saving") save.reset(); }}
      aria-invalid={Boolean(errors[k])}
      className={inputCls}
    />
  );

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-3">
      <Field label="Senha atual" htmlFor="pw-current" error={errors["currentPassword"]}>
        {input("currentPassword", "pw-current", "current-password")}
      </Field>
      <Field label="Nova senha" htmlFor="pw-new" error={errors["newPassword"]} hint="Mínimo 8 caracteres, com uma letra maiúscula e um número.">
        {input("newPassword", "pw-new", "new-password")}
      </Field>
      <Field label="Confirme a nova senha" htmlFor="pw-confirm" error={errors["confirmPassword"]}>
        {input("confirmPassword", "pw-confirm", "new-password")}
      </Field>

      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
        Mostrar senhas
      </label>

      <p role="status" aria-live="polite" className="text-xs">
        {save.state.kind === "saved" && <span className="font-medium text-emerald-700">✓ Senha alterada. Use a nova senha no próximo login.</span>}
        {save.state.kind === "error" && !Object.values(errors).some(Boolean) && (
          <span className="font-medium text-red-600">{save.state.msg}</span>
        )}
      </p>

      <button
        type="submit"
        disabled={!filled || save.saving}
        className="w-full cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {save.saving ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}
