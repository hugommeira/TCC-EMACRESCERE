import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <p className="text-7xl font-black text-gray-200">404</p>
        <h1 className="text-xl font-bold text-gray-900">Página não encontrada</h1>
        <p className="text-sm text-gray-500">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
