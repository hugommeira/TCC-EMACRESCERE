# Emacrescere — app (Flutter)

App do Emacrescere para **paciente e médico**, em Flutter. Ele consome a API do
site (Next.js, raiz deste repositório) e nunca acessa o banco direto.

- **Android:** APK publicado em `public/app.apk` do site
  (https://tcc-emacrescere.vercel.app/app.apk).
- **iPhone:** versão web do próprio app, servida pelo site em
  https://tcc-emacrescere.vercel.app/app/ (instalada pelo Safari em
  "Adicionar à Tela de Início"); os arquivos ficam em `public/app/`.

Documentação do app:

- [`HANDOFF.md`](HANDOFF.md) — contexto, estado atual, build (APK e web) e
  deploy na Vercel.
- [`CLAUDE.md`](CLAUDE.md) — regras e arquitetura para quem for editar o app.
- [`HANDOFF-app-frentes-ABC.md`](HANDOFF-app-frentes-ABC.md) — registro das
  frentes A (agendar com pagamento), B (tirar a fila) e C (peso pela API).

Do site: [`../README.md`](../README.md) e [`../PROJETO-STATUS.md`](../PROJETO-STATUS.md).
