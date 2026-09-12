/**
 * Seed de DEMONSTRAÇÃO (trabalho de escola — tudo simulado).
 *
 * Cria pacientes, médicos (credenciados, aguardando aprovação e reprovado),
 * consultas passadas/futuras com prontuário, chat, follow-ups, pagamentos,
 * receitas emitidas/rascunho, certificados e base de medicamentos.
 *
 * É IDEMPOTENTE: roda em todo deploy (vercel.json) e só cria o que ainda
 * não existe (chaves fixas: e-mail, roomToken, asaasPaymentId...). Não toca
 * nas contas do seed original (admin/dr.silva/maria) nem nas criadas de
 * verdade pelo site/app.
 *
 * Senha de TODOS os usuários demo: Demo@12345
 */
import { PrismaClient } from "@prisma/client";
import type { ConsultationStatus, MedicationClass, PrescriptionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@12345";
const DOMAIN = "demo.emacrescere.app";
const FEE = 150;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Data/hora no fuso de Brasília (UTC-3) -> Date em UTC. */
function brt(y: number, m: number, d: number, h = 0, min = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, h + 3, min));
}

function daysFromNow(days: number, hour = 10): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, hour + 3, 0));
  return d;
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

/** CPF válido a partir de uma "semente" de 9 dígitos. */
function cpfFrom(base9: string): string {
  const n = base9.split("").map(Number);
  const dv = (arr: number[], start: number) => {
    const sum = arr.reduce((acc, digit, i) => acc + digit * (start - i), 0);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(n, 10);
  const d2 = dv([...n, d1], 11);
  return `${base9}${d1}${d2}`;
}

function sha256Fake(seed: string): string {
  // Só pra preencher o campo de hash (não é assinatura de verdade).
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(8, "0").repeat(8);
}

// ─── Usuários ────────────────────────────────────────────────────────────────

interface PatientSpec {
  key: string; name: string; cpfBase: string; phone: string;
  birthDate: Date; gender: string; bloodType: string; allergies: string[]; medications: string[];
}

const PATIENTS: PatientSpec[] = [
  { key: "ana.souza",       name: "Ana Souza",        cpfBase: "294837561", phone: "11988001001", birthDate: brt(1991, 3, 14),  gender: "Feminino",  bloodType: "O+",  allergies: ["Dipirona"],              medications: ["Metformina 500mg"] },
  { key: "bruno.lima",      name: "Bruno Lima",       cpfBase: "111444777", phone: "21988001002", birthDate: brt(1985, 7, 2),   gender: "Masculino", bloodType: "A+",  allergies: [],                        medications: [] },
  { key: "carla.mendes",    name: "Carla Mendes",     cpfBase: "135246879", phone: "31988001003", birthDate: brt(1998, 11, 23), gender: "Feminino",  bloodType: "B-",  allergies: ["Penicilina", "Frutos do mar"], medications: ["Levotiroxina 50mcg"] },
  { key: "diego.ferreira",  name: "Diego Ferreira",   cpfBase: "987654321", phone: "41988001004", birthDate: brt(1979, 1, 30),  gender: "Masculino", bloodType: "AB+", allergies: [],                        medications: ["Losartana 50mg"] },
  { key: "elaine.rocha",    name: "Elaine Rocha",     cpfBase: "246813579", phone: "51988001005", birthDate: brt(1988, 9, 9),   gender: "Feminino",  bloodType: "O-",  allergies: ["Látex"],                 medications: [] },
  { key: "felipe.andrade",  name: "Felipe Andrade",   cpfBase: "135792468", phone: "61988001006", birthDate: brt(2001, 5, 17),  gender: "Masculino", bloodType: "A-",  allergies: [],                        medications: [] },
];

interface DoctorSpec {
  key: string; name: string; cpfBase: string; phone: string;
  crm: string; crmState: string; specialty: string; subSpecialty?: string; bio: string;
  approval: "APPROVED" | "PENDING" | "REJECTED";
  crmSituation?: "ATIVO" | "SUSPENSO";
  approvalNote?: string;
  certificate?: boolean;
}

const DOCTORS: DoctorSpec[] = [
  {
    key: "fernanda.costa", name: "Fernanda Costa", cpfBase: "321654987", phone: "11977002001",
    crm: "223344", crmState: "SP", specialty: "Endocrinologia", subSpecialty: "Obesidade e metabolismo",
    bio: "Endocrinologista com foco em tratamento clínico da obesidade e acompanhamento metabólico.",
    approval: "APPROVED", crmSituation: "ATIVO", certificate: true,
  },
  {
    key: "ricardo.alves", name: "Ricardo Alves", cpfBase: "654987321", phone: "21977002002",
    crm: "445566", crmState: "RJ", specialty: "Nutrologia",
    bio: "Nutrólogo, atua com reeducação alimentar e prescrição de suplementação.",
    approval: "APPROVED", crmSituation: "ATIVO", certificate: true,
  },
  {
    key: "marcos.pereira", name: "Marcos Pereira", cpfBase: "789123456", phone: "31977002003",
    crm: "778899", crmState: "MG", specialty: "Clínica Geral",
    bio: "Clínico geral, 8 anos de experiência em atenção primária.",
    approval: "PENDING", crmSituation: "ATIVO",
  },
  {
    key: "juliana.martins", name: "Juliana Martins", cpfBase: "456789123", phone: "41977002004",
    crm: "100999", crmState: "PR", specialty: "Endocrinologia",
    bio: "Endocrinologista.",
    approval: "PENDING", crmSituation: "SUSPENSO",
  },
  {
    key: "otavio.ramos", name: "Otávio Ramos", cpfBase: "159357456", phone: "51977002005",
    crm: "334455", crmState: "RS", specialty: "Nutrologia",
    bio: "Nutrólogo.",
    approval: "REJECTED", crmSituation: "ATIVO",
    approvalNote: "Documentação do CRM não confere com o nome informado. Reenvie a documentação.",
  },
];

async function upsertUser(spec: {
  key: string; name: string; cpfBase: string; phone: string; role: "PATIENT" | "DOCTOR";
}, passwordHash: string) {
  const email = `${spec.key}@${DOMAIN}`;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name:  spec.name,
      email,
      cpf:   cpfFrom(spec.cpfBase),
      phone: spec.phone,
      role:  spec.role,
      accounts: {
        create: {
          type:              "credentials",
          provider:          "credentials",
          providerAccountId: email,
          access_token:      passwordHash,
        },
      },
    },
  });
}

