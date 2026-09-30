# Roteiro de demonstração — Emacrescere

Sequência pra mostrar o sistema funcionando de ponta a ponta na banca, com os
dados de demonstração que o seed cria (`prisma/seed-demo.ts`, roda em todo
deploy). Senha de todas as contas demo: **`Demo@12345`**.

## Contas

| Perfil | E-mail | Situação |
|---|---|---|
| Paciente | `mariana.castro@email.com` | 4 consultas pagas, evolução de peso, receita emitida, retorno marcado |
| Paciente | `ana.souza@demo.emacrescere.app` | histórico + retorno marcado |
| Médica | `fernanda.costa@demo.emacrescere.app` | credenciada, **certificado de teste instalado** |
| Médico | `ricardo.alves@demo.emacrescere.app` | credenciado, **certificado de teste instalado** |
| Médico | `marcos.pereira@demo.emacrescere.app` | aguardando aprovação (CRM ativo) |
| Médica | `juliana.martins@demo.emacrescere.app` | aguardando aprovação (CRM suspenso) |
| Admin | `admin@telemed.com.br` / `Admin@12345` | painel administrativo |

Os retornos agendados da demo são reposicionados no futuro a cada deploy, em
dia útil e sem choque de horário — no dia da banca sempre haverá consultas
"próximas" pra mostrar.

## Antes da apresentação

1. **Pagamento.** Em produção o Asaas está em sandbox com `PAYMENT_MOCK=false`,
   então Pix e boleto só confirmam quando alguém confirma a cobrança no painel
   do Asaas Sandbox (o webhook avisa o site na hora). Duas opções:
   - deixar o painel do Asaas Sandbox aberto e confirmar a cobrança ao vivo; ou
   - ligar `PAYMENT_MOCK=true` na Vercel (Settings → Environment Variables →
     redeploy): aparece o botão **"Simular pagamento"** na tela do Pix.
   - Cartão: no sandbox, os cartões de teste da documentação do Asaas são
     aprovados na hora.
2. **Vídeo.** A videochamada é pelo site (LiveKit). Teste câmera/microfone dos
   dois navegadores antes. Use duas janelas (ou uma anônima) pra paciente e
   médico ao mesmo tempo.
3. **E-mail.** O Resend está em modo sandbox: "Esqueci minha senha" só entrega
   pro e-mail dono da conta Resend. Se for demonstrar, use essa conta.

## Roteiro (≈10 min)

**1. Visitante → paciente (2 min)**
- Landing: proposta, preço, como funciona, política de cancelamento no FAQ.
- Cadastro de paciente (telefone é opcional) → login.

**2. Agendamento com pagamento (3 min)** — janela do paciente
- *Agendar consulta* → escolher a Dra. Fernanda → data → só aparecem os
  horários da agenda dela; ocupados riscados; fim de semana sem horário.
- Motivo da consulta → pagamento (a política de cancelamento aparece antes).
- Pix → QR code → confirmar (Asaas ou "Simular") → a página da consulta muda
  sozinha para **"Sua consulta está confirmada"**.
- Mostrar o botão *Cancelar consulta*: a confirmação diz se haverá estorno
  (≥ 24 h: integral; < 24 h: sem estorno). Fechar sem cancelar.

**3. Atendimento (3 min)** — janela da médica (Fernanda)
- Sino: aviso da consulta. *Consultas* → abrir a consulta → **Chamar paciente**.
  Na janela do paciente aparece "Dra. Fernanda está te chamando".
- **Iniciar consulta** → **Entrar na sala**: vídeo, chat, prontuário com
  auto-save.
- Painel de receita: buscar medicamento na base ANVISA → **Emitir** (assina com
  o certificado de teste) → encerrar a consulta.

**4. Receita e validação (1 min)**
- Paciente: *Receitas* → *Visualizar* → PDF assinado.
- Abrir o link de validação impresso no PDF (`/prescricao/{id}`), sem login:
  receita válida, médico/CRM, aviso de certificado de teste. Enviar o PDF na
  conferência → "idêntico ao emitido". (Editar o PDF e enviar de novo mostra
  "NÃO corresponde".)

**5. Médico novo e administração (1 min)**
- *É médico? Cadastre-se na área profissional* → cadastro com CRM → conta
  pendente.
- Admin: aprovar o médico; visão geral com receita, pagamentos, consultas e
  auditoria.

## Limitações a declarar (honestidade com a banca)

- Certificado de teste: a receita sai assinada, mas **sem validade jurídica**
  (autoassinado; um A1 ICP-Brasil real é pago e exige validação presencial). A
  página de validação e o PDF dizem isso.
- Verificação de CRM é **simulada** (regra: final "000" = não encontrado,
  "999" = suspenso). Integração real com o CFM fica como trabalho futuro.
- Fila de atendimento imediato (on-demand): implementada mas desligada nesta
  entrega (`QUEUE_ENABLED` em `lib/constants.ts`) — trabalho futuro (5.5.1).
- Arquivos (certificados, PDFs, anexos) ficam no banco, porque o S3 não foi
  configurado. Configurar as variáveis `S3_*` move tudo pro Contabo sem mudar
  código.
