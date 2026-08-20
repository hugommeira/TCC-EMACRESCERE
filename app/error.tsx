"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error:  Error & { digest?: string };
  reset:  () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="card w-full max-w-md text-center space-y-4">
        <p className="text-4xl">🔧</p>
        <h1 className="text-xl font-bold text-gray-900">Algo deu errado</h1>
        <p className="text-sm text-gray-500">
          Ocorreu um erro inesperado. Nossa equipe foi notificada.
        </p>
        <button onClick={reset} className="btn-primary mx-auto">
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
