import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { initiatePayment } from "@/services/api/payment";
import { toApiError } from "@/lib/errors";
import { z } from "zod";

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
    if (!session?.user || session.user.role !== "PATIENT") {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados de pagamento inválidos", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
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
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
