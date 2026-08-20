import { prisma } from "@/lib/prisma";
import { NotFoundError, PaymentError } from "@/lib/errors";
import {
  createAsaasCharge,
  createAsaasCustomer,
  getAsaasCharge,
  getPixQrCode,
  refundAsaasCharge,
} from "@/services/external/asaas";
import type { Payment, PaymentMethod } from "@prisma/client";

// QR Code placeholder em base64 (para modo mock — exibe um QR com texto "TESTE")
const MOCK_PIX_QR_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5UlEQVQ4jaWUMQ7CMAxFf2RKxHkySNAOTGzMnJSj0BMQpgxBwiUK7v8WipBQByDU0EhJlOd87K8YAFnjf8sTrFSrckEW+JFFGdgUlA0p8XfJeg5oRgDshEEHBmJxJjhCghxYJXHEYUxDDlA9wSqCFJ0aGN7fGSfSAKMHGxKwYwUmgtMS9FiSGQElSCEaFBh4LsmbYKLAA4NYlR5SpoWaZNxUfhNWAGUi1L29yHyjbMEvAoWAMARq3VEC3Ofbh+pDVLfXgRm0yCzVRkH8e6Ea3FabLpSStmF09v9ItHJ09Pad/wDc0K1lh73vvgAAAABJRU5ErkJggg==";

// ─── Initiate payment for a consultation ─────────────────────────────────────

export interface InitiatePaymentInput {
  consultationId: string;
  patientId:      string;
  method:         PaymentMethod;
  amount:         number;
  creditCard?: {
    holderName:    string;
    number:        string;
    expiryMonth:   string;
    expiryYear:    string;
    ccv:           string;
    holderInfo: {
      name:          string;
      email:         string;
      cpfCnpj:       string;
      postalCode:    string;
      addressNumber: string;
      phone:         string;
    };
  };
}

export async function initiatePayment(
  input: InitiatePaymentInput,
): Promise<Payment> {
  const consultation = await prisma.consultation.findUnique({
    where:   { id: input.consultationId },
    include: { patient: true },
  });

  if (!consultation) throw new NotFoundError("Consulta");
  if (consultation.patientId !== input.patientId) {
    throw new PaymentError("Consulta não pertence a este paciente");
  }

  // ─── MODO DE TESTE ──────────────────────────────────────────────────────────
  // Pula ASAAS e cria payment PENDING; usuário confirma via /api/dev/simulate-payment
  if (process.env["PAYMENT_MOCK"] === "true") {
    const mockId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return prisma.payment.create({
      data: {
        consultationId: input.consultationId,
        asaasPaymentId: mockId,
        method:         input.method,
        status:         "PENDING",
        amount:         input.amount,
        pixQrCode:      MOCK_PIX_QR_BASE64,
        pixCopyPaste:   `00020101021226MOCK${mockId}5204000053039865802BR5910MOCK6009Sao Paulo62070503***6304ABCD`,
        ...(input.method === "BOLETO" ? { boletoUrl: "https://example.com/boleto-mock" } : {}),
        expiresAt:      new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata:       { mock: true } as object,
      },
    });
  }

  // Garantir customer no Asaas
  let asaasCustomerId = await prisma.doctorProfile
    .findFirst({ where: { userId: consultation.patientId } })
    .then(() => null); // placeholder – na prática busca no perfil do paciente

  if (!asaasCustomerId) {
    const customer = await createAsaasCustomer({
      name:    consultation.patient.name,
      email:   consultation.patient.email,
      cpfCnpj: consultation.patient.cpf ?? "",
      phone:   consultation.patient.phone ?? undefined,
    });
    asaasCustomerId = customer.id;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);

  const charge = await createAsaasCharge({
    customer:          asaasCustomerId,
    billingType:       mapPaymentMethod(input.method),
    value:             input.amount,
    dueDate:           dueDate.toISOString().split("T")[0]!,
    description:       `Consulta médica #${input.consultationId.slice(-8)}`,
    externalReference: input.consultationId,
    ...(input.method === "CREDIT_CARD" && input.creditCard
      ? {
          creditCard: {
            holderName:  input.creditCard.holderName,
            number:      input.creditCard.number,
            expiryMonth: input.creditCard.expiryMonth,
            expiryYear:  input.creditCard.expiryYear,
            ccv:         input.creditCard.ccv,
          },
          creditCardHolderInfo: {
            name:          input.creditCard.holderInfo.name,
            email:         input.creditCard.holderInfo.email,
            cpfCnpj:       input.creditCard.holderInfo.cpfCnpj,
            postalCode:    input.creditCard.holderInfo.postalCode,
            addressNumber: input.creditCard.holderInfo.addressNumber,
            phone:         input.creditCard.holderInfo.phone,
          },
        }
      : {}),
  });

  let pixData: { qrCode?: string; copyPaste?: string } = {};
  if (input.method === "PIX") {
    const pix = await getPixQrCode(charge.id).catch(() => null);
    if (pix) {
      pixData = { qrCode: pix.encodedImage, copyPaste: pix.payload };
    }
  }

  return prisma.payment.create({
    data: {
      consultationId: input.consultationId,
      asaasPaymentId: charge.id,
      method:         input.method,
      status:         "PENDING",
      amount:         input.amount,
      pixQrCode:      pixData.qrCode,
      pixCopyPaste:   pixData.copyPaste,
      boletoUrl:      charge.bankSlipUrl ?? null,
      expiresAt:      new Date(dueDate),
    },
  });
}

