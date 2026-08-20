"use client";

import { useState } from "react";
import Link         from "next/link";
import { Alert }    from "@/components/ui";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import type { ForgotPasswordInput } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [email,    setEmail]    = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [message,  setMessage]  = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = forgotPasswordSchema.safeParse({ email } satisfies ForgotPasswordInput);
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.email?.[0] ?? "E-mail inválido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(parsed.data),
      });

      const json = await res.json().catch(() => ({})) as { message?: string };
      setMessage(json.message ?? "Se este e-mail estiver cadastrado, você receberá um link em instantes.");
      setSent(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <Alert variant="success" title="Verifique seu e-mail">
          {message}
        </Alert>
        <p className="text-center text-sm text-slate-600">
          <Link href="/auth/login" className="font-semibold text-brand-700 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-800">
          E-mail
        </label>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 transition-all duration-200 hover:border-slate-400 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            required
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/40 focus:outline-none focus:ring-4 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Enviando..." : "Enviar link de redefinição"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Lembrou a senha?{" "}
        <Link href="/auth/login" className="font-semibold text-brand-700 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
