"use client";

import { useState }       from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link               from "next/link";
import { Alert }          from "@/components/ui";
import { resetPasswordSchema } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const token  = useSearchParams().get("token") ?? "";

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [errors,   setErrors]   = useState<{ password?: string; confirmPassword?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  if (!token) {
    return (
      <Alert variant="error" title="Link inválido">
        Este link de redefinição está incompleto ou é inválido.{" "}
        <Link href="/auth/forgot-password" className="font-semibold underline">
          Solicite um novo
        </Link>.
      </Alert>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const next: { password?: string; confirmPassword?: string } = {};
      if (fe.password?.[0]) next.password = fe.password[0];
      if (fe.confirmPassword?.[0]) next.confirmPassword = fe.confirmPassword[0];
      setErrors(next);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(parsed.data),
      });

      const json = await res.json().catch(() => ({})) as { message?: string };

      if (!res.ok) {
        setApiError(json.message ?? "Não foi possível redefinir sua senha");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 1800);
    } catch {
      setApiError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Alert variant="success" title="Senha redefinida!">
        Você já pode entrar com sua nova senha. Redirecionando…
      </Alert>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
      {apiError && (
        <Alert variant="error" onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      <PasswordField
        label="Nova senha"
        name="password"
        value={password}
        onChange={(v) => {
          setPassword(v);
          setErrors((p) => { const rest = { ...p }; delete rest.password; return rest; });
        }}
        {...(errors.password ? { error: errors.password } : {})}
      />

      <PasswordField
        label="Confirmar nova senha"
        name="confirmPassword"
        value={confirmPassword}
        onChange={(v) => {
          setConfirmPassword(v);
          setErrors((p) => { const rest = { ...p }; delete rest.confirmPassword; return rest; });
        }}
        {...(errors.confirmPassword ? { error: errors.confirmPassword } : {})}
      />

      <button
        type="submit"
        disabled={loading}
        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/40 focus:outline-none focus:ring-4 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}

function PasswordField({
  label, name, value, onChange, error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  const hasError = Boolean(error);

  return (
    <div>
      <label htmlFor={name} className={`block text-sm font-medium ${hasError ? "text-red-600" : "text-slate-800"}`}>
        {label}
      </label>
      <div
        className={`mt-1.5 flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition-all duration-200 ${
          hasError
            ? "border-red-400 ring-2 ring-red-100 focus-within:border-red-500 focus-within:ring-red-200"
            : "border-slate-300 hover:border-slate-400 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15"
        }`}
      >
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          aria-invalid={hasError}
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="cursor-pointer rounded-md p-1 text-slate-400 hover:text-slate-700"
          aria-label={show ? "Esconder senha" : "Mostrar senha"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {show ? (
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
      </div>
      {hasError && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
