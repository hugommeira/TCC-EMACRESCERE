import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Super Admin ────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@12345", 12);

  const admin = await prisma.user.upsert({
    where:  { email: "admin@telemed.com.br" },
    update: {},
    create: {
      name:  "Administrador TeleMed",
      email: "admin@telemed.com.br",
      cpf:   "00000000000",
      role:  "SUPER_ADMIN",
      accounts: {
        create: {
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: "admin@telemed.com.br",
          access_token:      adminHash,
        },
      },
    },
  });

  console.log(`✅ Admin criado: ${admin.email}`);

  // ─── Médico demo ─────────────────────────────────────────────────────────────
  const doctorHash = await bcrypt.hash("Doctor@12345", 12);

  const doctor = await prisma.user.upsert({
    where:  { email: "dr.silva@telemed.com.br" },
    update: {},
    create: {
      name:  "Dr. João Silva",
      email: "dr.silva@telemed.com.br",
      cpf:   "11111111111",
      role:  "DOCTOR",
      accounts: {
        create: {
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: "dr.silva@telemed.com.br",
          access_token:      doctorHash,
        },
      },
      doctorProfile: {
        create: {
          crm:             "123456",
          crmState:        "SP",
          specialty:       "Clínica Geral",
          bio:             "Médico com 10 anos de experiência em clínica geral e medicina preventiva.",
          consultationFee: 150.00,
          available:       true,
          availableHours: {
            mon: ["08:00", "18:00"],
            tue: ["08:00", "18:00"],
            wed: ["08:00", "18:00"],
            thu: ["08:00", "18:00"],
            fri: ["08:00", "17:00"],
          },
        },
      },
    },
  });

  console.log(`✅ Médico criado: ${doctor.email}`);

  // ─── Paciente demo ────────────────────────────────────────────────────────────
  const patientHash = await bcrypt.hash("Patient@12345", 12);

  const patient = await prisma.user.upsert({
    where:  { email: "maria@email.com" },
    update: {},
    create: {
      name:  "Maria Oliveira",
      email: "maria@email.com",
      cpf:   "22222222222",
      phone: "11999999999",
      role:  "PATIENT",
      accounts: {
        create: {
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: "maria@email.com",
          access_token:      patientHash,
        },
      },
      patientProfile: {
        create: {
          birthDate: new Date("1990-05-15"),
          gender:    "Feminino",
          bloodType: "A+",
          allergies: ["Dipirona"],
        },
      },
    },
  });

  console.log(`✅ Paciente criado: ${patient.email}`);

  // ─── Consulta demo ────────────────────────────────────────────────────────────
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 2);
  scheduledAt.setHours(10, 0, 0, 0);

  const consultation = await prisma.consultation.upsert({
    where:  { roomToken: "demo-room-token-001" },
    update: {},
    create: {
      patientId:      patient.id,
      doctorId:       doctor.id,
      scheduledAt,
      chiefComplaint: "Consulta de rotina – check-up geral",
      roomToken:      "demo-room-token-001",
      status:         "SCHEDULED",
    },
  });

  console.log(`✅ Consulta demo criada: ${consultation.id}`);

  console.log("\n🎉 Seed concluído!\n");
  console.log("Credenciais de acesso:");
  console.log("  Admin:    admin@telemed.com.br   / Admin@12345");
  console.log("  Médico:   dr.silva@telemed.com.br / Doctor@12345");
  console.log("  Paciente: maria@email.com          / Patient@12345\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
