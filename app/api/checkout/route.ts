import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { initiatePayment } from "@/services/api/payment";
import { toApiError } from "@/lib/errors";
import { z } from "zod";

const checkoutSchema = z.object({
  consultationId: z.string().cuid(),
  method:         z.enum(["CREDIT_CARD", "PIX", "BOLETO"]),
  amount:         z.number().positive(),
  creditCard: z
    .object({
      holderName:  z.string(),
      number:      z.string().regex(/^\d{16}$/),
      expiryMonth: z.string().regex(/^\d{2}$/),
      expiryYear:  z.string().regex(/^\d{4}$/),
      ccv:         z.string().regex(/^\d{3,4}$/),
      holderInfo: z.object({
        name:          z.string(),
        email:         z.string().email(),
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

    const payment = await initiatePayment({
      ...parsed.data,
      patientId: session.user.id,
    });

    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    const err = toApiError(error);
    return NextResponse.json(err, { status: err.status });
  }
}
