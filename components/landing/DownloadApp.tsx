/* eslint-disable @next/next/no-img-element */

// QR code REAL (public/qr-app.svg, gerado a partir da URL abaixo) que aponta
// pro APK Android hospedado no próprio site (public/app.apk). Se a URL do
// site mudar, gere o SVG de novo (ver docs no README, seção "App Android").
export const APK_PATH = "/app.apk";

export function DownloadApp() {
  return (
    <section id="app" className="relative overflow-hidden bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
              App Android
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Leve o acompanhamento no bolso
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              Consulta on-demand, chat com o médico, receitas e evolução de peso —
              tudo no app Emacrescere. Aponte a câmera do celular para o QR code
              ou toque no botão para baixar.
            </p>

            <ol className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-semibold text-brand-700">1.</span> Baixe o arquivo <code className="rounded bg-slate-100 px-1">app.apk</code> no Android.</li>
              <li className="flex gap-2"><span className="font-semibold text-brand-700">2.</span> Ao abrir, permita a instalação de apps desta fonte (o Android pede uma vez).</li>
              <li className="flex gap-2"><span className="font-semibold text-brand-700">3.</span> Entre com a mesma conta do site.</li>
            </ol>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={APK_PATH}
                download="emacrescere.apk"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-7 py-3.5 text-base font-semibold text-white shadow-md shadow-brand-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/40"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Baixar APK (Android)
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Versão de teste (arm64, ~19 MB). Distribuição pela Google Play em breve.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
              <img
                src="/qr-app.svg"
                alt="QR code para baixar o app Emacrescere"
                width={260}
                height={260}
                className="h-[260px] w-[260px]"
              />
              <p className="mt-4 text-center text-sm font-medium text-slate-700">Escaneie para baixar</p>
              <p className="mt-1 text-center text-xs text-slate-400">tcc-emacrescere.vercel.app/app.apk</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
