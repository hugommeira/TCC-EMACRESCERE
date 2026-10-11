"use client";

// Última linha de defesa: erro no próprio layout raiz (app/layout.tsx). Aqui o
// layout não existe, então a página traz <html>/<body> e estilos próprios.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div role="alert" style={{ maxWidth: 420, textAlign: "center", background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 10px 30px rgba(15,23,42,.06)" }}>
            <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>O site não carregou</h1>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
              Algo deu errado do nosso lado. Tente novamente em instantes.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 20, border: 0, borderRadius: 999, padding: "10px 24px", background: "#0d9488", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Tentar de novo
            </button>
            {error.digest && (
              <p style={{ marginTop: 16, fontSize: 12, color: "#94a3b8" }}>Código de suporte: {error.digest}</p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
