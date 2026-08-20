/**
 * Seed da base de medicamentos.
 *
 * Uso: npx tsx prisma/seed-medications.ts
 */

import { PrismaClient } from "@prisma/client";
import { MEDICATIONS } from "./medications-dataset";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seedando ${MEDICATIONS.length} medicamentos da base ANVISA curada...\n`);

  let created = 0;
  let updated = 0;

  for (const m of MEDICATIONS) {
    // Chave de unicidade lógica: activeName + presentation + commercialName
    const existing = await prisma.medication.findFirst({
      where: {
        activeName:     m.activeName,
        presentation:   m.presentation,
        commercialName: m.commercialName ?? null,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.medication.update({
        where: { id: existing.id },
        data: {
          laboratory:       m.laboratory       ?? null,
          class:            m.class,
          controlled:       m.controlled       ?? false,
          defaultDosage:    m.defaultDosage    ?? null,
          defaultFrequency: m.defaultFrequency ?? null,
          defaultRoute:     m.defaultRoute     ?? null,
        },
      });
      updated++;
    } else {
      await prisma.medication.create({
        data: {
          activeName:       m.activeName,
          commercialName:   m.commercialName   ?? null,
          presentation:     m.presentation,
          laboratory:       m.laboratory       ?? null,
          class:            m.class,
          controlled:       m.controlled       ?? false,
          defaultDosage:    m.defaultDosage    ?? null,
          defaultFrequency: m.defaultFrequency ?? null,
          defaultRoute:     m.defaultRoute     ?? null,
        },
      });
      created++;
    }
  }

  console.log(`✅ ${created} criados, ${updated} atualizados`);
  const total = await prisma.medication.count();
  console.log(`📦 Total no banco: ${total} medicamentos\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
