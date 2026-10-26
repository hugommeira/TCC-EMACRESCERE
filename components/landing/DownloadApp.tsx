/* eslint-disable @next/next/no-img-element */

// Seção "Nosso Aplicativo": um único retângulo com as duas formas de usar o
// app, sem títulos separados por aparelho (pedido do grupo):
// - "Baixar APK (Android)": APK hospedado no próprio site (public/app.apk,
//   build arm64, ~35 MB). Só instala no Android.
// - "Nosso Aplicativo Web": versão web do próprio app em /app/ (public/app/),
//   que roda no Android e no iPhone (não há app na App Store). O link é um <a>
//   comum: /app/ é um app estático, não uma página do Next.
// QR codes REAIS, cada um junto da sua opção e escondidos no celular (a pessoa
// já está no aparelho): public/qr-app.svg -> /app.apk e
// public/qr-app-iphone.svg -> /app/. Se a URL do site mudar, gere de novo
// (README, seção do app).
export const APK_PATH = "/app.apk";
export const WEB_APP_PATH = "/app/";

const PRIMARY_BUTTON =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-5 py-3.5 text-base font-semibold text-white shadow-md shadow-brand-500/25 transition-all sm:px-7 duration-200 hover:shadow-lg hover:shadow-brand-500/40 sm:w-auto";
const OPTION =
  "flex flex-col items-center gap-5 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-6";
const QR = "hidden h-40 w-40 rounded-xl border border-slate-200 bg-white p-2 sm:block";

export function DownloadApp() {
  return (
    <section id="app" aria-labelledby="app-titulo" className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-teal-50 p-6 shadow-xl shadow-slate-200/60 sm:p-10">
          <h2
            id="app-titulo"
            className="text-center font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
          >
            Nosso Aplicativo
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
            <div className={OPTION}>
              <img
                src="/qr-app.svg"
                alt="QR code para baixar o APK do app Emacrescere (Android)"
                width={160}
                height={160}
                className={QR}
              />
              <a href={APK_PATH} download="emacrescere.apk" className={PRIMARY_BUTTON}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Baixar APK (Android)
              </a>
            </div>

            <div className={OPTION}>
              <img
                src="/qr-app-iphone.svg"
                alt="QR code para abrir a versão web do app Emacrescere no celular"
                width={160}
                height={160}
                className={QR}
              />
              <a href={WEB_APP_PATH} className={PRIMARY_BUTTON}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
                </svg>
                Nosso Aplicativo Web
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
