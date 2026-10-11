import type { AsaasCharge, AsaasCustomer } from "@/types";
import { AppError } from "@/lib/errors";

// ─── Config ───────────────────────────────────────────────────────────────────

// Lidas a cada chamada (e não no carregamento do módulo) para os testes de
// falha conseguirem simular chave ausente.
const asaasUrl = () => process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const asaasKey = () => process.env.ASAAS_API_KEY ?? "";

/** Tempo máximo de espera pelo Asaas antes de desistir (PAGAMENTO_GATEWAY_INDISPONIVEL). */
export const ASAAS_TIMEOUT_MS = 15_000;

// ─── HTTP client ─────────────────────────────────────────────────────────────

async function asaasRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  if (!asaasKey()) {
    throw new AppError("PAGAMENTO_GATEWAY_NAO_CONFIGURADO", { detail: "ASAAS_API_KEY ausente" });
  }

  let res: Response;
  try {
    res = await fetch(`${asaasUrl()}${path}`, {
      ...options,
      signal: AbortSignal.timeout(ASAAS_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "access_token": asaasKey(),
        ...options?.headers,
      },
    });
  } catch (err) {
    // Rede caiu, DNS, TLS ou timeout: nada foi cobrado.
    throw new AppError("PAGAMENTO_GATEWAY_INDISPONIVEL", {
      detail: `${options?.method ?? "GET"} ${path}: ${(err as Error)?.name} ${(err as Error)?.message}`,
      cause:  err,
    });
  }

  if (!res.ok) {
    // Asaas responde { errors: [{ code, description }] }; sem chave configurada
    // vem 401 sem corpo. Antes só se lia `description` na raiz e todo erro
    // virava o genérico "Erro na integração..." — impossível diagnosticar.
    const body = (await res.json().catch(() => ({}))) as {
      description?: string;
      errors?: { code?: string; description?: string }[];
    };
    const detail = body.errors?.[0]?.description ?? body.description;
    console.error(`[asaas] ${options?.method ?? "GET"} ${path} -> ${res.status}`, body);
    if (res.status === 401 || res.status === 403) {
      throw new AppError("PAGAMENTO_GATEWAY_NAO_CONFIGURADO", { detail: `Asaas ${res.status}` });
    }
    if (res.status >= 500) {
      throw new AppError("PAGAMENTO_GATEWAY_INDISPONIVEL", { detail: `Asaas ${res.status}` });
    }
    throw new AppError("PAGAMENTO_RECUSADO", {
      message: detail ? `Pagamento recusado: ${detail}` : undefined,
      detail:  `Asaas ${res.status}`,
    });
  }

  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new AppError("PAGAMENTO_GATEWAY_INDISPONIVEL", { detail: "resposta do Asaas não é JSON", cause: err });
  }
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function createAsaasCustomer(
  data: Omit<AsaasCustomer, "id">,
): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body:   JSON.stringify(data),
  });
}

export async function getAsaasCustomer(id: string): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>(`/customers/${id}`);
}

// ─── Charges ─────────────────────────────────────────────────────────────────

export interface CreateChargeInput {
  customer:    string;
  billingType: "CREDIT_CARD" | "PIX" | "BOLETO";
  value:       number;
  dueDate:     string; // YYYY-MM-DD
  description: string;
  externalReference?: string;
  creditCard?: {
    holderName:     string;
    number:         string;
    expiryMonth:    string;
    expiryYear:     string;
    ccv:            string;
  };
  creditCardHolderInfo?: {
    name:           string;
    email:          string;
    cpfCnpj:        string;
    postalCode:     string;
    addressNumber:  string;
    phone:          string;
  };
}

export async function createAsaasCharge(
  data: CreateChargeInput,
): Promise<AsaasCharge> {
  return asaasRequest<AsaasCharge>("/payments", {
    method: "POST",
    body:   JSON.stringify(data),
  });
}

export async function getAsaasCharge(id: string): Promise<AsaasCharge> {
  return asaasRequest<AsaasCharge>(`/payments/${id}`);
}

/** Cancela (remove) uma cobrança ainda não paga. */
export async function deleteAsaasCharge(id: string): Promise<void> {
  await asaasRequest<{ deleted: boolean }>(`/payments/${id}`, { method: "DELETE" });
}

export async function refundAsaasCharge(id: string): Promise<AsaasCharge> {
  return asaasRequest<AsaasCharge>(`/payments/${id}/refund`, {
    method: "POST",
  });
}

// ─── PIX QR Code ─────────────────────────────────────────────────────────────

export interface PixQrCode {
  encodedImage: string;
  payload:      string;
  expirationDate: string;
}

export async function getPixQrCode(paymentId: string): Promise<PixQrCode> {
  return asaasRequest<PixQrCode>(`/payments/${paymentId}/pixQrCode`);
}