// ─── Sync payment status from Asaas ──────────────────────────────────────────

export async function syncPaymentStatus(paymentId: string): Promise<Payment> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new NotFoundError("Pagamento");
  if (!payment.asaasPaymentId) throw new PaymentError("ID Asaas não encontrado");

  const charge = await getAsaasCharge(payment.asaasPaymentId);

  return prisma.payment.update({
    where: { id: paymentId },
    data:  { status: mapAsaasStatus(charge.status) },
  });
}

// ─── Process webhook from Asaas ──────────────────────────────────────────────

export async function processAsaasWebhook(payload: {
  event:   string;
  payment: { id: string; status: string };
}): Promise<void> {
  const payment = await prisma.payment.findFirst({
    where: { asaasPaymentId: payload.payment.id },
  });

  if (!payment) return; // ignorar se não for nosso

  const status   = mapAsaasStatus(payload.payment.status);
  const wasPaid  = payment.status === "RECEIVED" || payment.status === "CONFIRMED";
  const nowPaid  = status === "RECEIVED" || status === "CONFIRMED";

  await prisma.payment.update({
    where: { id: payment.id },
    data:  {
      status,
      ...(status === "RECEIVED" ? { paidAt: new Date() } : {}),
      ...(status === "REFUNDED" ? { refundedAt: new Date() } : {}),
    },
  });

  // Pagamento confirmado pela 1ª vez -> mover consulta para a fila
  if (!wasPaid && nowPaid) {
    const { moveConsultationToQueue } = await import("./queue");
    await moveConsultationToQueue(payment.consultationId);
  }
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export async function refundPayment(paymentId: string): Promise<Payment> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment)              throw new NotFoundError("Pagamento");
  if (!payment.asaasPaymentId) throw new PaymentError("ID Asaas ausente");

  await refundAsaasCharge(payment.asaasPaymentId);

  return prisma.payment.update({
    where: { id: paymentId },
    data:  { status: "REFUNDED", refundedAt: new Date() },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapPaymentMethod(
  method: PaymentMethod,
): "CREDIT_CARD" | "PIX" | "BOLETO" {
  const map: Record<PaymentMethod, "CREDIT_CARD" | "PIX" | "BOLETO"> = {
    CREDIT_CARD: "CREDIT_CARD",
    PIX:         "PIX",
    BOLETO:      "BOLETO",
  };
  return map[method];
}

function mapAsaasStatus(
  status: string,
): "PENDING" | "CONFIRMED" | "RECEIVED" | "OVERDUE" | "REFUNDED" | "CANCELLED" {
  const map: Record<string, "PENDING" | "CONFIRMED" | "RECEIVED" | "OVERDUE" | "REFUNDED" | "CANCELLED"> = {
    PENDING:             "PENDING",
    AWAITING_RISK_ANALYSIS: "PENDING",
    CONFIRMED:           "CONFIRMED",
    RECEIVED:            "RECEIVED",
    RECEIVED_IN_CASH:    "RECEIVED",
    OVERDUE:             "OVERDUE",
    REFUNDED:            "REFUNDED",
    REFUND_REQUESTED:    "REFUNDED",
    CHARGEBACK_REQUESTED: "REFUNDED",
    CANCELLED:           "CANCELLED",
  };
  return map[status] ?? "PENDING";
}
