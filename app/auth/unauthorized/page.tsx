import type { Metadata } from "next";
import Link              from "next/link";

export const metadata: Metadata = { title: "Acesso negado" };

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="card w-full max-w-md text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl">
          🔒
        </div>
        <h1 className="text-xl font-bold text-gray-900">Acesso negado</h1>
        <p className="text-sm text-gray-500">
          Você não tem permissão para acessar esta página.
        </p>
        <Link href="/" className="btn-secondary inline-flex mx-auto">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
