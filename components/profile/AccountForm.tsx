"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import { Field, SaveBar, fieldErrorsFrom, inputCls, maskPhone, useSaveState, type FieldErrors } from "./fields";

/** Nome e telefone (paciente e médico). E-mail aparece, mas não muda aqui. */
export function AccountForm({
  initial,
}: {
  initial: { name: string; phone: string | null; email: string };
}) {
  const router = useRouter();
  const { update } = useSession();
  const [saved,  setSaved]  = useState({ name: initial.name, phone: maskPhone(initial.phone ?? "") });
  const [values, setValues] = useState(saved);
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = useSaveState();

  const dirty = values.name.trim() !== saved.name || values.phone !== saved.phone;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setErrors({});
    save.start();
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body:   { name: values.name.trim(), phone: values.phone },
      });
      const next = { name: values.name.trim(), phone: values.phone };
      setSaved(next);
      setValues(next);
      save.done();
      // Nome novo no topo da página: renova a sessão e os dados do servidor.
      await update();
      router.refresh();
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      save.fail(err);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome completo" htmlFor="pf-name" error={errors["name"]} className="sm:col-span-2">
          <input
            id="pf-name"
            type="text"
            autoComplete="name"
            value={values.name}
            maxLength={120}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            aria-invalid={Boolean(errors["name"])}
            className={inputCls}
          />
        </Field>
        <Field label="Telefone" htmlFor="pf-phone" error={errors["phone"]} hint="Com DDD. Deixe em branco para remover.">
          <input
            id="pf-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: maskPhone(e.target.value) }))}
            aria-invalid={Boolean(errors["phone"])}
            className={inputCls}
          />
        </Field>
        <Field label="E-mail" htmlFor="pf-email" hint="O e-mail é o seu login e não pode ser trocado aqui.">
          <input id="pf-email" type="email" value={initial.email} disabled className={inputCls} />
        </Field>
      </div>
      <SaveBar state={save.state} dirty={dirty} onCancel={() => { setValues(saved); setErrors({}); save.reset(); }} />
    </form>
  );
}
