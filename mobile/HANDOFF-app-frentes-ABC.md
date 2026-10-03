# App Flutter — frentes A, B e C (02–03/10/2026)

Registro do que mudou no app nessas duas datas, e do que ficou em aberto. Não é
lista de tarefas: o trabalho está feito e commitado. Leia junto de `CLAUDE.md`
(regras técnicas do app) e `HANDOFF.md` (visão geral do projeto).

Banca: **03/11/2026**. Equipe 6, Técnico de Informática, ETPC. Aluno
responsável: Hugo Meira Maia.

## Onde o app vive

Aqui: `TCC-EMACRESCERE/mobile/`, dentro do repositório do site. Isto mudou em
03/10/2026 — antes o app era um repo git separado em
`C:\Users\jujuj\emacrescere_app`, e esta pasta era um espelho via git subtree.
O espelho ficou atrasado até o ponto de o app **não compilar** (um import
apontava para um arquivo que nunca havia sido copiado), e com um repositório só
o trabalho passa a funcionar também em sessões na nuvem. O `emacrescere_app`
continua na máquina do Hugo como histórico e **não deve mais ser editado**.

## Estado

| Item | Situação |
|---|---|
| `flutter analyze` | **No issues found!** |
| `flutter test` | **7 testes passando** (`doctor_screens_test` 4 + `queue_screens_test` 3) |
| Aberto no navegador (`localhost:5000`) | rodado em 03/10 na máquina do Hugo |
| Commitado | sim |

Os quatro commits das frentes, na ordem:

```
feat(app): agendamento com horários reais e pagamento
feat(app): peso e IMC pela API, com filtros e acesso do médico
chore(app): elementos null-aware nos mapas de PATCH
feat(app): esconde a fila on-demand atrás de kQueueEnabled
```

E depois, na mudança de casa: a sincronização da `mobile/`, a saída de
`Claude outputs/` do repositório, a correção dos textos e o `ignoreCommand` do
`vercel.json`.

## Frente A — agendamento com pagamento

O app **inventava os horários**: 08:00 às 17:00, todo dia, fixo no código. O
paciente só descobria que o horário estava ocupado depois de escrever o motivo
da consulta.

- `lib/models/day_slot.dart` — `DaySlot` com `time` ("HH:MM" em São Paulo, é o
  que se mostra), `startsAt` (instante em UTC, é o que volta ao servidor) e
  `available`.
- `lib/services/consultation_service.dart` — `getDoctorSlots(doctorId, date)`,
  `checkout({consultationId, method})`, `simulatePayment(consultationId)`, e
  `ConsultationFailure` com `isSlotTaken => statusCode == 409`.
- `lib/screens/consultations/payment/consultation_payment_screen.dart` — Pix ou
  boleto, "Gerar cobrança", "Pagar com cartão no site" e "Pagar depois".
- `lib/screens/consultations/schedule/schedule_screen.dart` — usa os slots
  reais; 409 volta para a escolha de data com a lista recarregada.
- `lib/screens/consultations/queue/awaiting_payment_screen.dart` — passou a
  checar o status da própria consulta em vez de depender do `QueueService`.

## Frente C — peso e IMC pela API

O peso vivia só no `SharedPreferences`: o médico não via, o site não via, e
sumia ao reinstalar. Agora é linha em `weight_records`.

- `lib/models/weight_entry.dart` — `WeightEntry` vem do backend; mais
  `WeightSummary`, `WeightHistory`, `WeightRange`, `WeightMetric`,
  `BmiCategory` e `bmiCategoryFromKey()`.
- `lib/services/weight_service.dart` — `getHistory`, `addEntry`, `deleteEntry`,
  `updateMetrics`.
- `lib/screens/tracking/tracking_screen.dart` — filtro de período (30d, 3m, 6m,
  1a, tudo), troca entre peso e IMC, erro com "tentar de novo",
  pull-to-refresh, recarga ao voltar para a aba, e apagar a própria pesagem.
- `lib/screens/tracking/weight_chart.dart` — aceita a métrica e a meta (linha
  tracejada de referência, não uma segunda série).
- `lib/screens/tracking/{register_weight_sheet,set_goal_sheet}.dart` — gravam
  na API; a segunda virou "Altura e meta".
- `lib/screens/doctor/patient_weight_sheet.dart` + botão de balança na AppBar de
  `doctor_room_screen.dart` — o médico vê a evolução e registra o peso aferido,
  vinculado à consulta.

Para **apagar** a meta é preciso mandar `null` explícito no PATCH. Em Dart não
se distingue "não mexer" de "apagar" por um parâmetro nulo, por isso existe
`updateMetrics(clearGoalWeight: ...)`. Antes, limpar o campo na tela
simplesmente não fazia nada.

Saiu o botão "Carregar dados de exemplo": os dados de demonstração vêm do seed
do servidor. Quem tinha peso só no aparelho começou do zero — não houve
migração.

## Frente B — a fila escondida

`lib/constants.dart` tem `final bool kQueueEnabled = false`, espelhando
`QUEUE_ENABLED` em `lib/constants.ts` do site. **As duas pontas precisam
concordar**, senão o app oferece uma fila que o backend esconde.

A aba "Fila" sai da `NavigationBar` do médico; "Nova consulta" do paciente abre
o agendamento direto; "Ver a fila" virou "Ver a agenda"; os textos do perfil do
médico passaram a falar de agendamento; o rótulo padrão do botão da agenda
deixou de ser "VER FILA DE ATENDIMENTO".

Continuam no repositório, intactos: `lib/screens/consultations/queue/*`,
`lib/screens/doctor/doctor_queue_screen.dart`, `lib/services/queue_service.dart`,
os campos do modelo e `test/queue_screens_test.dart`. A seção 5.5.1 do TCC cita
esses campos como base já preparada para a evolução.

