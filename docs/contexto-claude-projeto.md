# Emacrescere — contexto do projeto para o Claude

> **Como usar:** este arquivo vai no conhecimento do projeto no claude.ai. Ele
> resume o sistema, as regras e o estado atual, para o Claude responder sem ter
> acesso ao repositório. Atualizado em **05/10/2026**. Quando algo mudar, a
> fonte de verdade é o repositório (`README.md`, `PROJETO-STATUS.md`,
> `CLAUDE.md`); atualize este arquivo a partir deles.

## 1. O projeto

- **Emacrescere**: plataforma de telessaúde para acompanhamento médico do
  emagrecimento, com atendimento **só por consulta agendada**.
- TCC da Escola Técnica Pandiá Calógeras, Técnico de Informática, Equipe 6.
  **Banca em 03/11/2026.** Quebrar o que já funciona custa mais do que faltar
  funcionalidade.
- **Hugo Meira Maia** cuida do site, do GitHub, da Vercel e dos serviços, e é
  quem faz os merges na `main` (merge publica o site). **Julia** cuida do app
  Flutter (pasta `mobile/`).
- Site: https://tcc-emacrescere.vercel.app · app no iPhone:
  https://tcc-emacrescere.vercel.app/app/ · APK Android:
  https://tcc-emacrescere.vercel.app/app.apk · repositório:
  https://github.com/hugommeira/TCC-EMACRESCERE
- Responda em português, de forma simples e direta.

## 2. O que o sistema faz

- **Paciente:** cadastro (e-mail/senha ou Google), agenda consulta com um médico
  num horário livre da agenda dele, paga (Pix, cartão ou boleto), entra na
  consulta por vídeo, conversa por chat, recebe receita digital assinada e
  acompanha **peso e IMC** num gráfico.
- **Médico:** cadastro com CRM (aprovado pela equipe), agenda própria, sala da
  consulta com vídeo, chat, prontuário com salvamento automático, aba de peso do
  paciente, emissão de receita assinada com o certificado digital dele.
- **Administrador:** aprova médicos; vê consultas, pagamentos, receitas,
  certificados e o log de auditoria.
- **Qualquer pessoa:** valida uma receita pelo link impresso no PDF
  (`/prescricao/{id}`), sem login.
- **App** (Flutter): paciente e médico no celular. Android por APK; iPhone pela
  versão web do próprio app, instalada pelo Safari ("Adicionar à Tela de Início").

## 3. Regras de produto (valem para qualquer texto, tela ou resposta)

- A plataforma **não vende, não indica e não entrega medicamentos**. Toda
  conduta clínica e qualquer prescrição são decisão do médico. Nada pode
  prometer resultado. Não existem "farmácias parceiras".
- A receita é emitida **na própria plataforma**, assinada com o certificado
  digital do médico. Não é pelo Portal do CFM. Não se promete ICP-Brasil: os
  médicos de demonstração usam certificado de teste, sem validade jurídica.
- Textos só afirmam o que o sistema faz. Sem números, depoimentos ou parcerias
  inventados (os depoimentos da página inicial são histórias ilustrativas
  rotuladas como tal).
- **Só consulta agendada.** A fila de atendimento imediato (on-demand) foi
  descartada pelo grupo e ficou desligada no código (`QUEUE_ENABLED` no site,
  `kQueueEnabled` no app); nenhum texto fala em fila.
- **Cancelamento:** reembolso integral com 24 h ou mais de antecedência; com
  menos de 24 h ou falta do paciente, sem reembolso; se o médico cancelar,
  sempre integral. Consulta não paga segura o horário por 30 minutos.
- Paciente e médico têm experiências visuais diferentes (o médico usa tom escuro).

## 4. Tecnologia

