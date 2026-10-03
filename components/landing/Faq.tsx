"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "O que é a Emacrescere?",
    a: "Somos uma plataforma de telessaúde que conecta pacientes a médicos especialistas em obesidade e doenças metabólicas. A condução clínica e qualquer eventual prescrição são decisão exclusiva do médico responsável, em consulta individualizada.",
  },
  {
    q: "Como funciona a prescrição?",
    // Antes dizia que a plataforma não emitia receitas (o médico usaria o
    // Portal do CFM). A receita é emitida aqui, assinada com o certificado
    // digital do médico (services/api/prescription.ts, lib/sign-pdf.ts).
    a: "Se o médico indicar um tratamento com medicamento, ele emite a receita aqui mesmo, assinada com o certificado digital dele, conforme a Resolução CFM 2.314/2022. A receita fica no seu painel, com a data de validade.",
  },
  {
    q: "A plataforma indica ou vende medicamentos?",
    a: "Não. A Emacrescere não comercializa, indica nem dispensa medicamentos. Toda decisão clínica é do médico, e qualquer medicamento é adquirido em farmácias autorizadas mediante apresentação de receita válida.",
  },
  {
    q: "Como adquiro o medicamento se for prescrito?",
    a: "Caso o médico prescreva, você baixa a receita no seu painel e pode comprar o medicamento em qualquer farmácia autorizada, conforme as regras da ANVISA.",
  },
  {
    q: "Sou médico. Como me cadastro?",
    // A "área profissional" citada aqui não existia; agora é /auth/register/medico.
    // Farmácia não tem cadastro próprio (o perfil administrativo faz esse papel).
    a: "Médicos se cadastram pela área profissional (link \"É médico?\" na tela de cadastro), informando o CRM. Verificamos a situação do registro e a equipe aprova o credenciamento antes de liberar os atendimentos.",
  },
  {
    q: "Posso cancelar a consulta? Recebo o dinheiro de volta?",
    a: "Sim. Cancelando com 24 horas ou mais de antecedência, o valor é estornado integralmente pela mesma forma de pagamento. Com menos de 24 horas, ou em caso de falta, não há estorno. Se o médico cancelar, o estorno é sempre integral. Você cancela pela própria página da consulta.",
  },
  {
    q: "Os dados de saúde ficam protegidos?",
    // A resposta anterior prometia "criptografia de ponta a ponta", o que não
    // corresponde à implementação. Esta lista só afirma o que o código faz.
    a: "Seguimos a LGPD. Todo o tráfego é cifrado por HTTPS, as senhas são guardadas como hash bcrypt (nunca em texto), o prontuário só é acessível ao próprio paciente e ao médico responsável por aquela consulta, e o CPF nunca é devolvido nas respostas da API. Ações sensíveis ficam registradas em log de auditoria com autor, data e origem.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(1);

  return (
    <section id="faq" className="border-y border-brand-100 bg-brand-50 py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Perguntas frequentes
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Tire suas dúvidas
        </h2>

        <ul className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li
                key={item.q}
                className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition-all duration-200 ${
                  isOpen ? "ring-brand-200" : "ring-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                >
                  <span className="text-base font-medium text-slate-900">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all duration-200 ${
                      isOpen ? "rotate-180 bg-brand-500 text-white" : ""
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d={isOpen ? "M5 12h14" : "M12 5v14M5 12h14"} />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-${i}`}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
