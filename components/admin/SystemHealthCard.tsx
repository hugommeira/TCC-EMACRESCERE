import { SectionCard } from "@/components/layout/DashboardShell";
import { checarSaude, type EstadoComponente } from "@/lib/health";
import { ERROS } from "@/lib/error-catalog";

const ESTILO: Record<EstadoComponente, { rotulo: string; classe: string }> = {
  ok:        { rotulo: "Funcionando", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  degradado: { rotulo: "Atenção",     classe: "bg-amber-50 text-amber-800 ring-amber-200" },
  fora:      { rotulo: "Fora do ar",  classe: "bg-rose-50 text-rose-700 ring-rose-200" },
};

/**
 * Saúde das peças críticas (lib/health.ts), no painel do administrador.
 * Para cada peça com problema mostra o código do catálogo de erros e o que o
 * usuário vê — a reação completa está em docs/catalogo-erros.md.
 */
export async function SystemHealthCard() {
  const saude = await checarSaude();

  return (
    <SectionCard
      className="mt-6"
      title="Saúde do sistema"
      description="Banco testado agora; serviços externos conferidos pela configuração."
      action={
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ESTILO[saude.status].classe}`}>
          {ESTILO[saude.status].rotulo}
        </span>
      }
    >
      <ul className="divide-y divide-slate-100">
        {saude.componentes.map((c) => (
          <li key={c.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{c.nome}</p>
              <p className="text-xs text-slate-500">{c.detalhe}</p>
              {c.code && (
                <p className="mt-0.5 text-xs text-slate-500">
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-700">{c.code}</code>
                  {ERROS[c.code].mensagem && <> · usuário vê: “{ERROS[c.code].mensagem}”</>}
                </p>
              )}
            </div>
            <span className={`inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${ESTILO[c.estado].classe}`}>
              {ESTILO[c.estado].rotulo}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
