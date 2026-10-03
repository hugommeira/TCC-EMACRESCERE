const ITEMS = [
  {
    title: "Consulta por vídeo",
    detail: "sem sair de casa",
    icon: <path d="M15 10l4.5-2.5v9L15 14M3 7h12v10H3z" />,
  },
  {
    title: "Fila ou hora marcada",
    detail: "você escolhe",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    title: "Receita digital",
    detail: "quando o médico indicar",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h4" />
      </>
    ),
  },
  {
    title: "CRM verificado",
    detail: "de cada médico",
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Pix, cartão ou boleto",
    detail: "pagamento seguro",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
  },
];

export function TrustBar() {
  return (
    <div className="border-y border-ink-100 bg-white">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-5 px-4 py-7 sm:px-6 md:grid-cols-3 lg:grid-cols-5 lg:px-8">
        {ITEMS.map((item) => (
          <li key={item.title} className="flex items-center gap-3.5">
            <span aria-hidden className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-ink-50 text-brand-700">
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                {item.icon}
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink-950">{item.title}</span>
              <span className="block text-[13px] text-ink-500">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
