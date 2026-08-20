"use client";

import { useState }       from "react";
import { signIn }         from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link               from "next/link";
import type { Route }     from "next";
import { Alert }          from "@/components/ui";
import { loginSchema }    from "@/lib/validations/auth";
import type { LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";
  const justRegistered = searchParams.get("registered") === "1";

  const [values,   setValues]   = useState<LoginInput>({ email: "", password: "" });
  const [errors,   setErrors]   = useState<Partial<LoginInput>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  async function handleFacebookLogin() {
    setFbLoading(true);
    setApiError(null);
    try {
      await signIn("facebook", { callbackUrl: callbackUrl as string });
    } catch {
      setApiError("Não foi possível iniciar o login com Facebook.");
      setFbLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name as keyof LoginInput];
      return next;
    });
    setApiError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const next: Partial<LoginInput> = {};
      if (fieldErrors.email?.[0])    next.email    = fieldErrors.email[0];
      if (fieldErrors.password?.[0]) next.password = fieldErrors.password[0];
      setErrors(next);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const result = await signIn("credentials", {
        email:    parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (result?.error) {
        setApiError("E-mail ou senha incorretos");
        return;
      }

      router.push(callbackUrl as Route);
      router.refresh();
    } catch {
      setApiError("Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
      {justRegistered && (
        <Alert variant="success">
          Conta criada com sucesso! Faça login para continuar.
        </Alert>
      )}
      {apiError && (
        <Alert variant="error" onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

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
        leftIcon={
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        }
      />

      <Field
        label="Senha"
        name="password"
        type={showPwd ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Mínimo 8 caracteres"
        value={values.password}
        onChange={handleChange}
        {...(errors.password ? { error: errors.password } : {})}
        required
        leftIcon={
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
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

      <div className="flex items-center justify-between">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Lembrar de mim
        </label>
        <Link
          href={"/auth/forgot-password" as Route}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Esqueceu a senha?
        </Link>
      </div>

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
            Entrando...
          </>
        ) : (
          <>
            Entrar
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">ou</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => void handleFacebookLogin()}
        disabled={fbLoading || loading}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#1877F2]" fill="currentColor" aria-hidden>
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
        </svg>
        {fbLoading ? "Conectando..." : "Continuar com Facebook"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Não tem conta?{" "}
        <Link href="/auth/register" className="font-semibold text-brand-700 hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label:       string;
  error?:      string;
  leftIcon?:   React.ReactNode;
  rightAction?: React.ReactNode;
}

function Field({ label, error, leftIcon, rightAction, id, required, ...rest }: FieldProps) {
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
        {leftIcon && <span className="flex-none text-slate-400">{leftIcon}</span>}
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
      {hasError && (
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
      )}
    </div>
  );
}
