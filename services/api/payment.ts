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
  /**
   * Ignorado desde que o valor passou a ser calculado no servidor (ver
   * consultationPrice). Continua no tipo só pra não quebrar quem ainda manda.
   */
  amount?:        number;
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

/**
 * Valor da consulta decidido no servidor. Antes o /api/checkout cobrava o
 * `amount` que vinha no corpo da requisição — qualquer paciente podia mandar
 * `amount: 1` pelo DevTools e pagar R$ 1. Agendamento: honorário do médico.
 * Fila on-demand (sem médico definido): taxa fixa da plataforma.
 */
async function consultationPrice(doctorId: string | null): Promise<number> {
  if (doctorId) {
    const doctor = await prisma.doctorProfile.findUnique({
      where:  { userId: doctorId },
      select: { consultationFee: true },
    });
    const fee = Number(doctor?.consultationFee ?? 0);
    if (fee > 0) return fee;
  }
  const { CONSULTATION_FEE_REAIS } = await import("./queue");
  return CONSULTATION_FEE_REAIS;
}

export async function initiatePayment(
  input: InitiatePaymentInput,
): Promise<Payment> {
  const consultation = await prisma.consultation.findUnique({
    where:   { id: input.consultationId },
    include: { patient: true, payment: true },
  });

  if (!consultation) throw new NotFoundError("Consulta");
  if (consultation.patientId !== input.patientId) {
    throw new PaymentError("Consulta não pertence a este paciente");
  }
  if (consultation.status !== "SCHEDULED") {
    throw new PaymentError("Esta consulta não está aguardando pagamento");
  }

  // Payment.consultationId é único: uma segunda tentativa (voltar e clicar de
  // novo, trocar de aba) estourava o índice do banco com erro ilegível.
  if (consultation.payment) {
    const s = consultation.payment.status;
    if (s === "RECEIVED" || s === "CONFIRMED") {
      throw new PaymentError("Esta consulta já está paga");
    }
    if (s === "PENDING") return consultation.payment; // reaproveita a cobrança aberta
    if (s === "REFUNDED") throw new PaymentError("O pagamento desta consulta foi estornado");
    // Vencida (OVERDUE) ou cancelada: libera pra gerar uma cobrança nova.
    await prisma.payment.delete({ where: { id: consultation.payment.id } });
  }

  // Agendamento: a reserva de uma consulta não paga expira (UNPAID_HOLD_MINUTES).
  // Quem volta pra pagar depois disso pode encontrar o horário já tomado — sem
  // esta checagem, dois pacientes pagariam pelo mesmo horário do mesmo médico.
  if (consultation.scheduledAt && consultation.doctorId) {
    if (consultation.scheduledAt.getTime() <= Date.now()) {
      throw new PaymentError("O horário desta consulta já passou — agende um novo");
    }
    const { occupyingWhere } = await import("./consultation");
    const taken = await prisma.consultation.findFirst({
      where: {
        ...occupyingWhere(consultation.doctorId),
        scheduledAt: consultation.scheduledAt,
        id:          { not: consultation.id },
      },
      select: { id: true },
    });
    if (taken) throw new PaymentError("Esse horário foi ocupado por outro paciente — agende um novo");
  }

  const amount = await consultationPrice(consultation.doctorId);

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
        amount,
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
    value:             amount,
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
            // O formulário do site não pede e-mail do titular; usa o da conta.
            email:         input.creditCard.holderInfo.email || consultation.patient.email,
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

  const created = await prisma.payment.create({
    data: {
      consultationId: input.consultationId,
      asaasPaymentId: charge.id,
      method:         input.method,
      // Cartão costuma voltar aprovado na hora; Pix e boleto chegam PENDING e
      // são confirmados depois pelo webhook.
      status:         mapAsaasStatus(charge.status),
      amount,
      pixQrCode:      pixData.qrCode,
      pixCopyPaste:   pixData.copyPaste,
      boletoUrl:      charge.bankSlipUrl ?? null,
      expiresAt:      new Date(dueDate),
    },
  });

  // Já nasceu paga (cartão aprovado na hora): o webhook que chegar depois vai
  // ver wasPaid = true e não faria nada, então aplica o efeito aqui.
  if (created.status === "RECEIVED" || created.status === "CONFIRMED") {
    await afterFirstConfirmation(input.consultationId);
  }
  return created;
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

  // Pagamento confirmado pela 1ª vez -> só consulta on-demand vai pra fila.
  if (!wasPaid && nowPaid) await afterFirstConfirmation(payment.consultationId);
}

/**
 * O que acontece quando o pagamento de uma consulta confirma pela 1ª vez.
 *
 * Antes toda consulta paga ia pra fila (status WAITING), inclusive a agendada:
 * quem pagava hoje uma consulta da semana que vem recebia na hora "O médico está
 * te chamando", e o médico via "Iniciar consulta" dias antes. Agendada paga
 * continua SCHEDULED — quem a leva pra WAITING é o médico, ao chamar o paciente
 * no horário.
 */
async function afterFirstConfirmation(consultationId: string): Promise<void> {
  const c = await prisma.consultation.findUnique({
    where:  { id: consultationId },
    select: { scheduledAt: true, status: true },
  });
  if (!c || c.status !== "SCHEDULED") return;
  if (c.scheduledAt) return; // agendamento: fica como está

  const { moveConsultationToQueue } = await import("./queue");
  await moveConsultationToQueue(consultationId);
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export async function refundPayment(paymentId: string): Promise<Payment> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment)              throw new NotFoundError("Pagamento");
  if (!payment.asaasPaymentId) throw new PaymentError("ID Asaas ausente");
  if (payment.status === "REFUNDED") return payment;

  // Pagamentos da demonstração (demo_*) e do modo de simulação (mock_*) não
  // existem no Asaas — chamar o estorno lá daria 404. Só registra o estorno.
  const simulated = /^(demo_|mock_)/.test(payment.asaasPaymentId);
  if (!simulated) await refundAsaasCharge(payment.asaasPaymentId);

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
