import { prisma } from "@/lib/prisma";
import { AppError, logError } from "@/lib/errors";
import bcrypt from "bcryptjs";
import type { RegisterInput, RegisterDoctorInput } from "@/lib/validations/auth";
import type { UserWithProfile, PaginationParams, PaginatedResponse } from "@/types";
import type { DoctorApprovalStatus, Role } from "@prisma/client";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/services/external/email";
import { verifyCrm } from "@/services/external/cfm";

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000; // 15 minutos

/** Valor padrão da consulta pra médico recém-cadastrado (admin pode ajustar). */
const DEFAULT_CONSULTATION_FEE = 150;

// ─── Register doctor (auto-cadastro, entra PENDING) ───────────────────────────

/**
 * Cadastro de médico pelo app/site. Verifica o CRM (simulado, ver
 * services/external/cfm.ts) e cria a conta com approvalStatus PENDING e
 * available=false: o médico consegue logar, mas não atende nem aparece
 * pra pacientes até o admin aprovar em /dashboard/admin/doctors.
 */
export async function registerDoctor(
  input: RegisterDoctorInput,
): Promise<UserWithProfile> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email },
        { cpf: input.cpf },
        { doctorProfile: { crm: input.crm } },
      ],
    },
    include: { doctorProfile: { select: { crm: true } } },
  });

  if (existing) {
    throw new AppError(
      existing.email === input.email
        ? "USUARIO_EMAIL_JA_CADASTRADO"
        : existing.cpf === input.cpf
          ? "USUARIO_CPF_JA_CADASTRADO"
          : "USUARIO_CRM_JA_CADASTRADO",
    );
  }

  const verification = await verifyCrm({
    crm:      input.crm,
    crmState: input.crmState,
    name:     input.name,
  });
  if (!verification.valid) {
    // 422 com a mensagem da "consulta ao conselho" — o app mostra como erro
    // do campo CRM.
    throw new AppError(
      verification.situation === "SUSPENSO" ? "USUARIO_CRM_SUSPENSO" : "USUARIO_CRM_INVALIDO",
      { message: verification.message, errors: { crm: [verification.message] } },
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      name:  input.name,
      email: input.email,
      cpf:   input.cpf,
      phone: input.phone,
      role:  "DOCTOR",
      doctorProfile: {
        create: {
          crm:             input.crm,
          crmState:        input.crmState,
          specialty:       input.specialty,
          consultationFee: DEFAULT_CONSULTATION_FEE,
          available:       false,
          approvalStatus:  "PENDING",
          crmVerifiedAt:   new Date(verification.checkedAt),
          crmVerification: verification,
        },
      },
      accounts: {
        create: {
          type:             "credentials",
          provider:         "credentials",
          providerAccountId: input.email,
          access_token:     passwordHash,
        },
      },
    },
    include: { patientProfile: true, doctorProfile: true },
  });
}

/**
 * Guarda das rotas de atendimento: médico só entra na fila/atende depois de
 * credenciado. Perfil inexistente também barra.
 */
export async function assertDoctorApproved(userId: string): Promise<void> {
  const profile = await prisma.doctorProfile.findUnique({
    where:  { userId },
    select: { approvalStatus: true },
  });
  if (profile?.approvalStatus !== "APPROVED") {
    throw new AppError(profile?.approvalStatus === "REJECTED" ? "MEDICO_REPROVADO" : "MEDICO_EM_ANALISE");
  }
}

// ─── Admin: credenciamento ────────────────────────────────────────────────────

export async function listDoctorsForApproval(status?: DoctorApprovalStatus) {
  return prisma.user.findMany({
    where: {
      role: "DOCTOR",
      ...(status ? { doctorProfile: { approvalStatus: status } } : {}),
    },
    include: { doctorProfile: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function decideDoctorApproval(input: {
  doctorUserId: string;
  adminId:      string;
  decision:     "APPROVED" | "REJECTED";
  note?:        string;
}) {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: input.doctorUserId } });
  if (!profile) throw new AppError("ADMIN_MEDICO_NAO_ENCONTRADO");

  return prisma.doctorProfile.update({
    where: { userId: input.doctorUserId },
    data: {
      approvalStatus: input.decision,
      approvalNote:   input.note ?? null,
      approvedAt:     new Date(),
      approvedById:   input.adminId,
      // Aprovado passa a ficar visível/disponível; reprovado some da lista.
      available:      input.decision === "APPROVED",
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

// ─── Register patient ─────────────────────────────────────────────────────────

export async function registerPatient(
  input: RegisterInput,
): Promise<UserWithProfile> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email },
        { cpf: input.cpf },
      ],
    },
  });

  if (existing) {
    throw new AppError(
      existing.email === input.email ? "USUARIO_EMAIL_JA_CADASTRADO" : "USUARIO_CPF_JA_CADASTRADO",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name:  input.name,
      email: input.email,
      cpf:   input.cpf,
      phone: input.phone,
      role:  "PATIENT",
      patientProfile: { create: {} },
      accounts: {
        create: {
          type:             "credentials",
          provider:         "credentials",
          providerAccountId: input.email,
          access_token:     passwordHash, // hash guardado no access_token por simplicidade
        },
      },
    },
    include: {
      patientProfile: true,
      doctorProfile:  true,
    },
  });

  return user;
}

