# Plano de testes — Emacrescere

Checklist de homologação do site, do app Android, do app no iPhone (versão
web) e da responsividade no celular. Objetivo: decidir se o sistema está
**entregável** para a banca de 03/11/2026.

- Site: https://tcc-emacrescere.vercel.app
- App Android (APK): https://tcc-emacrescere.vercel.app/app.apk
- App iPhone (web): https://tcc-emacrescere.vercel.app/app/

Cada item tem um código (ex.: `PAC-12`). Marque `[x]` quando passar. Quando
falhar, abra um relatório de defeito com o código (modelo na seção 0.5).

---

## 0. Antes de começar (leia tudo)

### 0.1 Regras importantes

1. **Só existe um banco, e é o de produção.** Tudo o que você criar aparece no
   site público. Por isso:
   - crie suas próprias contas com e-mail identificável, por exemplo
     `qa.seunome.01@teste.com`;
   - **não** desative, não troque a senha e não edite o perfil das contas de
     demonstração (tabela 0.2). Testes destrutivos só nas suas contas;
   - **não** aprove nem reprove os médicos de demonstração pendentes
     (Marcos e Juliana): cadastre o seu próprio médico de teste para isso;
   - **não** remova o certificado digital da Dra. Fernanda nem do Dr. Ricardo;
   - ao terminar, cancele as consultas que você marcou e apague pesagens e
     medidas de teste das contas de demonstração.
2. O CPF precisa ser **válido** (dígitos verificadores). Use um gerador de CPF
   de teste. CPFs com todos os dígitos iguais são recusados de propósito.
3. Os pagamentos são do **sandbox do Asaas** (dinheiro de mentira). Pix e
   boleto só confirmam quando alguém confirma a cobrança no painel do Asaas
   Sandbox: combine com o Hugo antes dos testes de pagamento. Cartão: use os
   cartões de teste da documentação do Asaas.
4. "Esqueci minha senha" só entrega e-mail para o dono da conta Resend
   (sandbox). Combine com o Hugo para testar o e-mail de ponta a ponta.
5. O login com Google só funciona para e-mails cadastrados como usuários de
   teste no Google Cloud. Peça ao Hugo para incluir o seu.
6. O login aceita **5 tentativas a cada 15 minutos por e-mail**. Se travar a
   sua conta testando senha errada, espere 15 minutos ou use outro e-mail.

### 0.2 Contas

Senha de todas as contas de demonstração: **`Demo@12345`**.

| Perfil | E-mail | Para que serve |
|---|---|---|
| Paciente | `mariana.castro@email.com` | histórico completo, peso 88,2 → 83,8 kg, receita, retorno marcado |
| Paciente | `patricia.nunes@email.com` | 5 consultas, receita emitida |
| Paciente | `camila.freitas@email.com` | receita de controle especial |
| Paciente | `bruno.lima@demo.emacrescere.app` | consulta concluída + cancelada + retorno |
| Paciente | `diego.ferreira@demo.emacrescere.app` | consulta "não compareceu" |
| Paciente | `elaine.rocha@demo.emacrescere.app` | receita em rascunho |
| Paciente | `felipe.andrade@demo.emacrescere.app` | consulta próxima |
| Médica | `fernanda.costa@demo.emacrescere.app` | aprovada, com certificado de teste |
| Médico | `ricardo.alves@demo.emacrescere.app` | aprovado, com certificado de teste |
| Médico | `marcos.pereira@demo.emacrescere.app` | pendente (CRM ativo) — **só olhar** |
| Médica | `juliana.martins@demo.emacrescere.app` | pendente (CRM suspenso) — **só olhar** |
| Médico | `otavio.ramos@demo.emacrescere.app` | reprovado — **só olhar** |
| Admin | `admin@telemed.com.br` / `Admin@12345` | painel administrativo |

Não use `maria@email.com` para pagamento (CPF inválido, o Asaas recusa) nem o
médico `medico.teste@emacrescere.test`.

### 0.3 Dispositivos e navegadores (matriz mínima)

| Plataforma | Navegador / versão | Obrigatório |
|---|---|---|
| Windows ou macOS, desktop | Chrome atual | sim |
| Windows ou macOS, desktop | Firefox atual | sim |
| Windows | Edge atual | sim |
| macOS | Safari atual | se houver Mac |
| Android (celular real) | Chrome + app instalado pelo APK | sim |
| iPhone (celular real) | Safari + app web na tela de início | sim |
| Tablet (real ou simulado) | Chrome / Safari | desejável |

Larguras de tela para a responsividade (DevTools → modo dispositivo):
**320, 360, 375, 390, 414, 768, 1024, 1280, 1440 e 1920 px**, em retrato e
paisagem no celular.

### 0.4 Sessões simultâneas

Vários testes precisam de paciente e médico ao mesmo tempo. Use dois
navegadores diferentes (ou uma janela normal e outra anônima), ou o site num
lado e o app no outro.

### 0.5 Modelo de relatório de defeito

```
Código do item: PAC-12
Título: <resumo curto>
Ambiente: <site / app Android / app iPhone> · <aparelho> · <navegador e versão> · <largura da tela>
Conta usada: <e-mail>
Passos para reproduzir: 1. ... 2. ... 3. ...
Resultado esperado: ...
Resultado obtido: ...
Evidência: <print ou vídeo; código de erro mostrado na tela, se houver>
Frequência: sempre / às vezes / uma vez
Severidade: Bloqueante / Alta / Média / Baixa
```

Severidade:

- **Bloqueante:** impede um fluxo principal (cadastrar, entrar, agendar,
  pagar, atender, emitir ou ver receita) ou expõe dado de outra pessoa.
- **Alta:** funcionalidade importante errada, sem alternativa razoável.
- **Média:** funciona com contorno, ou erro visível de layout/texto.
- **Baixa:** detalhe estético ou de texto.

---

## 1. Área pública

### 1.1 Página inicial (`/`)

- [ ] `PUB-01` A página carrega sem erro e sem elementos quebrados (imagens, ícones, fontes).
- [ ] `PUB-02` Menu do topo: links **Para quem, Como funciona, Benefícios, Para médicos, App, Dúvidas** rolam até a seção certa.
- [ ] `PUB-03` Botões **Entrar** e **Criar conta / Cadastrar** levam a `/auth/login` e `/auth/register`.
- [ ] `PUB-04` No desktop aparecem os modelos 3D (coração, celular, selo); eles giram/animam sem travar a rolagem.
- [ ] `PUB-05` No celular o topo é só texto (sem o celular 3D) e o botão de cadastro aparece na primeira tela, sem rolar.
- [ ] `PUB-06` Seção **App** (`/#app`): dois QR codes (Android e iPhone). O QR do Android abre `/app.apk`; o do iPhone abre `/app/`. Teste lendo com a câmera de um celular.
- [ ] `PUB-07` Link/botão de download do APK baixa o arquivo `emacrescere.apk`.
- [ ] `PUB-08` FAQ: as 7 perguntas abrem e fecham; a da política de cancelamento diz "24 h ou mais = reembolso integral; menos de 24 h ou falta = sem reembolso; médico cancela = integral".
- [ ] `PUB-09` Botão **Voltar ao topo** aparece depois de rolar e leva ao topo.
- [ ] `PUB-10` No celular, a barra fixa de chamada para cadastro (rodapé) aparece e não cobre conteúdo importante.
- [ ] `PUB-11` Rodapé: links Benefícios, Como funciona, Dúvidas, Termos, Privacidade e e-mail de contato funcionam.
- [ ] `PUB-12` Link **"É médico? Cadastre-se"** leva a `/auth/register/medico`.
- [ ] `PUB-13` Com "reduzir movimento" ligado no sistema, as animações ficam contidas ou desligadas.

