"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Field, SaveBar, TagInput, fieldErrorsFrom, inputCls, useSaveState, type FieldErrors } from "./fields";

interface Values {
  graduationSchool: string;
  graduationYear:   string;
  residency:        string;
  languages:        string[];
}

/** Formação do médico: aparece para o paciente no card de escolha do médico. */
export function DoctorEducationForm({ initial }: { initial: Values }) {
  const [saved,  setSaved]  = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = useSaveState();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setErrors({});
    save.start();
    try {
      await apiFetch("/api/doctor/profile", { method: "PATCH", body: values });
      setSaved(values);
      save.done();
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      save.fail(err);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Faculdade de medicina" htmlFor="ed-school" error={errors["graduationSchool"]} className="sm:col-span-2">
          <input
            id="ed-school" type="text" maxLength={160}
            placeholder="Ex.: Universidade Federal de Minas Gerais"
            value={values.graduationSchool}
            onChange={(e) => set("graduationSchool", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Ano de formatura" htmlFor="ed-year" error={errors["graduationYear"]}>
          <input
            id="ed-year" type="number" inputMode="numeric" min={1950} max={new Date().getFullYear()}
            placeholder="Ex.: 2012"
            value={values.graduationYear}
            onChange={(e) => set("graduationYear", e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Residência / pós-graduação" htmlFor="ed-res" error={errors["residency"]}>
        <input
          id="ed-res" type="text" maxLength={200}
          placeholder="Ex.: Residência em Endocrinologia — Hospital das Clínicas"
          value={values.residency}
          onChange={(e) => set("residency", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Idiomas de atendimento" htmlFor="ed-lang" error={errors["languages"]}>
        <TagInput
          id="ed-lang"
          values={values.languages}
          onChange={(v) => set("languages", v)}
          placeholder="Ex.: Inglês"
          emptyText="Nenhum idioma além do português informado."
        />
      </Field>
      <SaveBar state={save.state} dirty={dirty} onCancel={() => { setValues(saved); setErrors({}); save.reset(); }} />
    </form>
  );
}