| Camada | Tecnologia |
|---|---|
| Site | Next.js 14 (App Router), React 18, TypeScript strict, Tailwind 3 |
| 3D | three.js + `@react-three/fiber`/drei (3 modelos: logo, celular, selo) |
| Banco | PostgreSQL no Neon (`sa-east-1`) com Prisma 5 |
| Login | NextAuth v5: e-mail/senha, Google (ativo), Facebook (sem credenciais) |
| Pagamento | Asaas (sandbox) |
| Vídeo | LiveKit Cloud |
| E-mail | Resend (sandbox: só entrega ao dono da conta) |
| Testes | Vitest (62 testes) |
| App | Flutter, em `mobile/` |
| Deploy | Vercel, região São Paulo (`gru1`), automático a cada push na `main` |

### Arquitetura em poucas linhas

- **Login em duas partes:** `lib/auth.config.ts` (leve, usada pelo middleware,
  que protege as rotas e separa paciente/médico/admin) e `lib/auth.ts` (banco,
  sessão JWT de 30 dias, senha com bcrypt, logins sociais). O papel é
  revalidado no banco a cada 60 s. Login social: papel sempre paciente, e-mail
  obrigatório, no Google só e-mail verificado.
- **Camadas:** rotas da API em `app/api/**` com validação (zod); regras de
  negócio em `services/api/*`; integrações em `services/external/*` (Asaas, CFM
  simulado, e-mail); ações sensíveis registradas no log de auditoria.
- **Tempo real:** eventos por Postgres (`LISTEN/NOTIFY`) e SSE; como em produção
  o aviso nem sempre chega, chat, status da sala e prontuário também consultam a
  cada poucos segundos (chat: 5 s).
- **Agendamento:** horários de 60 min da agenda do médico, fuso fixo de
  Brasília; pagamento confirmado pelo webhook do Asaas.
- **Receita:** PDF gerado e assinado com o certificado do médico (o arquivo
  `.pfx` e a senha ficam cifrados).
- **Peso e IMC:** tabela `WeightRecord`. O **IMC não é guardado**: é calculado
  na leitura, a partir do peso e da altura (corrigir a altura corrige todo o
  histórico).
- **Arquivos** (certificados, PDFs, anexos): sem S3 configurado, ficam no
  próprio banco (tabela `stored_files`).
- **App web (`/app/`):** é o build do Flutter servido pelo próprio site, na mesma
  origem (o login vale para os dois). Não confundir com a pasta `app/` do site,
  que é a de rotas do Next.js.

### Modelo de dados (principais entidades)

`User` (com papel PATIENT/DOCTOR/ADMIN), `PatientProfile` (inclui altura e meta
de peso), `DoctorProfile` (CRM, especialidade, agenda, situação do
credenciamento, valor da consulta), `Consultation`, `Payment`, `Message`,
`Prescription` e `PrescriptionItem`, `Medication` (base da ANVISA, ~300),
`MedicalCertificate`, `WeightRecord`, `FollowUp`, `AuditLog`, `StoredFile`.
Para o documento do TCC: o IMC é atributo **calculado**, não coluna.

## 5. Regras de trabalho no código (para quem mexer no repositório)

- Existe **um único banco, e é o de produção.** Nunca rodar `npm run build` na
  máquina (o build faz `prisma db push` e o seed no banco real). Nunca
  `prisma db push --accept-data-loss`. Teste que grava dado precisa desfazer.
- Nunca `git push --force` nem `git reset --hard`. Nenhum `.env*` no histórico.
- Merge na `main` publica o site: só o Hugo decide.
- Antes de enviar: `tsc` sem passar de 60 erros (dívida antiga), testes verdes,
  lint nos arquivos alterados.
- **Vercel olha só o último commit do push:** `[build]` na mensagem sempre
  constrói; na `main`, constrói se o commit muda algo fora de `mobile/` (commit
  vazio ou só `mobile/` é pulado); fora da `main`, só gera prévia com `[preview]`.
  Prévias nunca alteram o banco. Ao juntar várias branches, o merge que mexe no
  site vai por último.
- Variável nova no painel da Vercel só vale no próximo deploy (commit vazio com
  `[build]` na `main`).
- O app web só muda quando alguém gera o build do Flutter de novo e copia para
  `public/app/`; depois disso, o iPhone pode manter a versão antiga em cache
  (testar em aba privada).