### 1.2 Páginas legais

- [ ] `PUB-20` `/termos` abre, texto legível, sem menção a "farmácias parceiras".
- [ ] `PUB-21` `/privacidade` abre; o link `/privacidade#exclusao-de-dados` rola até a seção de exclusão de dados.
- [ ] `PUB-22` Voltar ao início a partir das páginas legais funciona.

### 1.3 Páginas de erro e rotas protegidas

- [ ] `PUB-30` Um endereço inexistente (ex.: `/qualquer-coisa`) mostra a página 404 do site, com caminho de volta.
- [ ] `PUB-31` Sem login, abrir `/dashboard/patient` redireciona para o login; depois de entrar, volta para a página pedida.
- [ ] `PUB-32` Logado como paciente, abrir `/dashboard/doctor` ou `/dashboard/admin` leva a **Acesso negado** (`/auth/unauthorized`).
- [ ] `PUB-33` Logado como médico, abrir `/dashboard/patient` ou `/dashboard/admin` → Acesso negado.
- [ ] `PUB-34` Login com `callbackUrl` externo (ex.: `/auth/login?callbackUrl=https://google.com`) **não** manda para fora do site depois do login.
- [ ] `PUB-35` `/api/health` sem login responde só o estado geral (sem detalhes internos).

---

## 2. Autenticação (site)

### 2.1 Cadastro de paciente (`/auth/register`)

- [ ] `AUT-01` Cadastro válido (nome, e-mail, CPF válido, senha forte, aceite dos termos) → "Conta criada com sucesso!" e consegue entrar.
- [ ] `AUT-02` Telefone é opcional: cadastro sem telefone funciona.
- [ ] `AUT-03` Telefone com menos de 10 ou mais de 11 dígitos → "Telefone inválido".
- [ ] `AUT-04` CPF inválido (dígito errado, menos de 11 dígitos, todos iguais) → "CPF inválido".
- [ ] `AUT-05` CPF ou e-mail já cadastrado → mensagem clara, sem criar conta duplicada.
- [ ] `AUT-06` Senha com menos de 8 caracteres, sem maiúscula ou sem número → mensagem específica de cada regra.
- [ ] `AUT-07` Senha comum (ex.: `Senha123` não; teste `12345678`, `password1`) → "Senha muito comum".
- [ ] `AUT-08` Senha contendo a parte do e-mail antes do @ → "Senha não pode conter seu e-mail".
- [ ] `AUT-09` Confirmação diferente da senha → "Senhas não conferem".
- [ ] `AUT-10` Sem marcar os Termos/Privacidade → cadastro bloqueado com aviso. Os links dos termos abrem as páginas certas.
- [ ] `AUT-11` Nome com números ou símbolos (ex.: `Ana@123`) → "Nome contém caracteres inválidos"; nome com 1 letra → "Nome muito curto". Nomes com acento e apóstrofo (`João D'Ávila`) são aceitos.
- [ ] `AUT-12` E-mail com maiúsculas e espaços é salvo em minúsculas (entrar depois com minúsculas funciona).
- [ ] `AUT-13` Botão de mostrar/esconder senha funciona nos dois campos.
- [ ] `AUT-14` Duplo clique no botão de enviar não cria duas contas.

### 2.2 Cadastro de médico (`/auth/register/medico`)

- [ ] `AUT-20` Página mostra o passo a passo (envia CRM → equipe aprova → configura agenda) e o link "Sou paciente".
- [ ] `AUT-21` Cadastro válido (CRM 4–7 dígitos, UF, especialidade) → "Cadastro enviado!"; ao entrar, aparece **Credenciamento em análise**.
- [ ] `AUT-22` CRM terminando em `000` → recusado como "não encontrado" (verificação simulada).
- [ ] `AUT-23` CRM terminando em `999` → tratado como suspenso.
- [ ] `AUT-24` CRM com letras ou fora de 4–7 dígitos, UF inválida, especialidade com menos de 3 letras → mensagens de validação.
- [ ] `AUT-25` Médico pendente não aparece na lista de médicos do paciente.
- [ ] `AUT-26` Médico reprovado (`otavio.ramos`) vê **Cadastro reprovado** com o motivo informado pelo admin.

### 2.3 Login (`/auth/login`)

- [ ] `AUT-30` Login de paciente leva ao painel do paciente; médico ao painel do médico; admin ao painel admin.
- [ ] `AUT-31` E-mail não cadastrado → mensagem de erro; senha errada → "Senha incorreta." (sem travar a tela).
- [ ] `AUT-32` Depois de 5 senhas erradas em 15 min, o login fica bloqueado com mensagem própria.
- [ ] `AUT-33` Conta desativada (pelo admin ou pelo próprio usuário) não entra e recebe mensagem própria.
- [ ] `AUT-34` **Continuar com Google** (e-mail de teste liberado): cria/entra como **paciente**, com a foto do Google no perfil.
- [ ] `AUT-35` Google com e-mail que já tem conta de senha → entra na mesma conta (não cria outra).
- [ ] `AUT-36` O botão do Facebook **não** aparece (sem credenciais) — se aparecer, é defeito.
- [ ] `AUT-37` Cancelar o login do Google volta para a tela de login com mensagem, sem erro feio.
- [ ] `AUT-38` Sair (logout) pelo menu da conta → volta ao site; o botão Voltar do navegador não reabre o painel.
- [ ] `AUT-39` A sessão continua depois de fechar e abrir o navegador.

### 2.4 Esqueci / redefinir senha

- [ ] `AUT-40` `/auth/forgot-password` com e-mail cadastrado ou não → sempre a mesma mensagem ("Se este e-mail estiver cadastrado...").
- [ ] `AUT-41` E-mail inválido → "E-mail inválido".
- [ ] `AUT-42` (Com o Hugo) o link do e-mail abre `/auth/reset-password`; nova senha válida → "Senha redefinida!" e o login funciona com a nova senha.
- [ ] `AUT-43` O mesmo link usado de novo → "Link inválido". Link com mais de 15 minutos → inválido.
- [ ] `AUT-44` `/auth/reset-password` sem token ou com token inventado → "Link inválido".

---

## 3. Paciente (site)

