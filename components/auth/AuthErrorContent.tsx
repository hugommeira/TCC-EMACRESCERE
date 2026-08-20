"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "Este e-mail já está cadastrado com outro método de login. Entre com e-mail e senha, ou use \"Esqueci minha senha\" para defini-la.",
  AccessDenied: "Login cancelado.",
  Configuration: "Login social não está configurado no momento. Tente entrar com e-mail e senha.",
  CredentialsSignin: "E-mail ou senha incorretos.",
};

export function AuthErrorContent() {
  const error   = useSearchParams().get("error");
  const message = (error && ERROR_MESSAGES[error]) ??
    "Não foi possível completar o login. Verifique suas credenciais e tente novamente.";

  return (
    <div className="card w-full max-w-md space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
        ⚠️
      </div>
      <h1 className="text-xl font-bold text-gray-900">Erro ao autenticar</h1>
      <p className="text-sm text-gray-500">{message}</p>
      <Link href="/auth/login" className="btn-primary mx-auto inline-flex">
        Tentar novamente
      </Link>
    </div>
  );
}
