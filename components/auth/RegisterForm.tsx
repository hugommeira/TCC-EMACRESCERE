"use client";

import { useState }       from "react";
import { useRouter }      from "next/navigation";
import Link               from "next/link";
import { Alert }          from "@/components/ui";
import { registerSchema } from "@/lib/validations/auth";
import type { RegisterInput } from "@/lib/validations/auth";

type FieldErrors = Partial<Record<keyof RegisterInput, string>>;

const INITIAL: RegisterInput = {
  name: "", email: "", cpf: "", phone: "",
  password: "", confirmPassword: "",
};

function onlyDigits(value: string, max = 11) {
  return value.replace(/\D/g, "").slice(0, max);
}

function formatCpf(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 3)  return d;
  if (d.length <= 6)  return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9)  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function formatPhone(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2)  return `(${d}`;
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function passwordStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  return score; // 0..4
}

export function RegisterForm() {
  const router = useRouter();

  const [values,   setValues]   = useState<RegisterInput>(INITIAL);
  const [errors,   setErrors]   = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  function setField<K extends keyof RegisterInput>(name: K, value: RegisterInput[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setApiError(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === "cpf") {
      setField("cpf", onlyDigits(value, 11));
    } else if (name === "phone") {
      setField("phone", onlyDigits(value, 11));
    } else {
      setField(name as keyof RegisterInput, value as RegisterInput[keyof RegisterInput]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const next: FieldErrors = {};
      for (const [key, val] of Object.entries(fe)) {
        if (val?.[0]) next[key as keyof RegisterInput] = val[0];
      }
      setErrors(next);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/users/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(parsed.data),
      });

      const json = await res.json() as { message?: string };

      if (!res.ok) {
        setApiError(json.message ?? "Erro ao criar conta");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/auth/login?registered=1"), 1500);
    } catch {
      setApiError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Alert variant="success" title="Conta criada com sucesso!">
        Estamos te redirecionando para o login…
      </Alert>
    );
  }

  const strength = passwordStrength(values.password);

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
      {apiError && (
        <Alert variant="error" onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      <Field
        label="Nome completo"
        name="name"
        autoComplete="name"
        placeholder="Maria da Silva"
        value={values.name}
        onChange={handleChange}
        {...(errors.name ? { error: errors.name } : {})}
        required
      />

      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        value={values.email}
        onChange={handleChange}
        {...(errors.email ? { error: errors.email } : {})}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="CPF"
          name="cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={formatCpf(values.cpf)}
          onChange={handleChange}
          {...(errors.cpf ? { error: errors.cpf } : {})}
          required
        />
        <Field
          label="Telefone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={formatPhone(values.phone ?? "")}
          onChange={handleChange}
          {...(errors.phone ? { error: errors.phone } : {})}
          hint="Opcional"
        />
      </div>

      <div>
        <Field
          label="Senha"
          name="password"
          type={showPwd ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={values.password}
          onChange={handleChange}
          {...(errors.password ? { error: errors.password } : {})}
          required
          rightAction={
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="cursor-pointer rounded-md p-1 text-slate-400 hover:text-slate-700"
              aria-label={showPwd ? "Esconder senha" : "Mostrar senha"}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {showPwd ? (
                  <>
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M1 1l22 22" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          }
        />
        {values.password && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < strength
                      ? strength <= 1
                        ? "bg-red-400"
                        : strength === 2
                          ? "bg-amber-400"
                          : strength === 3
                            ? "bg-lime-400"
                            : "bg-brand-500"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Use 8+ caracteres com maiúscula, número e símbolo para mais segurança.
            </p>
          </div>
        )}
      </div>

      <Field
        label="Confirmar senha"
        name="confirmPassword"
        type={showPwd ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Repita a senha"
        value={values.confirmPassword}
        onChange={handleChange}
        {...(errors.confirmPassword ? { error: errors.confirmPassword } : {})}
        required
      />

      <p className="text-xs leading-relaxed text-slate-500">
        Ao criar a conta você concorda com nossos{" "}
        <Link href="/termos" target="_blank" className="font-medium text-brand-700 hover:underline">Termos de Uso</Link>{" "}
        e{" "}
        <Link href="/privacidade" target="_blank" className="font-medium text-brand-700 hover:underline">Política de Privacidade</Link>.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/40 focus:outline-none focus:ring-4 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <circle cx="12" cy="12" r="10" className="opacity-25" />
              <path d="M22 12a10 10 0 0 1-10 10" className="opacity-90" />
            </svg>
            Criando conta...
          </>
        ) : (
          <>
            Criar minha conta
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      <p className="text-center text-sm text-slate-600">
        Já tem conta?{" "}
        <Link href="/auth/login" className="font-semibold text-brand-700 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label:        string;
  hint?:        string;
  error?:       string;
  rightAction?: React.ReactNode;
}

function Field({ label, hint, error, rightAction, id, required, ...rest }: FieldProps) {
  const inputId = id ?? rest.name ?? label;
  const hasError = Boolean(error);
  return (
    <div>
      <label
        htmlFor={inputId}
        className={`block text-sm font-medium ${hasError ? "text-red-600" : "text-slate-800"}`}
      >
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      </label>
      <div
        className={`mt-1.5 flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition-all duration-200 ${
          hasError
            ? "border-red-400 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200"
            : "border-slate-300 hover:border-slate-400 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15"
        }`}
      >
        <input
          id={inputId}
          required={required}
          aria-invalid={hasError}
          {...(hasError ? { "aria-describedby": `${inputId}-error` } : {})}
          {...rest}
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {rightAction}
      </div>
      {hasError ? (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