Use uma conta de paciente sua (para fluxos que gravam) e a Mariana (para ver
histórico).

### 3.1 Painel inicial (`/dashboard/patient`)

- [ ] `PAC-01` Mostra a **Próxima consulta** (ou "Nenhuma consulta marcada" com botão **Agendar consulta**).
- [ ] `PAC-02` Na próxima consulta: médico, data/hora, status (Confirmada / Aguardando pagamento / Em andamento) e o botão certo (Pagar consulta, Ver detalhes ou Entrar na sala).
- [ ] `PAC-03` Cartão **Peso e IMC** com mini gráfico e variação "Desde a primeira"; sem pesagens, "Nenhuma pesagem ainda".
- [ ] `PAC-04` **Última receita** aparece quando existe.
- [ ] `PAC-05` Atalhos levam às páginas corretas.
- [ ] `PAC-06` Nenhum texto fala em "fila" ou "atendimento agora".

### 3.2 Navegação do painel

- [ ] `PAC-10` Menu lateral (desktop) e barra inferior (celular) levam a Início, Agendar, Consultas, Peso e medidas, Receitas e Perfil; o item atual fica destacado.
- [ ] `PAC-11` **Sino de notificações** lista pendências reais (ex.: consulta a pagar, médico chamando) e cada item leva à tela certa.
- [ ] `PAC-12` **Busca** do topo encontra consultas por queixa ou nome do médico.
- [ ] `PAC-13` Menus de notificações e conta abrem **por cima** do conteúdo (também no celular) e fecham ao clicar fora ou com Esc.

### 3.3 Agendar consulta (`/dashboard/patient/schedule`)

- [ ] `PAC-20` Passo 1 — lista de médicos aprovados com foto, especialidade, valor "/ consulta"; busca por nome ou especialidade filtra; busca sem resultado → "Nenhum médico encontrado".
- [ ] `PAC-21` Selecionar um médico marca "Selecionado ✓".
- [ ] `PAC-22` Passo 2 — datas dos próximos dias; ao escolher uma data, aparecem só os horários da agenda do médico; horários ocupados aparecem riscados e não são clicáveis; dias sem atendimento (ex.: fim de semana) não têm horário.
- [ ] `PAC-23` Horários com menos de 60 min de antecedência não podem ser escolhidos (erro "antecedência mínima" se forçar).
- [ ] `PAC-24` "Ou escolha outra data" permite escolher datas mais distantes.
- [ ] `PAC-25` Passo 3 — motivo da consulta obrigatório, mínimo de 10 caracteres (mensagem clara se tiver menos).
- [ ] `PAC-26` A **política de cancelamento** aparece antes do pagamento.
- [ ] `PAC-27` Paciente que já tem consulta em aberto é avisado (`AGENDA_PACIENTE_JA_TEM_CONSULTA`) em vez de marcar outra.
- [ ] `PAC-28` Voltar entre os passos preserva as escolhas; trocar o horário antes de pagar funciona.
- [ ] `PAC-29` Horário escolhido some (fica ocupado) para outro paciente que abrir a agenda do mesmo médico.

### 3.4 Pagamento

- [ ] `PAC-30` **Pix:** gera QR code e código copia-e-cola; botão **Copiar código PIX** mostra "Copiado! ✓". Se o navegador bloquear a cópia, aparece a instrução para copiar à mão.
- [ ] `PAC-31` Pix confirmado no Asaas Sandbox → em até ~1 min a página muda sozinha para **"Sua consulta está confirmada"**, sem recarregar.
- [ ] `PAC-32` **Boleto:** mostra "Boleto gerado", vencimento em 1 dia útil e link para abrir o boleto.
- [ ] `PAC-33` **Cartão (sandbox):** formulário com número, nome, validade, CVV, CPF do titular, CEP e número; cartão de teste aprovado → "Pagamento aprovado!".
- [ ] `PAC-34` Cartão com dados inválidos/recusado → mensagem de erro clara, sem confirmar a consulta.
- [ ] `PAC-35` Consulta não paga segura o horário por 30 min; depois disso o horário volta a ficar livre.
- [ ] `PAC-36` Sair da tela de pagamento e voltar depois: em **Consultas** a consulta aparece "Aguardando pagamento" com **Pagar →**.
- [ ] `PAC-37` O valor cobrado é o valor do médico (não dá para alterar pelo navegador).

### 3.5 Minhas consultas (`/dashboard/patient/consultations`)

- [ ] `PAC-40` Tabela/lista com Data, Médico, Queixa, Status e Valor; no celular vira cartões legíveis.
- [ ] `PAC-41` Filtro por status (Todas, Em espera, Em andamento, Concluída, Cancelada) e busca por queixa ou nome funcionam juntos.
- [ ] `PAC-42` Paginação: avançar/voltar e números de página; filtros se mantêm ao mudar de página.
- [ ] `PAC-43` Lista vazia ou filtro sem resultado → "Nenhuma consulta encontrada".
- [ ] `PAC-44` **Ver consulta →** abre o detalhe.

### 3.6 Detalhe da consulta (`/dashboard/patient/consultations/{id}`)

- [ ] `PAC-50` Mostra data e hora, médico, motivo, status, pagamento (método, valor, pago em), e "Iniciada em / Encerrada em" quando houver.
- [ ] `PAC-51` **Salvar na agenda** (só consulta paga e marcada): link do Google Agenda abre com data/hora certas; arquivo `.ics` baixa e, importado, tem lembretes de 1 dia e 30 min.
- [ ] `PAC-52` **Cancelar consulta** com 24 h ou mais → confirmação diz que o valor será **estornado integralmente**; cancelar → "Consulta cancelada. O valor será estornado integralmente."
- [ ] `PAC-53` Cancelar com menos de 24 h → confirmação avisa que **não há estorno** ("Cancelar sem estorno").
- [ ] `PAC-54` Cancelar consulta não paga → cancela sem falar em estorno; o horário volta a ficar livre.
- [ ] `PAC-55` **Manter consulta** fecha a confirmação sem cancelar.
- [ ] `PAC-56` Consulta concluída mostra a **Prescrição médica** (se houver) e o resumo; consulta cancelada não mostra botão de entrar nem de cancelar.
- [ ] `PAC-57` Quando o médico clica em **Chamar paciente**, aparece "Dra. Fulana está te chamando" e o botão **Entrar na sala**.
- [ ] `PAC-58` Abrir o detalhe de uma consulta de **outro paciente** (trocando o id na URL) → acesso negado / não encontrado.

### 3.7 Sala da consulta — lado do paciente (`/consulta/{id}`)

