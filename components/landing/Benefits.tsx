"use client";

import { useRef } from "react";
import { Photo } from "./Photo";
import { PHOTOS } from "./photos";

// O que o paciente encontra na plataforma, cada item com uma foto. Mesmo
// conteúdo da antiga grade de benefícios, sem prometer resultado clínico.
const ITEMS = [
  {
    title: "Médicos com CRM verificado",
    description: "Especialistas em obesidade e doenças metabólicas, aprovados pela equipe depois de conferido o CRM.",
    photo: PHOTOS.doctor,
    alt: "Médica sorrindo no consultório",
  },
  {
    title: "Consulta por vídeo",
    description: "Entre na fila on-demand ou marque um horário. O médico chama você na sala da consulta.",
    photo: PHOTOS.videoCall,
    alt: "Médico atendendo com um tablet nas mãos",
  },
  {
    title: "Receita com assinatura digital",
    description: "Se o médico indicar, a receita sai na plataforma, assinada com o certificado ICP-Brasil dele.",
    photo: PHOTOS.tablet,
    alt: "Profissional de saúde usando um tablet",
  },
  {
    title: "Exames e evolução",
    description: "Envie exames e registre o peso. Você e o médico acompanham o mesmo histórico.",
    photo: PHOTOS.hero,
    alt: "Pessoa medindo a glicemia com glicosímetro",
  },
  {
    title: "Orientação nutricional",
    description: "Guias sobre alimentação saudável. Não substituem a consulta com nutricionista.",
    photo: PHOTOS.food,
    alt: "Prato com vegetais frescos",
  },
  {
    title: "Rotina e movimento",
    description: "O acompanhamento olha para o seu dia a dia, não só para a balança.",
    photo: PHOTOS.activity,
    alt: "Pessoa se exercitando ao ar livre",
  },
];

export function Benefits() {
  const rail = useRef<HTMLUListElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section id="jornada" aria-labelledby="jornada-titulo" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 id="jornada-titulo" className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-ink-950 sm:text-5xl">
              Tudo o que o acompanhamento precisa, num lugar só
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">
              Consulta, receita, exames e evolução ficam juntos. Você não repete
              sua história a cada atendimento.
            </p>
          </div>

          <div className="hidden gap-2.5 md:flex">
            <RailButton label="Anterior" onClick={() => scroll(-1)} d="M15 6l-6 6 6 6" />
            <RailButton label="Próximo" onClick={() => scroll(1)} d="M9 6l6 6-6 6" />
          </div>
        </div>
      </div>

      {/* Trilho alinhado à grade à esquerda e sangrando à direita */}
      <ul
        ref={rail}
        className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] sm:px-6 lg:px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))] lg:scroll-px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))] [&::-webkit-scrollbar]:hidden"
      >
        {ITEMS.map((item) => (
          <li
            key={item.title}
            className="group relative h-[420px] w-[78%] flex-none snap-start overflow-hidden rounded-3xl sm:w-[300px] lg:h-[440px]"
          >
            <Photo
              src={item.photo}
              alt={item.alt}
              sizes="(min-width: 640px) 300px, 78vw"
              className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-brand-950/90" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/80">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RailButton({ label, onClick, d }: { label: string; onClick: () => void; d: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-16 w-12 place-items-center rounded-full border border-ink-200 text-ink-800 transition-colors duration-200 hover:border-ink-800 hover:bg-ink-950 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d} />
      </svg>
    </button>
  );
}
