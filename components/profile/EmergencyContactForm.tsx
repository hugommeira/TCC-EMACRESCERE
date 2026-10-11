"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Field, SaveBar, fieldErrorsFrom, inputCls, maskPhone, useSaveState, type FieldErrors } from "./fields";

const RELATIONS = ["Cônjuge", "Pai", "Mãe", "Filho(a)", "Irmão(ã)", "Amigo(a)", "Outro"];

/** Contato de emergência do paciente (o médico da consulta também vê). */
export function EmergencyContactForm({
  initial,
}: {
  initial: { name: string | null; phone: string | null; relation: string | null };
}) {
  const start = { name: initial.name ?? "", phone: maskPhone(initial.phone ?? ""), relation: initial.relation ?? "" };
  const [saved,  setSaved]  = useState(start);
  const [values, setValues] = useState(start);
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = useSaveState();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  const relations = values.relation && !RELATIONS.includes(values.relation) ? [values.relation, ...RELATIONS] : RELATIONS;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setErrors({});
    save.start();
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: {
          emergencyContactName:     values.name,
          emergencyContactPhone:    values.phone,
          emergencyContactRelation: values.relation,
        },
      });
      setSaved(values);
      save.done();
    } catch (err) {
      const fe = fieldErrorsFrom(err);
      setErrors({
        name:     fe["emergencyContactName"],
        phone:    fe["emergencyContactPhone"],
        relation: fe["emergencyContactRelation"],
      });
      save.fail(err);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Nome" htmlFor="ec-name" error={errors["name"]} className="sm:col-span-3">
          <input
            id="ec-name" type="text" maxLength={120} autoComplete="off"
            placeholder="Quem avisar se algo acontecer"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="Telefone" htmlFor="ec-phone" error={errors["phone"]} className="sm:col-span-2">
          <input
            id="ec-phone" type="tel" inputMode="numeric" autoComplete="off"
            placeholder="(11) 98765-4321"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: maskPhone(e.target.value) }))}
            className={inputCls}
          />
        </Field>
        <Field label="Parentesco" htmlFor="ec-rel" error={errors["relation"]}>
          <select
            id="ec-rel"
            value={values.relation}
            onChange={(e) => setValues((v) => ({ ...v, relation: e.target.value }))}
            className={inputCls}
          >
            <option value="">—</option>
            {relations.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <SaveBar state={save.state} dirty={dirty} onCancel={() => { setValues(saved); setErrors({}); save.reset(); }} />
    </form>
  );
}