- [ ] `PAC-60` Antes de o médico iniciar, a sala informa que está aguardando; depois de iniciar, libera vídeo e chat.
- [ ] `PAC-61` O navegador pede câmera e microfone; aceitar → vídeo próprio e do médico aparecem; áudio nos dois sentidos.
- [ ] `PAC-62` Botões de câmera e microfone desligam e religam; os ícones mostram o estado.
- [ ] `PAC-63` Negar permissão de câmera/microfone → aviso "Câmera bloqueada / Microfone bloqueado", sem travar a sala; o chat continua.
- [ ] `PAC-64` Chat: enviar mensagem, receber a do médico em até ~5 s; mensagens com acento, emoji e quebra de linha aparecem certas.
- [ ] `PAC-65` Mensagem acima de 2000 caracteres é recusada com aviso.
- [ ] `PAC-66` Mensagem com HTML/script (ex.: `<b>oi</b>`, `<script>alert(1)</script>`) aparece como texto, sem executar.
- [ ] `PAC-67` O paciente **não** vê as notas internas do médico em nenhum lugar (sala, detalhe, PDF, exportação).
- [ ] `PAC-68` Recarregar a página no meio da consulta volta para a sala com o histórico do chat.
- [ ] `PAC-69` Ao encerrar, a sala avisa que a consulta terminou; o chat mostra "Consulta encerrada: você pode mandar mensagens até <data e hora>".
- [ ] `PAC-70` Até 24 h depois do fim dá para mandar mensagem; depois disso aparece "Chat encerrado. As mensagens continuam aqui para consulta." e a caixa fica bloqueada.
- [ ] `PAC-71` Em consulta cancelada, o chat não aceita envio.

### 3.8 Receitas (`/dashboard/patient/prescriptions`)

- [ ] `PAC-80` Lista as receitas emitidas (tipo, médico, data, orientações); sem receitas → "Nenhuma receita ainda".
- [ ] `PAC-81` **Visualizar** abre o PDF na janela de visualização; **Baixar PDF** baixa; **Nova aba** abre o PDF.
- [ ] `PAC-82` O PDF tem dados do paciente e do médico (CRM), itens, orientações, validade, link e **QR code** de validação e o aviso de certificado de teste.
- [ ] `PAC-83` Receita em rascunho (Elaine) não aparece como emitida para o paciente.

### 3.9 Peso e medidas (`/dashboard/patient/peso`)

- [ ] `PAC-90` Gráfico **Evolução do peso** com as pesagens; troca para **Evolução do IMC** funciona.
- [ ] `PAC-91` Filtros de período (ex.: 30 dias, 3 meses, 6 meses, tudo) mudam o gráfico; período sem dados → "Nenhuma pesagem neste período."
- [ ] `PAC-92` IMC mostra o valor e a faixa da OMS (ex.: sobrepeso, obesidade I).
- [ ] `PAC-93` **Registrar peso:** peso, data e observação opcional → "Peso registrado." e o gráfico atualiza.
- [ ] `PAC-94` Peso fora de limites (0, negativo, 999, letras) e data no futuro são recusados com mensagem.
- [ ] `PAC-95` Sem altura no perfil → "Falta a sua altura" / "Informe sua altura para ver a evolução do IMC" com **Informar agora**.
- [ ] `PAC-96` **Altura e meta:** mudar a altura recalcula o IMC de **todo** o histórico; a meta aparece no gráfico; aparece a sugestão "Topo da faixa de peso normal para a sua altura".
- [ ] `PAC-97` Apagar uma pesagem pede confirmação e some do gráfico.
- [ ] `PAC-98` **Outras medidas:** registrar cintura, quadril, gordura corporal e massa magra; cada uma tem gráfico e "Última: ...".
- [ ] `PAC-99` RCEst (cintura ÷ altura) aparece depois de registrar a cintura (com altura no perfil); RCQ (cintura ÷ quadril) depois de cintura e quadril.
- [ ] `PAC-100` Apagar medida pede confirmação ("Apagar esta medida?").
- [ ] `PAC-101` Nenhuma tela promete resultado, mostra metas automáticas de medidas, sequências ou lembretes.
- [ ] `PAC-102` A pesagem registrada pelo médico na consulta aparece com "Registrado por" o médico.

### 3.10 Perfil (`/dashboard/patient/profile`)

- [ ] `PAC-110` Resumo com foto, peso atual, IMC, consultas feitas, próxima consulta.
- [ ] `PAC-111` **Foto:** escolher JPG/PNG/WebP, recortar (arrastar e zoom), **Salvar foto** → aparece no topo e no perfil; **Trocar** e **Remover** funcionam.
- [ ] `PAC-112` Foto acima de 15 MB ou arquivo que não é imagem (PDF, .txt renomeado) → mensagem de erro.
- [ ] `PAC-113` **Dados pessoais:** nome e telefone editáveis; e-mail e CPF **não** editáveis; telefone em branco remove.
- [ ] `PAC-114` **Informações de saúde:** nascimento, sexo, tipo sanguíneo ("Não sei / não informado"), alergias e medicamentos (adicionar e remover itens), observações, altura e meta → **Salvar alterações**.
- [ ] `PAC-115` Sair da seção com mudanças não salvas mostra "Alterações não salvas".
- [ ] `PAC-116` **Contato de emergência:** nome, telefone e relação; o médico vê no prontuário.
- [ ] `PAC-117` **Trocar senha:** senha atual errada → erro; nova senha fraca → regra; confirmação diferente → "As senhas não conferem"; sucesso → "Senha alterada" e o próximo login usa a nova.
- [ ] `PAC-118` Conta criada pelo Google: trocar senha informa que a conta não tem senha.
- [ ] `PAC-119` **Baixar meus dados:** baixa um JSON com cadastro, saúde, consultas, receitas, pesagens e mensagens — e **sem** notas internas do médico.
- [ ] `PAC-120` **Desativar conta** (só com a sua conta de teste): pede a senha; com consulta marcada é recusado com mensagem; sem consultas, desativa e não consegue mais entrar.

---

## 4. Médico (site)

Use a Dra. Fernanda para atender (tem certificado) e um médico de teste seu
para pendência, aprovação, certificado e perfil.

### 4.1 Credenciamento

- [ ] `MED-01` Médico pendente vê **Credenciamento em análise** e não consegue atender nem aparece para pacientes.
- [ ] `MED-02` Médico reprovado vê **Cadastro reprovado** com o motivo.
- [ ] `MED-03` Depois da aprovação pelo admin, o painel completo é liberado (pode ser preciso esperar até 60 s ou entrar de novo).

### 4.2 Painel inicial (`/dashboard/doctor`)

- [ ] `MED-10` Usa o **tema escuro** (diferente do paciente).
- [ ] `MED-11` Mostra a agenda e os atendimentos do dia, "Pacientes confirmados em ordem"; sem consultas → "Sua agenda está livre...".
- [ ] `MED-12` Indicadores de receita (bruto, o que o médico recebe) com valores coerentes com as consultas pagas.
- [ ] `MED-13` Nenhum texto ou menu fala em "Fila" (fila desligada).
- [ ] `MED-14` Sino de notificações mostra consultas novas/próximas.

### 4.3 Consultas (`/dashboard/doctor/consultations`)

