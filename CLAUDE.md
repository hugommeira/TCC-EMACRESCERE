# Emacrescere — guia para o Claude

Plataforma de telessaúde (Next.js 14, React 18, TypeScript, Tailwind, Prisma)
que liga pacientes a médicos para acompanhamento de obesidade e doenças
metabólicas.

## Regras que valem sempre

- A plataforma **não vende, indica nem dispensa medicamentos**; toda conduta
  clínica e qualquer prescrição são decisão do médico. Nenhum texto, imagem
  ou 3D pode sugerir o contrário nem prometer resultado.
- Paciente e médico são experiências **diferentes** (o médico usa o tom escuro).
- Textos de segurança só afirmam o que o código faz.
- Nunca rode `prisma db push --accept-data-loss`.

## Onde está cada coisa

- Continuar o front-end (regras visuais, o que já foi feito, próximos passos):
  `docs/frontend-handoff.md`. Diagnóstico técnico: `docs/frontend-diagnostico.md`.
- **Assets 3D / Blender:** `docs/3d/BRIEFING.md` (comece por ele), depois
  `ASSETS.md`, `EXPORT.md` e `STATUS.md`. Skills em `.claude/skills`.

## Antes de enviar mudanças de código

```bash
npx tsc --noEmit | grep -c "error TS"   # não pode passar de 60 (dívida antiga)
npx next lint --dir components --dir app
npx vitest run
```
