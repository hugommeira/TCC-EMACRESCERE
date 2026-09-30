"use client";

import { useState } from "react";

/**
 * Confere se um PDF de receita é exatamente o que foi emitido: calcula o
 * SHA-256 do arquivo no navegador (o PDF não sai do computador) e compara com
 * o hash gravado na emissão. Qualquer alteração no arquivo muda o hash.
 */
export function PdfHashCheck({ expectedHash }: { expectedHash: string }) {
  const [result, setResult] = useState<"ok" | "diff" | null>(null);
  const [busy,   setBusy]   = useState(false);

  async function check(file: File) {
    setBusy(true);
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
      setResult(hex === expectedHash.toLowerCase() ? "ok" : "diff");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-slate-100 pt-3">
      <label className="block text-xs text-slate-600">
        Conferir o arquivo recebido (o PDF é verificado no seu navegador e não é enviado):
        <input
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void check(f); }}
          className="mt-1.5 block w-full text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
        />
      </label>
      {result === "ok" && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
          O arquivo é idêntico ao emitido.
        </p>
      )}
      {result === "diff" && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 ring-1 ring-rose-200">
          O arquivo NÃO corresponde ao emitido — pode ter sido alterado.
        </p>
      )}
    </div>
  );
}
