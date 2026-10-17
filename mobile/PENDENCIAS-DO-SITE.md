# O que entrou no site e ainda não está no app

Lista para a Julia (e o Hugo) levarem ao app Flutter. Cada item diz o que o
site faz, a rota da API e o que o app precisa. Regra de sempre: o app só
mostra; contas e regras ficam no servidor (como o IMC).

Atualizar esta lista sempre que uma funcionalidade nova entrar só no site.
Ao levar um item para o app, marcar como feito e anotar a data.

## Perfil (11/10/2026)

- [ ] **Foto de perfil.** O site envia e remove a foto (`POST` / `DELETE
  /api/profile/avatar`, multipart com `file`, JPG/PNG/WebP até 2 MB). A foto é
  servida em `/api/avatar/{userId}?v=...` e **exige o cookie de sessão**; o
  `avatarUrl` vem como caminho relativo. Hoje o cabeçalho do app mostra o
  ícone quando a foto é relativa (`_hasNetworkImage` em
  `lib/widgets/app_header.dart`). Para mostrar: montar a URL com a base da
  API e mandar o cookie no `NetworkImage(headers: ...)`.
- [x] **Editar perfil.** *(feito no app em 17/10/2026, commit `b0d24ab`)* `PATCH /api/profile`: nome e telefone (todos) e, para
  paciente, nascimento, sexo, tipo sanguíneo, alergias, medicamentos,
  observações, altura (`heightCm`), meta de peso (`goalWeightKg`) e contato de
  emergência (`emergencyContactName`, `emergencyContactPhone`,
  `emergencyContactRelation`). Campo vazio (`""`) apaga. O
  `edit_profile_sheet.dart` ainda usa `PATCH /api/users/{id}` (continua
  funcionando, mas sem os campos novos).
- [x] **Trocar senha.** *(feito no app em 17/10/2026, commit `b0d24ab`)* `POST /api/profile/password` com `currentPassword`,
  `newPassword`, `confirmPassword`. Erro `PERFIL_SENHA_ATUAL_INCORRETA` (422)
  e `PERFIL_SEM_SENHA` (conta só Google).
- [ ] **Formação do médico.** `PATCH /api/doctor/profile` aceita
  `graduationSchool`, `graduationYear`, `residency`, `languages` (lista). O
  `GET` já devolve esses campos.
- [ ] **Baixar meus dados** (`GET /api/profile/export`, JSON) e **desativar
  conta** (`POST /api/profile/deactivate` com `password`, ou `confirm:
  "DESATIVAR"` em conta Google; erro `PERFIL_DESATIVAR_COM_CONSULTAS`).

## Consulta e chat (15/10/2026, branch `pacotes-out26`)

- [x] **Chat por 24 h depois da consulta.** *(feito no app em 17/10/2026, commit `18f4ed6`, branch `app-pendencias-site`)* O servidor agora aceita mensagem
  durante a consulta e por 24 h depois de concluída; depois disso responde
  `409 CHAT_ENCERRADO`. A leitura do histórico continua liberada. O app já
  mostra o erro num aviso ao enviar; falta: esconder ou desabilitar a caixa de
  mensagem fora do prazo e mostrar "Você pode mandar mensagens até ...".
  **O servidor informa o prazo** (17/10): `GET /api/chat/{roomToken}/messages`
  devolve `{ data: [...], access: { canSend, sendUntil, reason } }`. O app só
  mostra: tranca a caixa quando `canSend` é falso e escreve o prazo quando
  `sendUntil` existir e `canSend` for verdadeiro (`reason` é `ATIVA`,
  `POS_CONSULTA`, `ENCERRADO`, `CANCELADA` ou `NAO_INICIADA`). Não refazer a
  conta das 24 h no Dart. Se um envio voltar 409 (`CHAT_ENCERRADO`,
  `CONSULTA_ENCERRADA` ou `CHAT_FORA_DA_CONSULTA`), trancar a caixa na hora.
  "Marcar como lido" só vale para quem participa da consulta: ignorar o erro.
  Testar: mandar mensagem numa consulta encerrada há menos de 24 h.
- [ ] **Contato de emergência no prontuário** (médico): o site mostra no
  cartão do paciente da sala. No app, `prontuario_sheet.dart`.
- [ ] **Histórico de consultas anteriores** no prontuário (médico):
  `GET /api/consultations/{id}/history` (17/10) devolve `{ data: [...] }` com
  `id`, `date` (ISO), `chiefComplaint`, `diagnosis`, `conduct`, `notes` e
  `medications` (lista de textos). Só o médico da consulta (403 para os
  outros) e só as consultas dele com o paciente. Tela: `prontuario_sheet.dart`.

## Acompanhamento (15/10/2026, branch `pacotes-out26`)

- [x] **Outras medidas.** *(feito no app em 17/10/2026, commit `852a618`)* `GET /api/measurements?patientId=` devolve
  `series` por tipo (`waist`, `hip`, `body_fat`, `lean_mass`) e `derived`
  (`waistToHeight`, `waistToHip`, `heightCm`), já calculados no servidor.
  `POST /api/measurements` com `type`, `value` e opcionais `note`,
  `patientId` (médico) e `consultationId`; `DELETE /api/measurements/{id}`.
  Limites e rótulos em `lib/measures.ts` do site. Sem metas, sequências ou
  lembretes (regra do produto).

## Agendamento (16/10/2026, branch `pacotes-out26`)

- [ ] **Salvar na agenda.** Na consulta confirmada (paga), o site mostra
  "Google Agenda" (link montado em `lib/calendar.ts`) e um arquivo `.ics`
  com lembretes de 1 dia e 30 min (`GET /api/consultations/{id}/calendar`,
  exige sessão). No app: abrir o `.ics` com o app de agenda do aparelho
  (ou usar um pacote como `add_2_calendar`) a partir do detalhe da consulta.

## Receita

- Nada a fazer no app: o QR code está dentro do PDF assinado, que o app já
  baixa e mostra.