- [ ] `MED-20` Lista com filtros por status, busca por queixa ou nome do paciente e paginação.
- [ ] `MED-21` Abrir uma consulta mostra paciente, motivo, data, pagamento e as ações possíveis.
- [ ] `MED-22` **Chamar paciente** → status "Paciente chamado" e aviso aparece para o paciente.
- [ ] `MED-23` **Iniciar consulta** → status "Em andamento"; **Entrar na sala** abre `/consulta/{id}`.
- [ ] `MED-24` **Não compareceu** só fica disponível depois do horário marcado; pede confirmação; o status muda para "Não compareceu" e o paciente é avisado.
- [ ] `MED-25` O médico não consegue abrir consultas de **outro médico** trocando o id na URL.
- [ ] `MED-26` Modal de detalhes da consulta concluída mostra anamnese, conduta, notas internas (só para ele), anexos e receitas.

### 4.4 Sala da consulta — lado do médico (`/consulta/{id}`)

- [ ] `MED-30` Indicador "Aguardando paciente" / "Paciente online" muda quando o paciente entra e sai.
- [ ] `MED-31` Cronômetro "Tempo de consulta em andamento" conta corretamente.
- [ ] `MED-32` Vídeo, câmera, microfone e chat: mesmos testes de `PAC-61` a `PAC-66`, do lado do médico.
- [ ] `MED-33` **Prontuário:** queixa principal, anamnese, diagnóstico, conduta, notas internas; "Auto-save ativo" salva sozinho ("Salvo hh:mm"); recarregar a página mantém o texto.
- [ ] `MED-34` Sem internet durante a digitação → "Falha ao salvar — tentando de novo..." e salva quando a conexão volta.
- [ ] `MED-35` Cartão do paciente mostra alergias, medicações em uso, tipo sanguíneo e **contato de emergência**.
- [ ] `MED-36` **Histórico:** o médico vê as consultas anteriores **dele** com esse paciente (data, queixa, diagnóstico, conduta, medicamentos); não vê as de outros médicos.
- [ ] `MED-37` **Aba Peso:** mesma evolução do paciente; registrar a pesagem da consulta funciona e aparece para o paciente.
- [ ] `MED-38` **Outras medidas** na aba Peso: registrar a aferição da consulta.
- [ ] `MED-39` **Anexos:** enviar arquivo até 4 MB funciona e aparece para os dois; acima de 4 MB → mensagem "arquivo muito grande" (não uma página de erro).
- [ ] `MED-40` **Encerrar atendimento** pede confirmação ("Esta ação não pode ser desfeita") e mostra a duração total; o paciente é avisado; o chat passa para o modo de 24 h.
- [ ] `MED-41` **Marcar não compareceu** pela sala funciona com confirmação.

### 4.5 Receita na sala

- [ ] `MED-50` Sem certificado: o painel avisa "Você ainda não tem um certificado digital" e oferece carregar/gerar.
- [ ] `MED-51` Tipos de receita disponíveis: Comum, Controle Especial, Antimicrobiano, Notificação Amarela A1/A2/A3, Azul B1/B2.
- [ ] `MED-52` Busca de medicamento na base ANVISA (ex.: "tirzepatida", "semaglutida", "losartana") traz resultados; adicionar vários itens com dose, via e posologia; remover item.
- [ ] `MED-53` O rascunho da receita salva sozinho ("Salvo hh:mm").
- [ ] `MED-54` **Emitir e assinar** pede confirmação; depois mostra "Receituário emitido" / "Receita assinada" e não deixa editar.
- [ ] `MED-55` A receita emitida aparece para o paciente em segundos (site e app).
- [ ] `MED-56` Emitir sem nenhum item → recusado com mensagem.

### 4.6 Minhas receitas (`/dashboard/doctor/prescriptions`)

- [ ] `MED-60` Lista as receitas emitidas por ele (tipo, paciente, data); abrir o PDF funciona; vazia → "Você ainda não emitiu receitas".

### 4.7 Certificado digital (`/dashboard/doctor/certificate`)

Somente com o seu médico de teste.

- [ ] `MED-70` **Gerar certificado de teste** pede confirmação e avisa "SEM validade jurídica"; depois mostra emissor, número de série e validade.
- [ ] `MED-71` **Carregar certificado A1 (.pfx/.p12)** com senha errada → erro; arquivo de outro tipo → erro.
- [ ] `MED-72` **Substituir** e **Remover certificado** pedem confirmação; sem certificado, não dá para emitir receita.
- [ ] `MED-73` A página não mostra a senha nem permite baixar o .pfx.

### 4.8 Perfil do médico (`/dashboard/doctor/profile`)

- [ ] `MED-80` Foto e contato: mesmos testes de foto do paciente (`PAC-111`, `PAC-112`); a foto aparece para o paciente na escolha do médico.
- [ ] `MED-81` **Informações profissionais** (auto-save): mini-bio, subespecialidade, **valor da consulta** (só entre R$ 50 e R$ 2.000) e **Aceitar novos atendimentos**.
- [ ] `MED-82` Desligar "Aceitar novos atendimentos" tira o médico da lista do paciente; religar devolve.
- [ ] `MED-83` **Horários de atendimento:** definir dias e faixas de horário; o paciente passa a ver exatamente esses horários (slots de 60 min).
- [ ] `MED-84` Formação: faculdade, ano de formatura, residência e idiomas (adicionar e remover).
- [ ] `MED-85` Trocar senha, baixar meus dados (JSON com cadastro, formação, agenda e resumo) e desativar conta (com consultas marcadas é recusado).

---

## 5. Administração (site, `admin@telemed.com.br`)

- [ ] `ADM-01` **Visão geral:** usuários totais, médicos ativos, médicos para aprovar, pagamentos pendentes, receita total e as 10 consultas mais recentes; os números batem com as outras telas.
- [ ] `ADM-02` Card **Saúde do sistema** mostra o estado do banco e dos serviços externos.
- [ ] `ADM-03` **Médicos:** cadastros pendentes com CRM/UF/especialidade e resultado da verificação; aprovar (com confirmação) → médico passa a atender e a aparecer para pacientes.
- [ ] `ADM-04` Reprovar **exige motivo**; o médico vê o motivo no site e no app.
- [ ] `ADM-05` **Usuários:** lista com papel e status; buscar/filtrar; **Desativar** (com confirmação) impede o login; **Reativar** devolve o acesso. (Só com contas de teste suas.)
- [ ] `ADM-06` **Consultas:** lista de todas as consultas com filtros e paginação.
- [ ] `ADM-07` **Pagamentos:** total recebido, total de transações, taxa de conversão, ID Asaas e status de cada pagamento.
- [ ] `ADM-08` **Receitas:** histórico com tipo e médico.
- [ ] `ADM-09` **Certificados:** titular (CN), emissor, validade e marcação de certificado de teste.
- [ ] `ADM-10` **Auditoria:** ações registradas (login, aprovação, emissão de receita, cancelamento, desativação...) com data, autor e entidade; as ações feitas durante os testes aparecem.
- [ ] `ADM-11` Admin não consegue entrar nas áreas `/dashboard/patient` e `/dashboard/doctor`.

