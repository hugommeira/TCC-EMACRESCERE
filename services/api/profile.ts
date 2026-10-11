import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { buildKey, deleteObject, getObjectBuffer, putObject } from "@/lib/s3";
import {
  AVATAR_MAX_BYTES, PATIENT_FIELDS, avatarMimeFromBytes,
  type UpdateProfileInput,
} from "@/lib/validations/profile";

// ─── Perfil: dados da conta e de saúde ────────────────────────────────────────

/**
 * Atualiza nome/telefone (qualquer papel) e, para paciente, os dados de saúde.
 * Só os campos presentes em `input` mudam; null apaga o valor.
 */
export async function updateOwnProfile(userId: string, role: Role, input: UpdateProfileInput) {
  const sentPatientField = PATIENT_FIELDS.some((k) => input[k] !== undefined);
  if (sentPatientField && role !== "PATIENT") {
    throw new AppError("AUTH_SEM_PERMISSAO", { message: "Dados de saúde só podem ser editados pelo paciente." });
  }

  const patient: Record<string, unknown> = {};
  for (const k of PATIENT_FIELDS) if (input[k] !== undefined) patient[k] = input[k];

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name  !== undefined ? { name:  input.name }  : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(Object.keys(patient).length > 0
        ? { patientProfile: { upsert: { create: patient, update: patient } } }
        : {}),
    },
    select: {
      id: true, name: true, phone: true,
      patientProfile: {
        select: {
          birthDate: true, gender: true, bloodType: true, allergies: true,
          medications: true, notes: true, heightCm: true, goalWeightKg: true,
          emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelation: true,
        },
      },
    },
  });
}

// ─── Senha ────────────────────────────────────────────────────────────────────

