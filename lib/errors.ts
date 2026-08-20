// ─── Erros de domínio ─────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity = "Recurso") {
    super(`${entity} não encontrado`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito de dados") {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class PaymentError extends AppError {
  constructor(message = "Erro no pagamento") {
    super(message, "PAYMENT_ERROR", 402);
    this.name = "PaymentError";
  }
}

// ─── Helper: transformar erro em resposta API ─────────────────────────────────

export function toApiError(error: unknown): {
  message: string;
  code: string;
  status: number;
} {
  if (error instanceof AppError) {
    // Erros de domínio são seguros para expor (mensagens controladas)
    return { message: error.message, code: error.code, status: error.status };
  }

  // Em produção, NUNCA vazar mensagens nativas (Prisma, runtime, etc).
  const isDev = process.env["NODE_ENV"] !== "production";

  if (error instanceof Error) {
    console.error("[toApiError]", error);
    return {
      message: isDev ? error.message : "Erro interno do servidor",
      code:    "INTERNAL_ERROR",
      status:  500,
    };
  }

  console.error("[toApiError] unknown:", error);
  return { message: "Erro interno do servidor", code: "INTERNAL_ERROR", status: 500 };
}