---

## 6. Validação pública da receita (`/prescricao/{id}`)

- [ ] `VAL-01` Abrir o link impresso no PDF **sem login** → "Receita válida", tipo, médico e CRM, data de emissão, validade, assinatura digital e aviso de **certificado de teste**.
- [ ] `VAL-02` Ler o **QR code** do PDF com a câmera do celular abre a mesma página.
- [ ] `VAL-03` Os dados do paciente aparecem abreviados (ex.: "Mariana C. S."), não completos.
- [ ] `VAL-04` Enviar o PDF original na conferência → "idêntico ao emitido".
- [ ] `VAL-05` Enviar um PDF alterado (ou outro PDF qualquer) → "NÃO corresponde".
- [ ] `VAL-06` Id inexistente → "Receita não encontrada". Receita em rascunho → "Receita não emitida". Receita vencida → "Receita vencida" com a data.
- [ ] `VAL-07` Nenhum texto afirma ICP-Brasil ou validade jurídica.

---

## 7. Fluxo de ponta a ponta (paciente + médico ao mesmo tempo)

Faça pelo menos uma vez **site ↔ site**, uma vez **app Android ↔ site** e uma
vez **app iPhone ↔ site**.

- [ ] `E2E-01` Cadastrar um paciente novo → entrar.
- [ ] `E2E-02` Agendar com a Dra. Fernanda → pagar com Pix (confirmado no sandbox) → consulta confirmada sozinha na tela.
- [ ] `E2E-03` Salvar na agenda (Google e `.ics`).
- [ ] `E2E-04` Médica: sino avisa → Consultas → **Chamar paciente** → paciente vê o chamado.
- [ ] `E2E-05` Médica inicia → os dois entram no vídeo, se veem e se ouvem; chat nos dois sentidos.
- [ ] `E2E-06` Médica preenche prontuário, registra peso e cintura, emite receita assinada, encerra.
- [ ] `E2E-07` Paciente vê a receita, abre o PDF, valida pelo QR, vê o peso novo no gráfico.
- [ ] `E2E-08` Paciente manda mensagem depois do fim (dentro das 24 h) e a médica recebe.
- [ ] `E2E-09` Cancelamento: agendar outra consulta para daqui a mais de 24 h, pagar e cancelar → estorno integral; o horário volta a ficar livre.
- [ ] `E2E-10` Médico novo: cadastrar → admin aprova → configurar agenda e valor → aparece para o paciente → paciente consegue marcar.

---

## 8. App Android (APK)

### 8.1 Instalação e abertura

- [ ] `AND-01` Baixar pelo QR/link e instalar (permitir "fontes desconhecidas"); o ícone e o nome **Emacrescere** aparecem.
- [ ] `AND-02` Tela de abertura (splash) e **onboarding** com 3 páginas (Consulta marcada, Peso e IMC, Receita digital); **Próximo** e **Começar** funcionam; o onboarding não aparece de novo depois.
- [ ] `AND-03` Atualizar por cima de uma versão anterior mantém o login.
- [ ] `AND-04` Funciona em Android antigo (8/9) e novo (13/14), se houver aparelhos.

### 8.2 Login e cadastro no app

- [ ] `AND-10` Login de paciente leva às abas do paciente; de médico, às do médico; erro de senha mostra mensagem.
- [ ] `AND-11` **Esqueci minha senha** abre o fluxo do site.
- [ ] `AND-12` Cadastro de paciente ("Quem é você?") com as mesmas regras do site (`AUT-01` a `AUT-11`).
- [ ] `AND-13` Cadastro de médico: diálogo de verificação do CRM ("Consultando registro no conselho"... "verificação simulada") e tela de pendência.
- [ ] `AND-14` Médico pendente: tela **Credenciamento em análise** com **Verificar novamente** e **Sair da conta**; reprovado: **Cadastro não aprovado** com motivo.
- [ ] `AND-15` Admin tentando entrar no app → mensagem adequada (o app é só paciente e médico).
- [ ] `AND-16` Fechar e reabrir o app mantém a sessão; **Sair da conta** pede confirmação.

### 8.3 Paciente no app (abas Início, Peso, Consultas, Chat, Perfil)

- [ ] `AND-20` **Início:** próxima consulta com contagem "Começa em", status de pagamento, seu progresso de peso, última receita; puxar para baixo atualiza.
- [ ] `AND-21` **Agendar:** 3 passos (médico → data e horário → motivo), busca de médico, "CRM verificado", valor, "Este médico não atende nesse dia", "Todos os horários deste dia já foram preenchidos", motivo mínimo de 10 caracteres, política de cancelamento visível.
- [ ] `AND-22` **Pagamento:** Pix (QR + **Copiar código Pix** → "Código Pix copiado."), boleto (**Abrir boleto**), cartão abre o site ("Pagar com cartão no site"); **Pagar depois** deixa a consulta em "Aguardando pagamento".
- [ ] `AND-23` Tela "Confirme seu pagamento" muda sozinha para confirmada quando o Pix é pago; **Desistir da consulta** pede confirmação e cancela.
- [ ] `AND-24` **Consultas:** lista, detalhe com motivo, prontuário liberado ao paciente, receita ("Receita assinada" / "Receita em preparação"), **Baixar PDF** abre o PDF no aparelho.
- [ ] `AND-25` **Salvar na agenda** abre o `.ics` no app de agenda do celular.
- [ ] `AND-26` **Desmarcar consulta** mostra a regra de reembolso e cancela.
- [ ] `AND-27` **Agenda** (calendário) mostra os dias com consulta; dia vazio → "Nada agendado para este dia."
- [ ] `AND-28` **Chat:** "Conversas ativas" e "Consultas anteriores"; enviar/receber mensagens; depois do fim mostra "Você pode mandar mensagens até ..."; passadas 24 h a caixa fica bloqueada.
- [ ] `AND-29` **Vídeo** na sala: **Entrar no vídeo**, aceitar permissões, ver e ouvir o médico, ligar/desligar microfone e câmera, **Virar a câmera**, **Sair do vídeo** e entrar de novo; negar permissão mostra aviso sem travar.
- [ ] `AND-30` **Peso:** registrar pesagem, gráfico com períodos (30 dias, 3 meses, 6 meses), IMC, meta ("Faltam X kg", "Meta atingida!"), apagar pesagem com confirmação, **Altura e meta**.
- [ ] `AND-31` **Outras medidas** (cintura, quadril, gordura, massa magra) com RCEst/RCQ, registrar e "Apagar a última".
- [ ] `AND-32` **Perfil:** dados, saúde, contato de emergência; **Editar informações** salva e reflete no site; **Trocar senha**; **Trocar foto** (câmera e galeria) e remover.
- [ ] `AND-33` **Tema escuro** liga e desliga e fica salvo ao reabrir.
- [ ] `AND-34` Nenhuma tela mostra "Fila" ou "Fale com um médico agora".

