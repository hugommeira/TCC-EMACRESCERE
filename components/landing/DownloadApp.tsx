/* eslint-disable @next/next/no-img-element */

// Dois caminhos para o app, lado a lado:
// - Android: APK hospedado no próprio site (public/app.apk). O QR code REAL
//   (public/qr-app.svg) aponta para ele.
// - iPhone: não tem app na App Store; a versão web do próprio app roda em
//   /app/ (public/app/) e se instala pelo Safari em "Adicionar à Tela de
//   Início". O link é um <a> comum: /app/ é um app estático, não uma página
//   do Next.
// QR codes REAIS: public/qr-app.svg (Android) e public/qr-app-iphone.svg
// (iPhone). Se a URL do site mudar, gere de novo (README, seção do app).
export const APK_PATH = "/app.apk";
export const IPHONE_APP_PATH = "/app/";

const STEP_NUMBER = "font-semibold text-brand-700";
const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-7 py-3.5 text-base font-semibold text-white shadow-md shadow-brand-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/40";

export function DownloadApp() {
  return (
    <section id="app" className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
            App Android e iPhone
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Leve o acompanhamento no bolso
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Consultas agendadas, chat com o médico, receitas e evolução de peso —
            tudo no app Emacrescere. No Android, baixe o app; no iPhone, use pelo
            Safari e adicione à tela de início.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* ── Android ─────────────────────────────────────────────────── */}
          <article
            aria-labelledby="app-android"
            className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8"
          >
            <h3 id="app-android" className="font-display text-2xl font-semibold text-slate-900">
              Android
            </h3>

            <div className="mt-5 flex flex-1 flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex-1">
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2"><span className={STEP_NUMBER}>1.</span><span className="min-w-0">Baixe o arquivo <code className="rounded bg-slate-100 px-1">app.apk</code> no Android.</span></li>
                  <li className="flex gap-2"><span className={STEP_NUMBER}>2.</span><span className="min-w-0">Ao abrir, permita a instalação de apps desta fonte (o Android pede uma vez).</span></li>
                  <li className="flex gap-2"><span className={STEP_NUMBER}>3.</span><span className="min-w-0">Entre com a mesma conta do site.</span></li>
                </ol>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href={APK_PATH} download="emacrescere.apk" className={PRIMARY_BUTTON}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                    Baixar APK (Android)
                  </a>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Versão de teste (arm64, ~19 MB). Distribuição pela Google Play em breve.
                </p>
              </div>

              {/* No celular o QR não serve (a pessoa já está no aparelho): fica só o botão. */}
              <figure className="hidden flex-none sm:block">
                <img
                  src="/qr-app.svg"
                  alt="QR code para baixar o app Emacrescere no Android"
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-xl border border-slate-200 bg-white p-2"
                />
                <figcaption className="mt-2 text-center text-xs text-slate-500">
                  Escaneie no Android
                </figcaption>
              </figure>
            </div>
          </article>

          {/* ── iPhone ──────────────────────────────────────────────────── */}
          <article
            aria-labelledby="app-iphone"
            className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8"
          >
            <h3 id="app-iphone" className="font-display text-2xl font-semibold text-slate-900">
              iPhone
            </h3>

            <div className="mt-5 flex flex-1 flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex-1">
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2"><span className={STEP_NUMBER}>1.</span><span className="min-w-0">Abra <code className="rounded bg-slate-100 px-1 [overflow-wrap:anywhere]">tcc-emacrescere.vercel.app/app</code> no Safari do iPhone.</span></li>
                  <li className="flex gap-2"><span className={STEP_NUMBER}>2.</span><span className="min-w-0">Toque em Compartilhar (o quadrado com a seta para cima).</span></li>
                  <li className="flex gap-2"><span className={STEP_NUMBER}>3.</span><span className="min-w-0">Toque em &ldquo;Adicionar à Tela de Início&rdquo; e depois em &ldquo;Adicionar&rdquo;.</span></li>
                  <li className="flex gap-2"><span className={STEP_NUMBER}>4.</span><span className="min-w-0">Abra pelo ícone e entre com a mesma conta do site.</span></li>
                </ol>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href={IPHONE_APP_PATH} className={PRIMARY_BUTTON}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="6" y="2" width="12" height="20" rx="2.5" />
                      <path d="M11 18h2" />
                    </svg>
                    Abrir no iPhone
                  </a>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Sem App Store: o app abre direto pelo Safari, em tela cheia.
                </p>
              </div>

              {/* QR REAL (public/qr-app-iphone.svg) → https://tcc-emacrescere.vercel.app/app/ */}
              <figure className="hidden flex-none sm:block">
                <img
                  src="/qr-app-iphone.svg"
                  alt="QR code para abrir o app Emacrescere no iPhone"
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-xl border border-slate-200 bg-white p-2"
                />
                <figcaption className="mt-2 text-center text-xs text-slate-500">
                  Escaneie no iPhone
                </figcaption>
              </figure>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