## Decisões que vão parecer erro — não "corrija"

1. O app **não manda `amount`** no `POST /api/checkout`. O servidor calcula a
   partir do honorário do médico e ignora o que vier no corpo.
2. O app **não calcula nem classifica IMC**. `lib/bmi.ts` é a fonte única; o app
   recebe valor, rótulo e faixa prontos de `GET /api/weight` e só traduz a chave
   da faixa (`NORMAL`, `OBESE_1`...) em cor. Faixa desconhecida fica cinza de
   propósito. Existia uma segunda cópia das faixas da OMS no Dart
   (`classifyBmi`/`calculateBmi`) e ela foi removida: bastava mudar uma faixa no
   site para app e site discordarem sobre o mesmo peso.
3. `kQueueEnabled` é `final` e **não** `const`, igual ao
   `QUEUE_ENABLED: boolean` do site. Com constante de compilação, o analisador
   do Dart e o TypeScript marcariam como código morto justamente o código da
   fila, preservado de propósito.
4. Cartão de crédito no app e videochamada no app **não** estão implementados.
   É escopo, não bug — o cartão exige número, validade, CCV e endereço do
   titular, que o app não coleta, e há botão para pagar no site.

## Armadilhas já pagas

- **O índice da `NavigationBar` do médico** é a posição na lista de abas
  *visíveis*, não `DoctorTab.index`. O enum continua contando a fila; usar o
  index abre a aba errada em cada toque.
- O backend exige `Origin`/`Referer` em **toda** mutação (`lib/security.ts`,
  `checkOrigin`). O `ApiClient` manda isso fora da web; sem isso dá 403 "Origem
  não verificável".
- `setState(() => _future = X())` **não funciona** — use bloco:
  `setState(() { _future = X(); })`.
- Datas para o backend sempre em UTC (`toUtc().toIso8601String()`).
- As abas vivem num `IndexedStack` (todas montadas); quem precisa de dado fresco
  ao voltar usa `TabVisibilityMixin` — o método é `onTabShown()`.
- `analysis_options.yaml` usa só `flutter_lints`; `directives_ordering` **não**
  está ativo. A versão 6 pede `use_null_aware_elements`: `{'k': ?v}` em vez de
  `{if (v != null) 'k': v}`.
- `setState` depois de um `await` precisa de guarda `mounted` — vale para
  qualquer `_load()` chamado a partir de um callback assíncrono.

## Contratos da API usados por estas frentes

Fonte da verdade é `app/api/*` e `services/api/*`, no mesmo repositório — use.
Resumo do que o app espera:

```
GET    /api/doctors/:id/slots?date=AAAA-MM-DD
       → { data: [ { time: "14:00", startsAt: "<ISO UTC>", available: bool } ] }

POST   /api/consultations          { doctorId, scheduledAt, chiefComplaint }
POST   /api/checkout               { consultationId, method: "PIX" | "BOLETO" }
       (sem `amount` — o servidor decide)

GET    /api/weight[?patientId=]    → { data: { summary, points: [...] } }
POST   /api/weight                 { weightKg, measuredAt, note?, patientId?,
                                     consultationId? }
DELETE /api/weight/:id
PATCH  /api/patient/metrics        { heightCm?, goalWeightKg? }   // null apaga

WeightPoint   { id, weightKg, measuredAt, note, source: "PATIENT" | "DOCTOR",
                recordedBy, bmi: { value, category, label } | null }
WeightSummary { heightCm, goalWeightKg, healthyCeilingKg, current, first,
                deltaKg, lastChangeKg, count }
```

A consulta agendada **continua `SCHEDULED`** depois de paga; só a on-demand ia
para `WAITING`. Limites de validação, iguais aos do backend: peso 20–400 kg,
altura 100–250 cm.

## Como rodar

Flutter 3.38.5 / Dart 3.10.4. `flutter pub get` antes.

No Chrome, sem celular: `dart run tool/dev_web.dart` e abrir
`http://localhost:5000` (proxy de API em `:8080`). **Não** use
`flutter run -d chrome` direto — CORS e cookie cross-site. Tela preta na
primeira carga é só recarregar. Porta ocupada: `$env:PORT=5001`.

O `.env` (com a `API_BASE_URL`) não é versionado. Ele está no disco da máquina
do Hugo; em qualquer clone novo precisa ser criado à mão.

Sessões na nuvem **não conseguem rodar Flutter**: não há Dart nem Flutter, e o
download do SDK é bloqueado pelo proxy. Lá dá para ler código e conferir o
contrato com a API; `analyze`, `test` e abrir o app são só na máquina do Hugo.

Contas do seed, senha `Demo@12345`: paciente `mariana.castro@email.com`, médico
`fernanda.costa@demo.emacrescere.app`. Não use `maria@email.com` para pagamento
— CPF inválido, o Asaas recusa. `PAYMENT_MOCK` está desligado em produção, então
`/api/dev/simulate-payment` responde 404: dá para ver a cobrança Pix gerada, não
para confirmar o pagamento.

## Ainda em aberto

- **MER e diagrama de classes** mostram um atributo `imc` em `WeightRecord`. O
  IMC é derivado de `weightKg` + `heightCm` a cada leitura e **não é gravado** —
  é isso que permite corrigir uma altura digitada errada e consertar o histórico
  inteiro de uma vez. Tirar o atributo dos dois diagramas.
- **Anamnese**: descrita em 5.3.1 e no UC03 do TCC, não existe no código.
- `PAYMENT_MOCK` em produção e as credenciais do Facebook: pendências do Hugo,
  no painel da Vercel e na Meta.