### 8.4 Médico no app (abas Consultas, Agenda, Perfil)

- [ ] `AND-40` **Consultas:** próximas consultas, em andamento, chave **Disponível para atender** (desligada → "Você não aparece para novos agendamentos").
- [ ] `AND-41` Sala do médico: **Iniciar atendimento** (com confirmação), vídeo, chat, **Editar prontuário** (diagnóstico, conduta, observações internas → **Salvar prontuário**), **Evolução de peso** com **Registrar peso aferido**, **Encerrar consulta**.
- [ ] `AND-42` Receita no app aparece como "Receita (no site)": a emissão é só pelo site — conferir que o texto deixa isso claro.
- [ ] `AND-43` **Agenda** do médico mostra as consultas por dia.
- [ ] `AND-44` **Perfil** do médico: dados profissionais, valor da consulta, "Credenciado pela Emacrescere", editar nome e telefone, trocar senha e foto, aviso de que bio, valor e horários são editados no site.
- [ ] `AND-45` Não aparece a aba **Fila**.

### 8.5 Comportamento do app

- [ ] `AND-50` Modo avião / sem internet: mensagens de erro com **Tentar de novo**, sem fechar o app; volta a funcionar com a internet.
- [ ] `AND-51` Sessão expirada (ex.: senha trocada no site) → app volta para o login sem travar.
- [ ] `AND-52` Girar a tela não perde o que foi digitado nem quebra o layout.
- [ ] `AND-53` Botão Voltar do Android volta uma tela (não fecha o app de repente no meio de um fluxo).
- [ ] `AND-54` Fonte do sistema em tamanho grande: textos não ficam cortados nem sobrepostos.
- [ ] `AND-55` Minimizar o app durante a chamada e voltar: o vídeo reconecta ou oferece entrar de novo.
- [ ] `AND-56` Dados alterados no app aparecem no site e vice-versa (perfil, peso, mensagens, consultas).

---

## 9. App no iPhone (versão web em `/app/`)

- [ ] `IOS-01` Abrir `tcc-emacrescere.vercel.app/app` no Safari (de preferência em aba privada na primeira vez) → o app carrega.
- [ ] `IOS-02` **Compartilhar → Adicionar à Tela de Início → Adicionar**: ícone aparece; abrir pelo ícone em tela cheia.
- [ ] `IOS-03` Login com a mesma conta do site; a sessão continua ao fechar e reabrir.
- [ ] `IOS-04` Repetir no iPhone os itens principais do paciente: `AND-20` a `AND-34` (exceto o que depende do Android).
- [ ] `IOS-05` Repetir os itens do médico: `AND-40` a `AND-45`.
- [ ] `IOS-06` Vídeo: o Safari pede câmera e microfone na primeira vez; a chamada funciona com o outro lado no site.
- [ ] `IOS-07` "Baixar PDF" da receita: se não funcionar na versão web, a mensagem precisa explicar ("só funciona no app nativo") e oferecer alternativa.
- [ ] `IOS-08` Teclado do iPhone não cobre o campo do chat nem os botões dos formulários.
- [ ] `IOS-09` Área do "notch" e barra inferior do iPhone não cobrem botões.

---

## 10. Responsividade do site no celular e tablet

Para **cada** tela das seções 1 a 6, nas larguras da seção 0.3:

- [ ] `RES-01` Sem rolagem horizontal da página em nenhuma largura (320 px incluído).
- [ ] `RES-02` Textos sem corte, sem sobreposição e legíveis sem zoom.
- [ ] `RES-03` Botões e links com área de toque confortável (≈ 44 px) e espaçados.
- [ ] `RES-04` Menu do topo da landing vira menu de celular e abre/fecha.
- [ ] `RES-05` No painel, o menu lateral some e aparece a **barra inferior**; ela não cobre o último item da página.
- [ ] `RES-06` Tabelas (consultas, pagamentos, usuários, auditoria) viram cartões ou rolam só dentro da tabela.
- [ ] `RES-07` Modais e confirmações cabem na tela, rolam por dentro e têm botão de fechar visível.
- [ ] `RES-08` Formulários: o teclado certo aparece (numérico no CPF/telefone/peso, e-mail no e-mail); o teclado não esconde o campo ativo.
- [ ] `RES-09` Gráficos de peso, IMC e medidas se ajustam à largura e continuam legíveis.
- [ ] `RES-10` Wizard de agendamento: lista de médicos, datas e horários usáveis com o dedo.
- [ ] `RES-11` Sala da consulta no celular: vídeo, chat, prontuário e receita acessíveis (abas/rolagem), sem sobreposição; o chat continua usável com o teclado aberto.
- [ ] `RES-12` PDF da receita abre e dá para baixar no celular.
- [ ] `RES-13` Paisagem no celular e tablet (768 e 1024 px) mantêm o layout organizado.
- [ ] `RES-14` Zoom do navegador em 200% (desktop) não quebra o layout nem esconde conteúdo.
- [ ] `RES-15` Telas grandes (1920 px) não ficam com conteúdo esticado demais.

---

## 11. Compatibilidade de navegadores

- [ ] `NAV-01` Fluxos principais (cadastro, login, agendar, pagar, sala, receita, peso) em Chrome, Firefox, Edge e Safari.
- [ ] `NAV-02` Vídeo funciona em Chrome, Firefox, Edge e Safari (inclusive Safari do iPhone e Chrome do Android acessando o **site**).
- [ ] `NAV-03` Modelos 3D carregam em todos; se o 3D não carregar, a página continua utilizável.
- [ ] `NAV-04` Console do navegador (F12) sem erros vermelhos nas telas principais (anotar se houver).

---

## 12. Acessibilidade

- [ ] `ACE-01` Navegar só com o teclado (Tab, Shift+Tab, Enter, Esc) em login, cadastro, agendamento, pagamento e perfil; o foco é sempre visível.
- [ ] `ACE-02` Modais prendem o foco dentro e fecham com Esc; o foco volta ao botão que abriu.
- [ ] `ACE-03` Campos têm rótulo; erros de validação são lidos junto do campo.
- [ ] `ACE-04` Leitor de tela (NVDA no Windows, VoiceOver no iPhone, TalkBack no Android) lê botões e ícones com nome (ex.: "Mostrar senha", "Ativar câmera").
- [ ] `ACE-05` Contraste suficiente de textos e botões, inclusive no tema escuro do médico e do app. (Conhecido: botão verde padrão com 3,8:1 — anotar onde aparece.)
- [ ] `ACE-06` Imagens com texto alternativo; gráficos têm descrição em texto.
- [ ] `ACE-07` Ferramenta automática (axe DevTools ou Lighthouse → Acessibilidade) sem violações graves nas páginas principais.

---

## 13. Segurança e privacidade (testes de caixa-preta)