// ─── Recuperação de senha ──────────────────────────────────────────────────────
//
// Anti-enumeration: a função nunca revela se o e-mail existe ou não — a rota
// que a chama sempre responde com a mesma mensagem genérica de sucesso.

export async function requestPasswordReset(
  email: string,
  appUrl: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return; // silêncio proposital

  // Invalida tokens anteriores ainda não usados pra esse e-mail.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const { token, tokenHash } = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token:      tokenHash,
      expires:    new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  const resetUrl = `${appUrl.replace(/\/$/, "")}/auth/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    // Não propaga: a rota responde sucesso genérico de qualquer forma.
    logError("AUTH_EMAIL_NAO_ENVIADO", err);
  }
}

export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({
        where: { token: tokenHash },
      }).catch(() => undefined);
    }
    throw new AppError("AUTH_LINK_REDEFINICAO_INVALIDO");
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } });
  if (!user || !user.active) {
    throw new AppError("AUTH_LINK_REDEFINICAO_INVALIDO");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  try {
    await prisma.$transaction([
      // Token de uso único: se duas requisições concorrentes chegarem com o
      // mesmo token, só a primeira encontra a linha pra deletar — a segunda
      // lança P2025 e a transação inteira é revertida (capturado abaixo).
      prisma.verificationToken.delete({ where: { token: tokenHash } }),
      prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider:           "credentials",
            providerAccountId:  user.email,
          },
        },
        create: {
          userId:            user.id,
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: user.email,
          access_token:      passwordHash,
        },
        update: { access_token: passwordHash },
      }),
      // Sessões persistidas (se houver) são revogadas; sessões JWT ativas
      // expiram naturalmente pelo tempo de vida do token, não são revogadas aqui.
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);
  } catch (err) {
    const isRecordNotFound =
      typeof err === "object" && err !== null && "code" in err && err.code === "P2025";
    if (isRecordNotFound) {
      throw new AppError("AUTH_LINK_REDEFINICAO_INVALIDO");
    }
    throw err;
  }
}

// ─── Get user by ID ───────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<UserWithProfile> {
  const user = await prisma.user.findUnique({
    where:   { id },
    include: { patientProfile: true, doctorProfile: true },
  });

  if (!user) throw new AppError("USUARIO_NAO_ENCONTRADO");
  return user;
}

// ─── Update patient profile ───────────────────────────────────────────────────

export async function updatePatientProfile(
  userId: string,
  data: {
    birthDate?:   Date;
    gender?:      string;
    bloodType?:   string;
    allergies?:   string[];
    medications?: string[];
    notes?:       string;
  },
): Promise<UserWithProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("USUARIO_NAO_ENCONTRADO");

  return prisma.user.update({
    where: { id: userId },
    data: {
      patientProfile: {
        upsert: {
          create: data,
          update: data,
        },
      },
    },
    include: { patientProfile: true, doctorProfile: true },
  });
}

// ─── List doctors (for scheduling) ───────────────────────────────────────────

export async function listDoctors(
  params: PaginationParams & { specialty?: string },
): Promise<PaginatedResponse<UserWithProfile>> {
  const page  = params.page  ?? 1;
  const limit = params.limit ?? 10;
  const skip  = (page - 1) * limit;

  const where = {
    role:   "DOCTOR" as Role,
    active: true,
    doctorProfile: {
      available: true,
      // Só médico credenciado aparece pra paciente agendar.
      approvalStatus: "APPROVED" as DoctorApprovalStatus,
      ...(params.specialty ? { specialty: { contains: params.specialty, mode: "insensitive" as const } } : {}),
    },
    ...(params.search
      ? { name: { contains: params.search, mode: "insensitive" as const } }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include:  { patientProfile: true, doctorProfile: true },
      orderBy:  { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

// ─── Admin: list all users ────────────────────────────────────────────────────

export async function listUsers(
  params: PaginationParams & { role?: Role },
): Promise<PaginatedResponse<UserWithProfile>> {
  const page  = params.page  ?? 1;
  const limit = params.limit ?? 20;
  const skip  = (page - 1) * limit;

  const where = {
    ...(params.role   ? { role: params.role } : {}),
    ...(params.search ? {
      OR: [
        { name:  { contains: params.search, mode: "insensitive" as const } },
        { email: { contains: params.search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include:  { patientProfile: true, doctorProfile: true },
      orderBy:  { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}