## 6. Contas de demonstração

Senha de todas: **`Demo@12345`**.

- Pacientes: `mariana.castro@email.com` (4 consultas, peso 88,2 → 83,8 kg — a
  melhor para a banca), `patricia.nunes@email.com` (5 consultas, 79,0 → 75,2 kg),
  e outras.
- Médicos: `fernanda.costa@demo.emacrescere.app` e
  `ricardo.alves@demo.emacrescere.app` (aprovados, com certificado de teste);
  `marcos.pereira@demo.emacrescere.app` (aguardando aprovação).
- Admin: `admin@telemed.com.br` / `Admin@12345`.
- Evitar `medico.teste@emacrescere.test` (conta de teste que ficou aprovada).

## 7. Estado em 05/10/2026

- Tudo o que foi desenvolvido está na `main` e no ar; nenhuma prévia tem
  trabalho pendente.
- No ar: página inicial redesenhada (fotos próprias, 3D no desktop, seção do app com
  Android e iPhone e QR codes), login com Google, agendamento com pagamento,
  sala de consulta, receita assinada, peso e IMC, painel do admin, app web para
  iPhone.
- Feito em 05/10: menus de notificações e conta corrigidos no celular; botão
  "Voltar ao topo"; destaques da página inicial falam em consulta por vídeo em
  vez de LGPD (que fica no FAQ e no rodapé); foto nova da consulta por vídeo;
  topo do celular só com texto (o celular 3D ficou só no desktop).

### Pendências

- **Antes da banca:** testar o login com Google com um e-mail de usuário de
  teste (o app do Google está em modo Teste) e decidir se publica; testar o QR
  do iPhone num aparelho real; tirar o IMC do MER e do diagrama de classes do
  documento do TCC; ensaiar o roteiro. Sugestão: congelar funcionalidades em
  20/10.
- **Depois:** credenciais do Facebook (cadastro na Meta travado no SMS);
  contraste do botão verde padrão; propostas da auditoria (CPF cifrado, log de
  leitura do prontuário, limite de login por IP); 60 erros antigos de
  TypeScript; `robots.txt`, `sitemap.xml`, imagem de Open Graph, monitoramento.

### Limitações para declarar na banca

- Verificação de CRM **simulada** (final "000" = não encontrado, "999" =
  suspenso); integração real com o CFM é trabalho futuro.
- Certificado de teste: receita assinada, mas sem validade jurídica.
- Fila on-demand descartada; login com Facebook sem credenciais; e-mail em
  modo sandbox; arquivos no banco (S3 não configurado).

## 8. Roteiro da banca (resumo, ≈12 min)

1. Visitante: página inicial, seção do app, cadastro (e mostrar o Google).
2. Agendamento: escolher a Dra. Fernanda, horário livre, motivo, pagamento por
   Pix (confirmar no Asaas Sandbox ou com o pagamento simulado), página da
   consulta confirmada, botão de cancelar com a regra do estorno.
3. Atendimento (janela da médica): chamar o paciente, iniciar, sala com vídeo,
   chat e prontuário; emitir receita com a base da ANVISA; encerrar.
4. Receita: PDF assinado e validação pública pelo link (sem login).
5. Peso e IMC: gráfico da Mariana; aba Peso na sala da médica.
6. Médico novo (cadastro com CRM, conta pendente) e admin aprovando.

## 9. Onde está cada coisa no repositório

| Assunto | Arquivo |
|---|---|
| Estado atual, pendências, histórico | `PROJETO-STATUS.md` |
| Setup, contas, deploy, tabela do `[build]`/`[preview]` | `README.md` |
| Regras e arquitetura para quem programa | `CLAUDE.md` |
| Roteiro completo da banca | `docs/roteiro-demonstracao.md` |
| Segurança e LGPD | `docs/auditoria-seguranca.md` |
| Front-end (regras visuais) | `docs/frontend-handoff.md` |
| 3D e fotos | `docs/3d/`, `docs/fotos/` |
| App Flutter | `mobile/HANDOFF.md`, `mobile/CLAUDE.md` |