- [ ] `SEG-01` Trocar ids na URL (consulta, receita, PDF, anexos, avatar, prontuário) para acessar dados de outra pessoa → sempre negado.
- [ ] `SEG-02` Chamar a API sem estar logado (ex.: abrir `/api/profile` numa aba anônima) → resposta 401 em JSON, sem dados.
- [ ] `SEG-03` Paciente não consegue chamar ações de médico (iniciar, encerrar, emitir receita) nem de admin.
- [ ] `SEG-04` Notas internas do médico nunca aparecem para o paciente (sala, detalhe, PDF, exportação JSON, app).
- [ ] `SEG-05` Campos de texto (chat, prontuário, motivo, bio, observações) com HTML/script são mostrados como texto.
- [ ] `SEG-06` Upload de arquivo com extensão trocada (ex.: `.exe` renomeado para `.jpg`) é recusado.
- [ ] `SEG-07` Mensagens de erro não mostram detalhes técnicos (stack, SQL, nomes de tabela).
- [ ] `SEG-08` Logout invalida o acesso: copiar uma URL do painel, sair e abrir → pede login.
- [ ] `SEG-09` Páginas do site sempre em HTTPS; nenhuma senha aparece na URL.
- [ ] `SEG-10` Conta desativada pelo admin perde o acesso em até ~60 s mesmo com sessão aberta.

---

## 14. Desempenho

- [ ] `DES-01` Página inicial carrega em até ~3 s numa conexão 4G (DevTools → "Fast 4G"); Lighthouse Performance anotado (desktop e celular).
- [ ] `DES-02` Painéis abrem em até ~3 s; carregamentos longos mostram indicador (skeleton/"Carregando...").
- [ ] `DES-03` Mensagem do chat chega ao outro lado em até ~5 s.
- [ ] `DES-04` Confirmação de pagamento reflete na tela em até ~1 min.
- [ ] `DES-05` Página inicial no celular não esquenta/trava com os modelos 3D (no celular eles não devem carregar no topo).
- [ ] `DES-06` App Android abre em até ~5 s e a rolagem é fluida.

---

## 15. Tempo real, concorrência e situações de erro

- [ ] `ERR-01` Desligar a internet no meio do uso do site → aviso de conexão (banner); ao voltar, a página se recupera.
- [ ] `ERR-02` Duas abas do mesmo paciente: ações numa aba (pagar, cancelar) aparecem na outra ao atualizar.
- [ ] `ERR-03` Dois pacientes tentando o mesmo horário: o segundo recebe "horário ocupado". (Conhecido: cliques **exatamente** ao mesmo tempo podem reservar duas vezes — ver seção 17.)
- [ ] `ERR-04` Botões de ação (pagar, emitir, cancelar, encerrar) ficam desabilitados durante o envio; duplo clique não duplica a ação.
- [ ] `ERR-05` Erros mostram mensagem em português, com o que o usuário pode fazer (e um código, quando houver).
- [ ] `ERR-06` Sessão expirada durante o uso → redireciona ao login e, depois de entrar, volta para onde estava.
- [ ] `ERR-07` Páginas de erro (`error.tsx`) dos painéis aparecem com "Voltar ao painel" em vez de tela branca.

---

## 16. Conteúdo e regras do produto

Em **todas** as telas, no site, no app e no PDF:

- [ ] `CON-01` Nenhum texto fala em **fila** ou atendimento imediato (o atendimento é só com hora marcada).
- [ ] `CON-02` Nenhum texto diz que a plataforma vende, indica ou entrega medicamentos, nem fala em "farmácias parceiras".
- [ ] `CON-03` Nenhum texto afirma **ICP-Brasil** ou validade jurídica da receita; o aviso de certificado de teste aparece no PDF e na validação.
- [ ] `CON-04` Nenhum número, depoimento ou parceria inventada; nenhuma promessa de resultado de emagrecimento.
- [ ] `CON-05` A política de cancelamento é a mesma em todos os lugares (FAQ, agendamento, cancelamento, app).
- [ ] `CON-06` Ortografia e acentuação corretas; nome da marca sempre **Emacrescere**.
- [ ] `CON-07` Datas no formato brasileiro (dd/mm/aaaa), horários no fuso de Brasília, valores em R$ com vírgula.
- [ ] `CON-08` A verificação de CRM é apresentada como **simulada** onde aparece.

---

## 17. Problemas já conhecidos (não abrir como defeito novo)

Estão registrados em `docs/catalogo-erros.md` ("Problemas conhecidos") e ficam
para depois da banca. Se encontrar um deles, anote só se o comportamento for
**pior** do que o descrito:

- Reserva dupla de horário se dois pacientes clicarem exatamente ao mesmo tempo.
- Médico com cadastro pendente consegue agir numa consulta se acessar as rotas diretamente.
- Receita pode ser emitida em consulta de qualquer status.
- Rotas da fila (`/api/queue/*`) ainda respondem, embora a interface esteja desligada.
- Cliente novo criado no Asaas a cada tentativa de pagamento.
- Admin pode desativar um super administrador.
- Limite de tentativas de login em memória (reinício do servidor zera).
- Sessão de 30 dias.
- Anexos acima de ~4,5 MB não passam (limite da Vercel; S3 não configurado).
- Login com Facebook sem credenciais; e-mail (Resend) em modo sandbox.
- No app ainda faltam: formação do médico, baixar dados/desativar conta, contato de emergência e histórico no prontuário do médico.
- Contraste do botão verde padrão (3,8:1).

---

## 18. Critério de aceite (entregável ou não)

O sistema é considerado **entregável** quando:

1. **Nenhum defeito Bloqueante** aberto.
2. Todos os itens de `E2E-01` a `E2E-10` passam em **site ↔ site** e pelo menos
   `E2E-01` a `E2E-07` passam com o **app Android** e com o **app iPhone**.
3. Todos os itens de **segurança** (seção 13) e de **conteúdo** (seção 16)
   passam.
4. No máximo **3 defeitos de severidade Alta** abertos, todos com contorno
   documentado para a demonstração.
5. Responsividade (seção 10) sem falhas em 360, 390 e 1280 px.

### Resumo para o relatório final

| Seção | Total de itens | Passou | Falhou | Não testado |
|---|---|---|---|---|
| 1. Pública | | | | |
| 2. Autenticação | | | | |
| 3. Paciente | | | | |
| 4. Médico | | | | |
| 5. Admin | | | | |
| 6. Validação da receita | | | | |
| 7. Ponta a ponta | | | | |
| 8. App Android | | | | |
| 9. App iPhone | | | | |
| 10. Responsividade | | | | |
| 11. Navegadores | | | | |
| 12. Acessibilidade | | | | |
| 13. Segurança | | | | |
| 14. Desempenho | | | | |
| 15. Erros e tempo real | | | | |
| 16. Conteúdo | | | | |

Testador(a): ______________ · Período: ___/___ a ___/___ · Versão do site
(commit) e do APK: ______________

**Parecer:** ☐ Entregável ☐ Entregável com ressalvas ☐ Não entregável
