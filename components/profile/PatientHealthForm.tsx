"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { BLOOD_TYPES, GENDERS } from "@/lib/validations/profile";
import { Field, SaveBar, TagInput, fieldErrorsFrom, inputCls, useSaveState, type FieldErrors } from "./fields";

export interface HealthValues {
  birthDate:    string;   // yyyy-mm-dd ou ""
  gender:       string;
  bloodType:    string;
  heightCm:     string;
  goalWeightKg: string;
  allergies:    string[];
  medications:  string[];
  notes:        string;
}

function same(a: HealthValues, b: HealthValues): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Dados de saúde do paciente. O médico vê estes dados no prontuário da consulta. */
export function PatientHealthForm({ initial }: { initial: HealthValues }) {
  const router = useRouter();
  const [saved,  setSaved]  = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = useSaveState();
  const dirty = !same(values, saved);

  const set = <K extends keyof HealthValues>(k: K, v: HealthValues[K]) => setValues((p) => ({ ...p, [k]: v }));

  // Valor antigo fora da lista (o app aceita texto livre): continua como opção.
  const genderOptions = values.gender && !(GENDERS as readonly string[]).includes(values.gender)
    ? [values.gender, ...GENDERS]
    : [...GENDERS];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setErrors({});
    save.start();
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: {
          birthDate:    values.birthDate,
          gender:       values.gender,
          bloodType:    values.bloodType,
          heightCm:     values.heightCm,
          goalWeightKg: values.goalWeightKg.replace(",", "."),
          allergies:    values.allergies,
          medications:  values.medications,
          notes:        values.notes,
        },
      });
      setSaved(values);
      save.done();
      router.refresh();
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      save.fail(err);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Data de nascimento" htmlFor="pf-birth" error={errors["birthDate"]}>
          <input
            id="pf-birth" type="date" max={today} min="1900-01-01"
            value={values.birthDate}
            onChange={(e) => set("birthDate", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Sexo" htmlFor="pf-gender" error={errors["gender"]}>
          <select id="pf-gender" value={values.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls}>
            <option value="">Não informado</option>
            {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Tipo sanguíneo" htmlFor="pf-blood" error={errors["bloodType"]}>
          <select id="pf-blood" value={values.bloodType} onChange={(e) => set("bloodType", e.target.value)} className={inputCls}>
            <option value="">Não sei / não informado</option>
            {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Altura (cm)" htmlFor="pf-height" error={errors["heightCm"]} hint="Usada no cálculo do IMC.">
          <input
            id="pf-height" type="number" inputMode="numeric" min={100} max={250} step={1}
            placeholder="Ex.: 165"
            value={values.heightCm}
            onChange={(e) => set("heightCm", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Meta de peso (kg)" htmlFor="pf-goal" error={errors["goalWeightKg"]} hint="Opcional. Combine com o seu médico.">
          <input
            id="pf-goal" type="text" inputMode="decimal"
            placeholder="Ex.: 72,5"
            value={values.goalWeightKg}
            onChange={(e) => set("goalWeightKg", e.target.value.replace(/[^\d.,]/g, ""))}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Alergias" htmlFor="pf-allergies" error={errors["allergies"]}>
          <TagInput
            id="pf-allergies"
            values={values.allergies}
            onChange={(v) => set("allergies", v)}
            placeholder="Ex.: Dipirona"
            emptyText="Nenhuma alergia registrada."
          />
        </Field>
        <Field label="Medicamentos em uso" htmlFor="pf-meds" error={errors["medications"]}>
          <TagInput
            id="pf-meds"
            values={values.medications}
            onChange={(v) => set("medications", v)}
            placeholder="Ex.: Losartana 50mg"
            emptyText="Nenhum medicamento registrado."
          />
        </Field>
      </div>

      <Field label="Observações de saúde" htmlFor="pf-notes" error={errors["notes"]}>
        <textarea
          id="pf-notes" rows={3} maxLength={1000}
          placeholder="Algo que o médico deva saber antes da consulta (cirurgias, condições, hábitos...)"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-right text-[11px] text-slate-400">{values.notes.length}/1000</p>
      </Field>

      <SaveBar state={save.state} dirty={dirty} onCancel={() => { setValues(saved); setErrors({}); save.reset(); }} />
    </form>
  );
}
