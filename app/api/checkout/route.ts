import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { initiatePayment } from "@/services/api/payment";
import { z } from "zod";
import { apiError, validationError, handleRouteError, readJson } from "@/lib/api-response";

const checkoutSchema = z.object({
  consultationId: z.string().cuid(),
  method:         z.enum(["CREDIT_CARD", "PIX", "BOLETO"]),
  // Aceito por compatibilidade, mas IGNORADO: o valor é calculado no servidor
  // (services/api/payment.ts). Antes o que viesse aqui era o que se cobrava.
  amount:         z.number().positive().optional(),
  creditCard: z
    .object({
      holderName:  z.string(),
      number:      z.string().regex(/^\d{16}$/),
      expiryMonth: z.string().regex(/^\d{2}$/),
      expiryYear:  z.string().regex(/^\d{4}$/),
      ccv:         z.string().regex(/^\d{3,4}$/),
      holderInfo: z.object({
        name:          z.string(),
        // O formulário do site manda "" (não pede o e-mail do titular) e a
        // validação reprovava todo pagamento com cartão. Vazio -> e-mail da conta.
        email:         z.string().email().or(z.literal("")),
        cpfCnpj:       z.string(),
        postalCode:    z.string(),
        addressNumber: z.string(),
        phone:         z.string(),
      }),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("AUTH_SESSAO_EXPIRADA");
    if (session.user.role !== "PATIENT") {
      return apiError("AUTH_SEM_PERMISSAO", { message: "Só pacientes podem pagar consultas." });
    }

    const body   = await readJson(req);
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error, "Dados de pagamento inválidos");
    }

    // `amount` fica de fora de propósito: quem decide o valor é o servidor.
    const { consultationId, method, creditCard } = parsed.data;
    const payment = await initiatePayment({
      consultationId,
      method,
      ...(creditCard ? { creditCard } : {}),
      patientId: session.user.id,
    });

    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
