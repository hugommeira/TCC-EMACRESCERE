import "server-only";
import { prisma } from "@/lib/prisma";
import { isS3Configured } from "@/lib/s3";
import { classifyError } from "@/lib/errors";
import type { ErrorCode } from "@/lib/error-catalog";

// ─── Saúde do sistema ─────────────────────────────────────────────────────────
//
// Verifica as peças críticas (COMPONENTES_CRITICOS em lib/error-catalog.ts).
// O banco é testado de verdade (SELECT 1); os serviços externos só pela
// configuração, para o health check não gastar cota nem depender deles.

export type EstadoComponente = "ok" | "degradado" | "fora";

export interface ComponenteSaude {
  id:      string;
  nome:    string;
  estado:  EstadoComponente;
  detalhe: string;
  /** Código do catálogo que o usuário veria com a peça nesse estado. */
  code?:   ErrorCode;
}

export interface Saude {
  status:      EstadoComponente;
  verificadoEm: string;
  componentes: ComponenteSaude[];
}

const has = (name: string) => Boolean(process.env[name]);

async function checarBanco(): Promise<ComponenteSaude> {
  const inicio = Date.now();
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    const ms = Date.now() - inicio;
    return {
      id: "banco", nome: "Banco de dados", estado: ms > 2000 ? "degradado" : "ok",
      detalhe: `Respondeu em ${ms} ms`,
    };
  } catch (err) {
    return {
      id: "banco", nome: "Banco de dados", estado: "fora",
      detalhe: "Sem conexão com o banco",
      code: classifyError(err)?.code ?? "INFRA_BANCO_INDISPONIVEL",
    };
  }
}

function checarConfiguracao(): ComponenteSaude[] {
  const pfx = process.env["PFX_ENCRYPTION_KEY"] ?? "";
  const pfxOk = /^[0-9a-fA-F]{64}$/.test(pfx);
  const livekitOk = has("LIVEKIT_URL") && has("LIVEKIT_API_KEY") && has("LIVEKIT_API_SECRET");
  const mock = process.env["PAYMENT_MOCK"] === "true";

  const lista: ComponenteSaude[] = [
    {
      id: "auth", nome: "Autenticação",
      estado: has("NEXTAUTH_SECRET") || has("AUTH_SECRET") ? "ok" : "fora",
      detalhe: has("NEXTAUTH_SECRET") || has("AUTH_SECRET") ? "Segredo de sessão configurado" : "NEXTAUTH_SECRET ausente",
    },
    {
      id: "video", nome: "Videochamada (LiveKit)",
      estado: livekitOk ? (has("NEXT_PUBLIC_LIVEKIT_URL") ? "ok" : "degradado") : "fora",
      detalhe: livekitOk
        ? (has("NEXT_PUBLIC_LIVEKIT_URL") ? "Configurado" : "NEXT_PUBLIC_LIVEKIT_URL ausente: a CSP pode bloquear o vídeo")
        : "Variáveis LIVEKIT_* ausentes",
    },
    {
      id: "pagamento", nome: "Pagamentos (Asaas)",
      estado: mock ? "degradado" : has("ASAAS_API_KEY") ? "ok" : "fora",
      detalhe: mock ? "Modo simulado (PAYMENT_MOCK=true)" : has("ASAAS_API_KEY") ? "Chave configurada" : "ASAAS_API_KEY ausente",
    },
    {
      id: "webhook", nome: "Confirmação de pagamento (webhook)",
      estado: has("ASAAS_WEBHOOK_TOKEN") ? "ok" : "fora",
      detalhe: has("ASAAS_WEBHOOK_TOKEN") ? "Token configurado" : "ASAAS_WEBHOOK_TOKEN ausente",
    },
    {
      id: "email", nome: "E-mail (Resend)",
      estado: has("RESEND_API_KEY") ? "ok" : "degradado",
      detalhe: has("RESEND_API_KEY") ? "Chave configurada" : "RESEND_API_KEY ausente: e-mails não são enviados",
    },
    {
      id: "certificado", nome: "Assinatura digital",
      estado: pfxOk ? "ok" : "fora",
      detalhe: pfxOk ? "Chave de criptografia configurada" : "PFX_ENCRYPTION_KEY ausente ou sem 64 caracteres hex",
    },
    {
      id: "armazenamento", nome: "Armazenamento de arquivos",
      estado: "ok",
      detalhe: isS3Configured() ? "S3" : "Banco de dados (tabela stored_files; limite de upload ~4 MB)",
    },
  ];

  const codigos: Record<string, ErrorCode> = {
    auth: "AUTH_SESSAO_EXPIRADA",
    video: "VIDEO_NAO_CONFIGURADO",
    pagamento: "PAGAMENTO_GATEWAY_NAO_CONFIGURADO",
    webhook: "WEBHOOK_NAO_CONFIGURADO",
    email: "INFRA_EMAIL_NAO_CONFIGURADO",
    certificado: "CERTIFICADO_CHAVE_SERVIDOR",
  };
  for (const c of lista) {
    const code = codigos[c.id];
    if (c.estado !== "ok" && code) c.code = code;
  }
  return lista;
}

export async function checarSaude(): Promise<Saude> {
  const componentes = [await checarBanco(), ...checarConfiguracao()];
  const status: EstadoComponente =
    componentes.find((c) => c.id === "banco")?.estado === "fora" ? "fora"
    : componentes.some((c) => c.estado !== "ok") ? "degradado"
    : "ok";
  return { status, verificadoEm: new Date().toISOString(), componentes };
}