// ─── Medicamentos ────────────────────────────────────────────────────────────

const MEDICATIONS: {
  activeName: string; commercialName?: string; presentation: string; laboratory?: string;
  cls: MedicationClass; controlled?: boolean; defaultDosage?: string; defaultFrequency?: string; defaultRoute?: string;
}[] = [
  { activeName: "Metformina",     commercialName: "Glifage",   presentation: "Comprimido 500mg",            laboratory: "Merck",        cls: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "2x ao dia (após refeições)", defaultRoute: "Oral" },
  { activeName: "Metformina XR",  commercialName: "Glifage XR", presentation: "Comprimido 750mg",           laboratory: "Merck",        cls: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia (jantar)", defaultRoute: "Oral" },
  { activeName: "Semaglutida",    commercialName: "Ozempic",   presentation: "Caneta SC 0,25mg/0,5mg",     laboratory: "Novo Nordisk", cls: "COMUM", defaultDosage: "0,25mg", defaultFrequency: "1x por semana", defaultRoute: "Subcutânea" },
  { activeName: "Semaglutida",    commercialName: "Wegovy",    presentation: "Caneta SC 2,4mg",            laboratory: "Novo Nordisk", cls: "COMUM", defaultDosage: "2,4mg", defaultFrequency: "1x por semana", defaultRoute: "Subcutânea" },
  { activeName: "Liraglutida",    commercialName: "Saxenda",   presentation: "Caneta SC 6mg/mL 3mL",       laboratory: "Novo Nordisk", cls: "COMUM", defaultDosage: "0,6mg", defaultFrequency: "1x ao dia", defaultRoute: "Subcutânea" },
  { activeName: "Tirzepatida",    commercialName: "Mounjaro",  presentation: "Caneta SC 2,5mg/0,5mL",      laboratory: "Eli Lilly",    cls: "COMUM", defaultDosage: "2,5mg", defaultFrequency: "1x por semana", defaultRoute: "Subcutânea" },
  { activeName: "Orlistate",      commercialName: "Xenical",   presentation: "Cápsula 120mg",              laboratory: "Roche",        cls: "COMUM", defaultDosage: "1 cápsula", defaultFrequency: "3x ao dia (com as refeições)", defaultRoute: "Oral" },
  { activeName: "Topiramato",     commercialName: "Topamax",   presentation: "Comprimido 25mg",            laboratory: "Janssen",      cls: "CONTROLE_ESPECIAL", controlled: true, defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia (noite)", defaultRoute: "Oral" },
  { activeName: "Sibutramina",    commercialName: "Biomag",    presentation: "Cápsula 15mg",               laboratory: "Aché",         cls: "B2", controlled: true, defaultDosage: "1 cápsula", defaultFrequency: "1x ao dia (manhã)", defaultRoute: "Oral" },
  { activeName: "Fluoxetina",     commercialName: "Prozac",    presentation: "Cápsula 20mg",               laboratory: "Eli Lilly",    cls: "CONTROLE_ESPECIAL", controlled: true, defaultDosage: "1 cápsula", defaultFrequency: "1x ao dia (manhã)", defaultRoute: "Oral" },
  { activeName: "Vitamina D3",    commercialName: "Addera D3", presentation: "Cápsula 7.000 UI",           laboratory: "Mantecorp",    cls: "COMUM", defaultDosage: "1 cápsula", defaultFrequency: "1x por semana", defaultRoute: "Oral" },
  { activeName: "Amoxicilina",    commercialName: "Amoxil",    presentation: "Cápsula 500mg",              laboratory: "GSK",          cls: "ANTIMICROBIANO", defaultDosage: "1 cápsula", defaultFrequency: "3x ao dia por 7 dias", defaultRoute: "Oral" },
];

async function seedMedications() {
  let created = 0;
  for (const m of MEDICATIONS) {
    const exists = await prisma.medication.findFirst({
      where: { activeName: m.activeName, presentation: m.presentation },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.medication.create({
      data: {
        activeName:       m.activeName,
        commercialName:   m.commercialName ?? null,
        presentation:     m.presentation,
        laboratory:       m.laboratory ?? null,
        class:            m.cls,
        controlled:       m.controlled ?? false,
        defaultDosage:    m.defaultDosage ?? null,
        defaultFrequency: m.defaultFrequency ?? null,
        defaultRoute:     m.defaultRoute ?? null,
      },
    });
    created++;
  }
  console.log(`💊 medicamentos: +${created}`);
}

// ─── Consultas ───────────────────────────────────────────────────────────────

interface ConsultationSpec {
  token: string;                // roomToken fixo (chave de idempotência)
  patient: string;              // key
  doctor: string | "dr.silva";  // key
  status: ConsultationStatus;
  at: Date;                     // scheduledAt (ou null p/ on-demand)
  onDemand?: boolean;
  complaint: string;
  diagnosis?: string;
  conduct?: string;
  notes?: string;
  durationMin?: number;
  payment?: "RECEIVED" | "PENDING" | "REFUNDED";
  method?: "PIX" | "CREDIT_CARD" | "BOLETO";
  messages?: { from: "doctor" | "patient"; text: string }[];
  followUp?: { message: string; response?: string; daysAfter: number };
  prescription?: {
    status: "ISSUED" | "DRAFT";
    type?: PrescriptionType;
    notes?: string;
    items: { name: string; dosage: string; frequency: string; duration?: string; quantity?: string; instructions?: string; continuous?: boolean; route?: string }[];
  };
}

const CONSULTATIONS: ConsultationSpec[] = [
  // ── Ana Souza: acompanhamento contínuo com a Dra. Fernanda ──
  {
    token: "demo-ana-01", patient: "ana.souza", doctor: "fernanda.costa", status: "COMPLETED",
    at: brt(2026, 7, 21, 9, 0), durationMin: 32, payment: "RECEIVED", method: "PIX",
    complaint: "Ganho de peso progressivo nos últimos 2 anos, cansaço e compulsão por doces à noite.",
    diagnosis: "Obesidade grau I (IMC 32,4). Resistência insulínica (HOMA-IR 3,8). TSH normal.",
    conduct: "Iniciar metformina 500mg 2x/dia. Plano alimentar hipocalórico com nutrição. Caminhada 30min 5x/semana. Retorno em 30 dias com exames.",
    notes: "Paciente motivada. Avaliar GLP-1 no retorno se resposta insuficiente.",
    messages: [
      { from: "patient", text: "Boa tarde, doutora! Estou na sala." },
      { from: "doctor",  text: "Boa tarde, Ana. Vamos começar: me conta como tem sido sua rotina de alimentação." },
      { from: "patient", text: "Almoço ok, mas à noite acabo comendo muito doce." },
      { from: "doctor",  text: "Entendi. Vou te passar a receita e as orientações agora, e a nutri entra em contato." },
    ],
    followUp: { message: "Como está a adaptação à metformina? Teve algum desconforto gástrico?", response: "Nos primeiros dias tive enjoo leve, agora está tranquilo. Perdi 1,5kg!", daysAfter: 7 },
    prescription: {
      status: "ISSUED", type: "COMUM", notes: "Tomar após as refeições. Evitar bebida alcoólica.",
      items: [
        { name: "Metformina 500mg", dosage: "1 comprimido", frequency: "2x ao dia (almoço e jantar)", duration: "30 dias", quantity: "60 comprimidos", route: "Oral", continuous: true },
        { name: "Vitamina D3 7.000 UI", dosage: "1 cápsula", frequency: "1x por semana", duration: "8 semanas", quantity: "8 cápsulas", route: "Oral" },
      ],
    },
  },
  {
    token: "demo-ana-02", patient: "ana.souza", doctor: "fernanda.costa", status: "COMPLETED",
    at: brt(2026, 8, 20, 9, 0), durationMin: 25, payment: "RECEIVED", method: "CREDIT_CARD",
    complaint: "Retorno de 30 dias. Trouxe exames.",
    diagnosis: "Obesidade grau I em tratamento. Perda de 3,2kg. Glicemia de jejum 98.",
    conduct: "Manter metformina. Associar semaglutida 0,25mg/semana por 4 semanas, depois 0,5mg. Retorno em 30 dias.",
    messages: [
      { from: "doctor",  text: "Parabéns pela evolução, Ana! 3,2kg em um mês é ótimo." },
      { from: "patient", text: "Obrigada! Estou me sentindo bem melhor." },
    ],
    followUp: { message: "Aplicou a primeira dose da semaglutida? Alguma náusea?", daysAfter: 5 },
    prescription: {
      status: "ISSUED", type: "COMUM", notes: "Aplicar sempre no mesmo dia da semana. Guardar caneta na geladeira.",
      items: [
        { name: "Semaglutida (Ozempic) 0,25mg", dosage: "0,25mg", frequency: "1x por semana", duration: "4 semanas", quantity: "1 caneta", route: "Subcutânea", instructions: "Após 4 semanas, aumentar para 0,5mg conforme orientação." },
        { name: "Metformina 500mg", dosage: "1 comprimido", frequency: "2x ao dia", duration: "30 dias", quantity: "60 comprimidos", route: "Oral", continuous: true },
      ],
    },
  },
  { token: "demo-ana-03", patient: "ana.souza", doctor: "fernanda.costa", status: "SCHEDULED", at: daysFromNow(9, 9), complaint: "Retorno mensal — acompanhamento da semaglutida." },

  // ── Bruno Lima: nutrologia com Dr. Ricardo ──
  {
    token: "demo-bruno-01", patient: "bruno.lima", doctor: "ricardo.alves", status: "COMPLETED",
    at: brt(2026, 8, 5, 14, 0), durationMin: 40, payment: "RECEIVED", method: "PIX",
    complaint: "Quer perder 10kg para uma prova de corrida. Come fora todos os dias.",
    diagnosis: "Sobrepeso (IMC 28,1). Sem comorbidades.",
    conduct: "Reeducação alimentar com foco em proteína e fibras. Sem medicação por ora. Suplementar vitamina D (dosagem 18).",
    messages: [
      { from: "patient", text: "Olá, doutor. Pronto para a consulta." },
      { from: "doctor",  text: "Olá, Bruno! Vamos montar um plano que caiba na sua rotina de almoço fora." },
    ],
    followUp: { message: "Conseguiu seguir o plano nas refeições fora de casa?", response: "Na maioria dos dias sim. Fim de semana é mais difícil.", daysAfter: 10 },
    prescription: {
      status: "ISSUED", type: "COMUM",
      items: [{ name: "Vitamina D3 7.000 UI", dosage: "1 cápsula", frequency: "1x por semana", duration: "12 semanas", quantity: "12 cápsulas", route: "Oral" }],
    },
  },
  { token: "demo-bruno-02", patient: "bruno.lima", doctor: "ricardo.alves", status: "CANCELLED", at: brt(2026, 9, 2, 14, 0), complaint: "Retorno — remarcar, viagem a trabalho." },
  { token: "demo-bruno-03", patient: "bruno.lima", doctor: "ricardo.alves", status: "SCHEDULED", at: daysFromNow(4, 14), complaint: "Retorno após 5 semanas de plano alimentar." },

  // ── Carla Mendes: consulta com Dr. João Silva (seed) ──
  {
    token: "demo-carla-01", patient: "carla.mendes", doctor: "dr.silva", status: "COMPLETED",
    at: brt(2026, 8, 12, 10, 0), durationMin: 28, payment: "RECEIVED", method: "BOLETO",
    complaint: "Hipotireoidismo já tratado, mas peso não baixa. Ansiedade e compulsão.",
    diagnosis: "Obesidade grau I. Hipotireoidismo compensado (TSH 2,1). Transtorno de compulsão alimentar leve.",
    conduct: "Manter levotiroxina. Iniciar topiramato 25mg à noite (controle de compulsão). Encaminhar psicologia. Retorno 30 dias.",
    notes: "Explicado efeito de parestesia do topiramato.",
    messages: [
      { from: "doctor",  text: "Carla, os exames da tireoide estão ótimos. O foco agora é a compulsão." },
      { from: "patient", text: "Que alívio. Aceito tentar o remédio à noite." },
    ],
    prescription: {
      status: "ISSUED", type: "CONTROLE_ESPECIAL", notes: "Receita de controle especial — reter na farmácia.",
      items: [{ name: "Topiramato 25mg", dosage: "1 comprimido", frequency: "1x ao dia (à noite)", duration: "30 dias", quantity: "30 comprimidos", route: "Oral", instructions: "Aumentar para 50mg após 2 semanas se bem tolerado." }],
    },
  },
  { token: "demo-carla-02", patient: "carla.mendes", doctor: "fernanda.costa", status: "SCHEDULED", at: daysFromNow(2, 16), complaint: "Segunda opinião sobre uso de GLP-1." },

  // ── Diego Ferreira ──
  {
    token: "demo-diego-01", patient: "diego.ferreira", doctor: "fernanda.costa", status: "COMPLETED",
    at: brt(2026, 8, 27, 11, 0), durationMin: 35, payment: "RECEIVED", method: "PIX",
    complaint: "Hipertenso, IMC 36. Cardiologista pediu perda de peso.",
    diagnosis: "Obesidade grau II (IMC 36,0). HAS em uso de losartana. Pré-diabetes (HbA1c 6,1).",
    conduct: "Iniciar tirzepatida 2,5mg/semana. Metformina XR 750mg à noite. Dieta DASH hipocalórica. Retorno em 4 semanas.",
    messages: [
      { from: "patient", text: "Boa tarde. Consigo fazer a consulta pelo celular mesmo?" },
      { from: "doctor",  text: "Consegue sim, Diego. Vamos lá." },
      { from: "doctor",  text: "Vou emitir a receita com a caneta semanal e a metformina de liberação prolongada." },
    ],
    followUp: { message: "Como foi a primeira semana com a caneta? Pressão controlada?", daysAfter: 8 },
    prescription: {
      status: "ISSUED", type: "COMUM",
      items: [
        { name: "Tirzepatida (Mounjaro) 2,5mg", dosage: "2,5mg", frequency: "1x por semana", duration: "4 semanas", quantity: "4 canetas", route: "Subcutânea" },
        { name: "Metformina XR 750mg", dosage: "1 comprimido", frequency: "1x ao dia (jantar)", duration: "30 dias", quantity: "30 comprimidos", route: "Oral", continuous: true },
      ],
    },
  },
  { token: "demo-diego-02", patient: "diego.ferreira", doctor: "fernanda.costa", status: "NO_SHOW", at: brt(2026, 9, 8, 11, 0), complaint: "Retorno de 2 semanas." },

  // ── Elaine Rocha: consulta com rascunho de receita ──
  {
    token: "demo-elaine-01", patient: "elaine.rocha", doctor: "ricardo.alves", status: "COMPLETED",
    at: brt(2026, 9, 9, 15, 0), durationMin: 22, payment: "RECEIVED", method: "PIX",
    complaint: "Ganhou 8kg na pandemia e não consegue perder. Dorme mal.",
    diagnosis: "Sobrepeso (IMC 29,4). Suspeita de apneia do sono — solicitar polissonografia.",
    conduct: "Higiene do sono. Plano alimentar. Orlistate com as refeições principais. Retorno com exame do sono.",
    messages: [
      { from: "doctor",  text: "Elaine, o sono ruim atrapalha muito a perda de peso. Vamos investigar." },
      { from: "patient", text: "Faz sentido, acordo cansada todo dia." },
    ],
    prescription: {
      status: "DRAFT", type: "COMUM", notes: "Rascunho — revisar antes de emitir.",
      items: [{ name: "Orlistate 120mg", dosage: "1 cápsula", frequency: "3x ao dia (com as refeições)", duration: "30 dias", quantity: "90 cápsulas", route: "Oral" }],
    },
  },
  { token: "demo-elaine-02", patient: "elaine.rocha", doctor: "ricardo.alves", status: "CANCELLED", at: brt(2026, 8, 30, 15, 0), complaint: "Primeira consulta — cancelada pela paciente." },

  // ── Felipe Andrade: agendamentos futuros e um on-demand aguardando pagamento ──
  { token: "demo-felipe-01", patient: "felipe.andrade", doctor: "ricardo.alves", status: "SCHEDULED", at: daysFromNow(1, 9), complaint: "Quero ganhar massa e perder gordura. Treino 4x por semana." },
  {
    token: "demo-felipe-02", patient: "felipe.andrade", doctor: "dr.silva", status: "COMPLETED",
    at: brt(2026, 7, 30, 8, 0), durationMin: 18, payment: "RECEIVED", method: "PIX",
    complaint: "Check-up geral antes de começar treino intenso.",
    diagnosis: "Eutrófico (IMC 24,2). Exames normais.",
    conduct: "Liberado para atividade física. Orientações gerais de hidratação e sono.",
    messages: [{ from: "doctor", text: "Tudo certo, Felipe. Pode treinar tranquilo." }],
  },
];

async function seedConsultations(userIdByKey: Map<string, string>) {
  let created = 0;
  for (const c of CONSULTATIONS) {
    const patientId = userIdByKey.get(c.patient);
    const doctorId  = userIdByKey.get(c.doctor);
    if (!patientId || !doctorId) { console.warn(`  ! pulando ${c.token}: usuário não encontrado`); continue; }

    const existing = await prisma.consultation.findUnique({ where: { roomToken: c.token }, select: { id: true } });
    if (existing) continue;

    const completed = c.status === "COMPLETED";
    const startedAt = completed ? addMinutes(c.at, 2) : null;
    const endedAt   = completed ? addMinutes(c.at, 2 + (c.durationMin ?? 25)) : (c.status === "CANCELLED" || c.status === "NO_SHOW" ? addMinutes(c.at, 30) : null);

    const consultation = await prisma.consultation.create({
      data: {
        patientId,
        doctorId,
        status:         c.status,
        scheduledAt:    c.onDemand ? null : c.at,
        enqueuedAt:     c.onDemand ? c.at : null,
        claimedAt:      c.onDemand && completed ? startedAt : null,
        startedAt,
        endedAt,
        chiefComplaint: c.complaint,
        diagnosis:      c.diagnosis ?? null,
        conduct:        c.conduct ?? null,
        notes:          c.notes ?? null,
        roomToken:      c.token,
        createdAt:      addMinutes(c.at, -60 * 24 * 3), // marcada 3 dias antes
      },
    });
    created++;

    // Pagamento
    if (c.payment) {
      await prisma.payment.create({
        data: {
          consultationId: consultation.id,
          asaasPaymentId: `demo_${c.token}`,
          method:         c.method ?? "PIX",
          status:         c.payment,
          amount:         FEE,
          paidAt:         c.payment === "RECEIVED" ? addMinutes(c.at, -60 * 24) : null,
          expiresAt:      addMinutes(c.at, 60 * 24),
          metadata:       { demo: true } as object,
        },
      });
    }

    // Chat
    if (c.messages && c.messages.length > 0) {
      let t = startedAt ?? c.at;
      for (const m of c.messages) {
        t = addMinutes(t, 2);
        await prisma.message.create({
          data: {
            consultationId: consultation.id,
            senderId:       m.from === "doctor" ? doctorId : patientId,
            content:        m.text,
            type:           "TEXT",
            readAt:         addMinutes(t, 1),
            createdAt:      t,
          },
        });
      }
    }

    // Follow-up
    if (c.followUp) {
      const scheduledAt = addMinutes(c.at, 60 * 24 * c.followUp.daysAfter);
      const answered = Boolean(c.followUp.response);
      await prisma.followUp.create({
        data: {
          consultationId: consultation.id,
          message:        c.followUp.message,
          scheduledAt,
          status:         answered ? "RESPONDED" : "PENDING",
          sentAt:         answered ? scheduledAt : null,
          response:       c.followUp.response ?? null,
          respondedAt:    answered ? addMinutes(scheduledAt, 60 * 5) : null,
        },
      });
    }

    // Receita
    if (c.prescription) {
      const issued = c.prescription.status === "ISSUED";
      const issuedAt = issued ? (endedAt ?? c.at) : null;
      await prisma.prescription.create({
        data: {
          consultationId: consultation.id,
          doctorId,
          patientId,
          status:    c.prescription.status,
          type:      c.prescription.type ?? "COMUM",
          notes:     c.prescription.notes ?? null,
          issuedAt,
          expiresAt: issuedAt ? addMinutes(issuedAt, 60 * 24 * 30) : null,
          // Assinatura SIMULADA: não há PDF assinado no storage (signedPdfKey
          // null), então "Baixar PDF" não funciona pra estas — é só demonstração.
          signatureCN:     issued ? `${userNameByKey.get(c.doctor) ?? "Médico"}:${cpfFrom("000000001")}` : null,
          signatureSerial: issued ? `DEMO-${c.token.toUpperCase()}` : null,
          signatureHash:   issued ? sha256Fake(c.token) : null,
          items: {
            create: c.prescription.items.map((it, i) => ({
              name:         it.name,
              dosage:       it.dosage,
              frequency:    it.frequency,
              duration:     it.duration ?? null,
              quantity:     it.quantity ?? null,
              instructions: it.instructions ?? null,
              route:        it.route ?? null,
              continuous:   it.continuous ?? false,
              order:        i,
            })),
          },
        },
      });
    }
  }
  console.log(`🩺 consultas: +${created}`);
}

const userNameByKey = new Map<string, string>();

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎭 Seed de demonstração (idempotente)...");
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userIdByKey = new Map<string, string>();

  // Médico do seed original (pode não existir em outro banco)
  const silva = await prisma.user.findUnique({ where: { email: "dr.silva@telemed.com.br" }, select: { id: true, name: true } });
  if (silva) { userIdByKey.set("dr.silva", silva.id); userNameByKey.set("dr.silva", silva.name); }

  // Pacientes
  let newPatients = 0;
  for (const p of PATIENTS) {
    const before = await prisma.user.findUnique({ where: { email: `${p.key}@${DOMAIN}` }, select: { id: true } });
    const user = await upsertUser({ ...p, role: "PATIENT" }, hash);
    userIdByKey.set(p.key, user.id);
    userNameByKey.set(p.key, user.name);
    if (!before) newPatients++;
    await prisma.patientProfile.upsert({
      where:  { userId: user.id },
      update: {},
      create: {
        userId:      user.id,
        birthDate:   p.birthDate,
        gender:      p.gender,
        bloodType:   p.bloodType,
        allergies:   p.allergies,
        medications: p.medications,
      },
    });
  }
  console.log(`👤 pacientes: +${newPatients}`);

  // Médicos
  let newDoctors = 0;
  for (const d of DOCTORS) {
    const before = await prisma.user.findUnique({ where: { email: `${d.key}@${DOMAIN}` }, select: { id: true } });
    const user = await upsertUser({ ...d, role: "DOCTOR" }, hash);
    userIdByKey.set(d.key, user.id);
    userNameByKey.set(d.key, user.name);
    if (!before) newDoctors++;

    const verifiedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5);
    const situation  = d.crmSituation ?? "ATIVO";
    await prisma.doctorProfile.upsert({
      where:  { userId: user.id },
      update: {},
      create: {
        userId:          user.id,
        crm:             d.crm,
        crmState:        d.crmState,
        specialty:       d.specialty,
        subSpecialty:    d.subSpecialty ?? null,
        bio:             d.bio,
        consultationFee: FEE,
        available:       d.approval === "APPROVED",
        availableHours:  { mon: ["08:00", "18:00"], tue: ["08:00", "18:00"], wed: ["08:00", "18:00"], thu: ["08:00", "18:00"], fri: ["08:00", "17:00"] },
        approvalStatus:  d.approval,
        approvalNote:    d.approvalNote ?? null,
        approvedAt:      d.approval === "PENDING" ? null : verifiedAt,
        crmVerifiedAt:   verifiedAt,
        crmVerification: {
          crm: d.crm, crmState: d.crmState, valid: situation === "ATIVO", situation,
          registeredName: d.name, source: "simulado", checkedAt: verifiedAt.toISOString(),
          message: situation === "ATIVO"
            ? `CRM ${d.crm}/${d.crmState} ativo (verificação simulada).`
            : `CRM ${d.crm}/${d.crmState} consta como SUSPENSO no conselho (verificação simulada).`,
        } as object,
      },
    });

    // Certificado digital SIMULADO (só metadados; não há .pfx no storage —
    // emitir receita de verdade continua exigindo um A1 real).
    if (d.certificate) {
      await prisma.medicalCertificate.upsert({
        where:  { doctorId: user.id },
        update: {},
        create: {
          doctorId:          user.id,
          s3Key:             `demo/certificates/${d.key}.pfx`,
          fileName:          `${d.key}-a1.pfx`,
          encryptedPassword: "demo",
          subjectCN:         `${d.name.toUpperCase()}:${cpfFrom(d.cpfBase)}`,
          issuerCN:          "AC DEMO ICP-Brasil (simulado)",
          serialNumber:      `DEMO${d.crm}`,
          validFrom:         new Date(Date.now() - 1000 * 60 * 60 * 24 * 120),
          validTo:           new Date(Date.now() + 1000 * 60 * 60 * 24 * 245),
          active:            true,
        },
      });
    }
  }
  console.log(`🩺 médicos: +${newDoctors}`);

  await seedMedications();
  await seedConsultations(userIdByKey);

  console.log("✅ Seed de demonstração concluído.");
}

main()
  .catch((e) => {
    console.error("❌ seed-demo falhou:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
