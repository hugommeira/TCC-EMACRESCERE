import type { AsaasCharge, AsaasCustomer } from "@/types";
import { PaymentError } from "@/lib/errors";

// ─── Config ───────────────────────────────────────────────────────────────────

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY ?? "";

// ─── HTTP client ─────────────────────────────────────────────────────────────

async function asaasRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY,
      ...options?.headers,
    },
  });

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
    throw new PaymentError(
      detail
        ? `Gateway de pagamento: ${detail}`
        : res.status === 401
          ? "Gateway de pagamento não configurado (chave do Asaas ausente ou inválida)"
          : "Erro na integração com gateway de pagamento",
    );
  }

  return res.json() as Promise<T>;
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