/** Contas só com login social não têm senha (Account credentials). */
export async function hasPassword(userId: string): Promise<boolean> {
  const acc = await prisma.account.findFirst({
    where:  { userId, provider: "credentials" },
    select: { access_token: true },
  });
  return Boolean(acc?.access_token);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const acc = await prisma.account.findFirst({
    where:  { userId, provider: "credentials" },
    select: { id: true, access_token: true },
  });
  if (!acc?.access_token) throw new AppError("PERFIL_SEM_SENHA");

  const ok = await bcrypt.compare(currentPassword, acc.access_token);
  if (!ok) {
    throw new AppError("PERFIL_SENHA_ATUAL_INCORRETA", {
      errors: { currentPassword: ["Senha atual incorreta"] },
    });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.account.update({ where: { id: acc.id }, data: { access_token: hash } });
}

// ─── Foto ─────────────────────────────────────────────────────────────────────
//
// O arquivo mora no armazenamento do projeto (S3 ou tabela stored_files) e é
// servido por /api/avatar/[userId]. `avatarUrl` guarda esse caminho com ?v=
// (data da troca), para o navegador não mostrar a foto antiga do cache.

const avatarKey = (userId: string) => buildKey(["avatars", userId]);

export async function saveAvatar(userId: string, bytes: Uint8Array): Promise<string> {
  if (bytes.length > AVATAR_MAX_BYTES) throw new AppError("PERFIL_FOTO_GRANDE");
  const mime = avatarMimeFromBytes(bytes);
  if (!mime) throw new AppError("PERFIL_FOTO_INVALIDA");

  await putObject({ key: avatarKey(userId), body: bytes, contentType: mime });
  const avatarUrl = `/api/avatar/${userId}?v=${Date.now()}`;
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
  return avatarUrl;
}

export async function removeAvatar(userId: string): Promise<void> {
  await deleteObject(avatarKey(userId));
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
}

export async function readAvatar(userId: string) {
  return getObjectBuffer(avatarKey(userId));
}

// ─── Exportar meus dados (LGPD, art. 18) ──────────────────────────────────────
//
// Tudo o que é do próprio titular, num JSON. As notas internas do médico
// ficam fora do arquivo do paciente (são do médico). O médico exporta os
// próprios dados de cadastro e de atuação, sem dados de saúde dos pacientes.

export async function exportOwnData(userId: string, role: Role) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      id: true, name: true, email: true, cpf: true, phone: true, role: true, createdAt: true,
      patientProfile: {
        select: {
          birthDate: true, gender: true, bloodType: true, allergies: true, medications: true, notes: true,
          heightCm: true, goalWeightKg: true,
          emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelation: true,
        },
      },
      doctorProfile: {
        select: {
          crm: true, crmState: true, specialty: true, subSpecialty: true, bio: true,
          consultationFee: true, available: true, availableHours: true, approvalStatus: true,
          graduationSchool: true, graduationYear: true, residency: true, languages: true,
        },
      },
    },
  });
  if (!user) throw new AppError("USUARIO_NAO_ENCONTRADO");

  const base = { geradoEm: new Date().toISOString(), plataforma: "Emacrescere", conta: user };

  if (role === "DOCTOR") {
    const [concluidas, receitas] = await Promise.all([
      prisma.consultation.count({ where: { doctorId: userId, status: "COMPLETED" } }),
      prisma.prescription.count({ where: { doctorId: userId, status: "ISSUED" } }),
    ]);
    return { ...base, atuacao: { consultasConcluidas: concluidas, receitasEmitidas: receitas } };
  }

  const [consultas, pesagens] = await Promise.all([
    prisma.consultation.findMany({
      where:   { patientId: userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, status: true, scheduledAt: true, startedAt: true, endedAt: true,
        chiefComplaint: true, diagnosis: true, conduct: true,
        doctor:  { select: { name: true, doctorProfile: { select: { crm: true, crmState: true, specialty: true } } } },
        payment: { select: { method: true, status: true, amount: true, paidAt: true, refundedAt: true } },
        prescription: {
          select: {
            status: true, type: true, issuedAt: true, expiresAt: true, notes: true,
            items: {
              orderBy: { order: "asc" },
              select: { name: true, dosage: true, route: true, frequency: true, duration: true, quantity: true, instructions: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select:  { createdAt: true, content: true, type: true, sender: { select: { name: true } } },
        },
      },
    }),
    prisma.weightRecord.findMany({
      where:   { patientId: userId },
      orderBy: { measuredAt: "asc" },
      select:  { measuredAt: true, weightKg: true, note: true, source: true },
    }),
  ]);

  return { ...base, consultas, pesagens };
}

// ─── Desativar a própria conta ────────────────────────────────────────────────
//
// Não apaga nada: prontuário e receitas precisam ser guardados por 20 anos
// (Lei 13.787/2018), então a conta fica inativa (como na desativação pelo
// admin): o login é recusado e as sessões abertas caem em até 60 s. Um
// administrador pode reativar.

const OPEN_STATUSES = ["SCHEDULED", "WAITING", "IN_PROGRESS"] as const;

export async function deactivateOwnAccount(userId: string, role: Role, password: string | undefined) {
  const acc = await prisma.account.findFirst({
    where:  { userId, provider: "credentials" },
    select: { access_token: true },
  });
  // Conta com senha confirma com a senha; conta Google, com o texto digitado
  // (conferido na validação da rota).
  if (acc?.access_token) {
    if (!password || !(await bcrypt.compare(password, acc.access_token))) {
      throw new AppError("PERFIL_SENHA_ATUAL_INCORRETA", { errors: { password: ["Senha incorreta"] } });
    }
  }

  const abertas = await prisma.consultation.count({
    where: {
      ...(role === "DOCTOR" ? { doctorId: userId } : { patientId: userId }),
      status: { in: [...OPEN_STATUSES] },
    },
  });
  if (abertas > 0) throw new AppError("PERFIL_DESATIVAR_COM_CONSULTAS");

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { active: false } }),
    // Médico some da lista de agendamento.
    ...(role === "DOCTOR"
      ? [prisma.doctorProfile.updateMany({ where: { userId }, data: { available: false } })]
      : []),
  ]);
}
