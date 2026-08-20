/**
 * Seed de dados de teste — cria 1 paciente + 1 médico para usar no fluxo.
 *
 * Uso:
 *   npx tsx prisma/seed-test.ts
 *
 * Logins criados:
 *   Paciente: paciente@teste.com / Senha123
 *   Médico:   doutor@teste.com   / Senha123
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureUser(opts: {
  name:  string;
  email: string;
  cpf:   string;
  role:  "PATIENT" | "DOCTOR" | "ADMIN";
  password: string;
  doctor?: { crm: string; crmState: string; specialty: string; consultationFee: number };
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (existing) {
    console.log(`✓ ${opts.role} já existe: ${opts.email}`);
    return existing;
  }

  const hash = await bcrypt.hash(opts.password, 12);

  const user = await prisma.user.create({
    data: {
      name:  opts.name,
      email: opts.email,
      cpf:   opts.cpf,
      role:  opts.role,
      ...(opts.role === "PATIENT" ? { patientProfile: { create: {} } } : {}),
      ...(opts.role === "DOCTOR" && opts.doctor
        ? {
            doctorProfile: {
              create: {
                crm:             opts.doctor.crm,
                crmState:        opts.doctor.crmState,
                specialty:       opts.doctor.specialty,
                consultationFee: opts.doctor.consultationFee,
              },
            },
          }
        : {}),
      accounts: {
        create: {
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: opts.email,
          access_token:      hash,
        },
      },
    },
  });

  console.log(`✓ Criado ${opts.role}: ${opts.email}`);
  return user;
}

async function main() {
  console.log("Seeding usuários de teste...\n");

  await ensureUser({
    name:     "Paciente Teste",
    email:    "paciente@teste.com",
    cpf:      "11144477735", // CPF de teste válido
    role:     "PATIENT",
    password: "Senha123",
  });

  await ensureUser({
    name:     "Doutor Teste",
    email:    "doutor@teste.com",
    cpf:      "52998224725", // CPF de teste válido
    role:     "DOCTOR",
    password: "Senha123",
    doctor: {
      crm:             "123456",
      crmState:        "SP",
      specialty:       "Endocrinologia",
      consultationFee: 150,
    },
  });

  await ensureUser({
    name:     "Admin Teste",
    email:    "admin@teste.com",
    cpf:      "61184562072", // CPF de teste válido
    role:     "ADMIN",
    password: "Senha123",
  });

  console.log("\n✅ Pronto! Logins:\n");
  console.log("  paciente@teste.com / Senha123");
  console.log("  doutor@teste.com   / Senha123");
  console.log("  admin@teste.com    / Senha123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
