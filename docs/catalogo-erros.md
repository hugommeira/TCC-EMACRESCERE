# Catálogo de erros — Emacrescere

> Arquivo gerado por `npx tsx scripts/gerar-catalogo-erros.ts` a partir de
> `lib/error-catalog.ts`. Não edite à mão: mude o catálogo e gere de novo.

São 117 erros catalogados, 10 peças críticas mapeadas e 14 problemas conhecidos registrados.

## Como funciona

- **Resposta da API.** Todo erro sai no formato `{ "message": "...", "code": "CODIGO", "status": 409, "errors": { campo: [...] } }`. `message` já é o texto para o usuário; `errors` só aparece em erro de formulário.
- **Servidor.** Erro esperado é `throw new AppError("CODIGO")` (`lib/errors.ts`); numa rota, `return apiError("CODIGO")` (`lib/api-response.ts`). Erros do Prisma, JSON inválido e zod são convertidos sozinhos por `toApiError`. Mensagem técnica nunca chega ao usuário em produção.
- **Site.** Chamadas passam por `apiFetch` (`lib/api-client.ts`), que transforma qualquer falha em `ApiError` com código. `mensagemDeErro(err)` dá o texto. 401 leva ao login; falhas de rede seguidas acendem o aviso de conexão (`ConnectionBanner`).
- **App (Flutter).** `ApiError.from(e)` (`mobile/lib/services/api_error.dart`) faz o mesmo com os erros do Dio; 401 em qualquer tela volta ao início com "Sua sessão expirou" (`SessionGuard`).
- **Logs.** Erros 5xx e falhas de infraestrutura geram uma linha JSON com `code` (`logError`). Para achar no painel da Vercel, busque pelo código, por exemplo `INFRA_BANCO_INDISPONIVEL`.
- **Saúde do sistema.** `GET /api/health` (público: só o estado geral; administrador: cada peça) e o card "Saúde do sistema" no painel do administrador.
- **Adicionar um erro.** Crie a entrada em `lib/error-catalog.ts`, use o código e rode o gerador. O teste `test/falhas/catalogo.test.ts` reprova código usado e não catalogado, e documento desatualizado.

Colunas: **HTTP** 0 = erro que só existe no site/app (nunca vem da API); 200 = aviso que acompanha uma resposta de sucesso.

## Resumo por área

| Área | Erros |
|---|---|
| Geral (qualquer rota) | 8 |
| Autenticação e sessão | 13 |
| Cadastro e usuários | 12 |
| Administração | 2 |
| Agendamento | 6 |
| Consultas | 13 |
| Pagamentos e webhook do Asaas | 15 |
| Chat | 4 |
| Receitas | 6 |
| Certificado digital e assinatura | 10 |
| Arquivos e anexos | 7 |
| Peso e IMC | 3 |
| Videochamada | 6 |
| Rede e conexão (só no site/app) | 4 |
| Infraestrutura (só no log) | 4 |
| Fila on-demand (desligada) | 4 |

## Erros por área

### Geral (qualquer rota)

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `REQUISICAO_JSON_INVALIDO` | 400 | erro | Não foi possível ler os dados enviados. | Recarregue a página e tente de novo. | A rota responde 400 sem executar nada. | Corpo da requisição vazio ou JSON malformado (antes virava 500). | não |
| `DADOS_INVALIDOS` | 422 | aviso | Alguns campos estão inválidos. Confira os dados destacados. | Corrija os campos indicados e envie de novo. | A rota responde 422 com `errors` por campo; o formulário destaca cada campo. | Falha na validação zod (lib/validations). | não |
| `PARAMETRO_INVALIDO` | 422 | aviso | Parâmetro de busca inválido. | Volte e refaça o filtro ou a busca. | A rota responde 422 antes de consultar o banco. | Query string com número inválido, enum inexistente ou referência a registro que não existe (Prisma P2003). | não |
| `LIMITE_REQUISICOES` | 429 | aviso | Muitas tentativas em pouco tempo. Aguarde alguns instantes. | Espere o tempo indicado e tente de novo. | A rota responde 429 com cabeçalho Retry-After. | Rate limit em memória (lib/security.ts) por usuário, IP ou e-mail. | sim |
| `ORIGEM_NAO_AUTORIZADA` | 403 | erro | Esta ação foi bloqueada por segurança. | Use o site oficial ou o app; se o problema continuar, recarregue a página. | A mutação é recusada (proteção contra CSRF). | Cabeçalho Origin/Referer ausente, malformado ou fora da lista (NEXT_PUBLIC_APP_URL). | não |
| `NAO_ENCONTRADO` | 404 | aviso | O registro não foi encontrado. Ele pode ter sido removido. | Volte e atualize a lista. | A rota responde 404. | Registro inexistente ou removido entre a leitura e a escrita (Prisma P2025). | não |
| `CONFLITO_DUPLICADO` | 409 | aviso | Esse registro já existe. | Atualize a página: a ação pode já ter sido concluída. | A rota responde 409 sem gravar duplicado. | Violação de chave única (Prisma P2002), normalmente por clique duplo ou duas abas. | não |
| `ERRO_INTERNO` | 500 | **crítico** | Algo deu errado do nosso lado. Tente novamente em instantes. | Tente de novo; se continuar, avise o suporte informando o horário. | Mensagem técnica nunca é exposta em produção; o erro completo vai para o log com o código. | Exceção não prevista em rota ou serviço. | sim |

### Autenticação e sessão

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `AUTH_SESSAO_EXPIRADA` | 401 | aviso | Sua sessão expirou. Entre de novo para continuar. | Faça login novamente. | API responde 401 JSON (middleware); site e app levam ao login guardando a página de volta. | Sem cookie de sessão, sessão de 30 dias vencida ou conta desativada (revalidação a cada 60 s). | não |
| `AUTH_SEM_PERMISSAO` | 403 | erro | Você não tem permissão para fazer isso. | Entre com a conta certa (paciente, médico ou administrador). | A rota responde 403; páginas levam a /auth/unauthorized. | Papel do usuário não corresponde à rota. | não |
| `AUTH_CREDENCIAIS_INVALIDAS` | 401 | aviso | E-mail ou senha incorretos. | Confira os dados ou use "Esqueci minha senha". | Login negado e registrado na auditoria (user.login_failed). | Usuário inexistente, conta sem senha (login social) ou senha errada. A mensagem não diz qual, para não revelar e-mails. | não |
| `AUTH_SENHA_INCORRETA` | 401 | aviso | Senha incorreta. | Confira a senha ou use "Esqueci minha senha". | Login negado e registrado na auditoria (user.login_failed). | E-mail cadastrado com senha, mas a senha informada não confere. | não |
| `AUTH_EMAIL_SENHA_INCORRETOS` | 401 | aviso | E-mail e senha incorretos. | Confira o e-mail digitado ou crie uma conta. | Login negado e registrado na auditoria (user.login_failed). | Não existe conta com esse e-mail (ou ela não usa senha, como as de login social). | não |
| `AUTH_LOGIN_BLOQUEADO` | 429 | aviso | Muitas tentativas de login. Aguarde 15 minutos e tente de novo. | Espere 15 minutos ou redefina a senha. | Novas tentativas para esse e-mail são recusadas até a janela acabar. | Mais de 5 tentativas em 15 minutos para o mesmo e-mail (lib/auth.ts). | sim |
| `AUTH_CONTA_DESATIVADA` | 403 | erro | Sua conta está desativada. Fale com a equipe Emacrescere. | Entre em contato com o suporte. | Login negado; sessões abertas caem em até 60 s. | Administrador desativou a conta (User.active = false). Só é informado depois de a senha conferir. | não |
| `AUTH_OAUTH_SEM_EMAIL` | 400 | aviso | Sua conta social não compartilhou um e-mail verificado. | Libere o e-mail na conta Google/Facebook ou cadastre-se com e-mail e senha. | Login social recusado (redirect com ?error=GoogleSemEmail/FacebookSemEmail). | Provedor OAuth não devolveu e-mail (ou, no Google, e-mail não verificado). | não |
| `AUTH_OAUTH_CANCELADO` | 403 | info | O login foi cancelado ou não foi autorizado. | Tente entrar de novo e autorize o acesso. | Volta à tela de login. | Usuário cancelou na tela do provedor ou conta desativada (AccessDenied). | não |
| `AUTH_OAUTH_CONTA_NAO_VINCULADA` | 409 | aviso | Este e-mail já tem cadastro com outro método de login. | Entre com e-mail e senha (ou com o método usado no cadastro). | Login social recusado para não sequestrar a conta existente. | OAuthAccountNotLinked do Auth.js. | não |
| `AUTH_OAUTH_FALHOU` | 502 | erro | Não foi possível entrar com a conta social agora. | Tente de novo ou entre com e-mail e senha. | Volta à tela de login. | Falha no callback do provedor (OAuthCallbackError) ou provedor não configurado (Configuration). | sim |
| `AUTH_LINK_REDEFINICAO_INVALIDO` | 400 | aviso | Link de redefinição inválido ou expirado. | Peça um novo link em "Esqueci minha senha". | O token usado é apagado. | Token inexistente, vencido (15 min), já usado ou conta desativada. | não |
| `AUTH_EMAIL_NAO_ENVIADO` | 502 | erro | Não foi possível enviar o e-mail agora. | Tente de novo em alguns minutos. | No esqueci-a-senha a resposta continua genérica (não revela se o e-mail existe); a falha vai para o log. | Resend recusou o envio, ficou fora do ar ou a chave está ausente. | sim |

### Cadastro e usuários

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `USUARIO_EMAIL_JA_CADASTRADO` | 409 | aviso | E-mail já cadastrado. | Faça login ou use "Esqueci minha senha". | Cadastro recusado. | Já existe User com esse e-mail. | não |
| `USUARIO_CPF_JA_CADASTRADO` | 409 | aviso | CPF já cadastrado. | Faça login com a conta existente. | Cadastro recusado. | Já existe User com esse CPF. | não |
| `USUARIO_CRM_JA_CADASTRADO` | 409 | aviso | CRM já cadastrado. | Faça login com a conta existente ou fale com a equipe. | Cadastro recusado. | Já existe DoctorProfile com esse CRM. | não |
| `USUARIO_CRM_INVALIDO` | 422 | aviso | CRM não encontrado no conselho. | Confira o número e a UF do CRM. | Cadastro de médico recusado. | Verificação de CRM (simulada em services/external/cfm.ts) não encontrou o registro. | não |
| `USUARIO_CRM_SUSPENSO` | 422 | erro | Este CRM consta como suspenso no conselho. | Regularize o registro no conselho antes de se cadastrar. | Cadastro de médico recusado. | Verificação de CRM retornou situação SUSPENSO. | não |
| `USUARIO_NAO_ENCONTRADO` | 404 | aviso | Usuário não encontrado. | Atualize a lista. | A rota responde 404. | ID inexistente ou usuário removido. | não |
| `PERFIL_SENHA_ATUAL_INCORRETA` | 422 | aviso | A senha atual está incorreta. | Digite a senha que você usa hoje para entrar. | Troca de senha recusada e registrada na auditoria. | bcrypt.compare da senha atual falhou na troca de senha do perfil. | não |
| `PERFIL_SEM_SENHA` | 409 | info | Sua conta entra pelo Google e não tem senha para trocar. | Continue entrando com o Google, ou use "Esqueci minha senha" para criar uma. | Troca de senha recusada. | Usuário sem conta credentials (só login social). | não |
| `PERFIL_FOTO_INVALIDA` | 415 | aviso | Envie uma foto em JPG, PNG ou WebP. | Escolha outra imagem. | Envio da foto recusado. | MIME ou assinatura do arquivo fora de JPEG/PNG/WebP. | não |
| `PERFIL_FOTO_GRANDE` | 413 | aviso | Foto grande demais. O limite é 2 MB. | Escolha uma foto menor. | Envio da foto recusado. | Arquivo acima de 2 MB (o site já reduz a foto antes de enviar). | não |
| `PERFIL_DESATIVAR_COM_CONSULTAS` | 409 | aviso | Você tem consultas marcadas ou em andamento. Conclua ou cancele antes de desativar a conta. | Veja a lista de consultas e resolva as pendentes. | Desativação recusada; nada muda na conta. | Há consulta SCHEDULED, WAITING ou IN_PROGRESS do usuário. | não |
| `PERFIL_CONFIRMACAO_INVALIDA` | 422 | aviso | Digite DESATIVAR para confirmar. | Escreva a palavra exatamente como pedido. | Desativação recusada. | Conta sem senha (login social) não digitou a confirmação. | não |

### Administração

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `ADMIN_AUTODESATIVACAO` | 400 | aviso | Você não pode desativar a sua própria conta. | Peça a outro administrador. | Ação recusada. | Administrador tentou desativar a si mesmo. | não |
| `ADMIN_MEDICO_NAO_ENCONTRADO` | 404 | aviso | Médico não encontrado. | Atualize a lista de credenciamento. | A rota responde 404. | DoctorProfile inexistente. | não |

### Agendamento

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `AGENDA_MEDICO_INDISPONIVEL` | 409 | aviso | Este médico não está atendendo no momento. | Escolha outro médico. | Agendamento recusado. | Médico com available=false, não aprovado ou inexistente. | não |
| `AGENDA_HORARIO_FORA_DA_AGENDA` | 409 | aviso | Esse horário não está na agenda do médico. | Escolha um dos horários listados. | Agendamento recusado; o assistente volta à lista de horários. | Horário enviado não corresponde a um slot oferecido (lib/scheduling.ts). | não |
| `AGENDA_ANTECEDENCIA_MINIMA` | 409 | aviso | Agende com pelo menos 60 minutos de antecedência. | Escolha um horário mais tarde. | Agendamento recusado. | Horário a menos de MIN_LEAD_MINUTES do momento atual. | não |
| `AGENDA_HORARIO_OCUPADO` | 409 | aviso | Esse horário acabou de ser ocupado. Escolha outro. | Escolha outro horário. | Agendamento recusado; site e app voltam à lista de horários atualizada. | Outro paciente reservou o slot (consulta não paga segura o horário por 30 min). | sim |
| `AGENDA_PACIENTE_JA_TEM_CONSULTA` | 409 | aviso | Você já tem uma consulta marcada nesse horário. | Escolha outro horário ou desmarque a outra consulta. | Agendamento recusado. | Paciente com consulta ativa no mesmo horário. | não |
| `AGENDA_DATA_INVALIDA` | 422 | aviso | Data inválida. | Escolha a data no calendário. | A rota responde 422. | Parâmetro date fora do formato AAAA-MM-DD. | não |

### Consultas

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `CONSULTA_NAO_ENCONTRADA` | 404 | aviso | Consulta não encontrada. | Volte para a lista de consultas. | A rota responde 404. | ID inexistente ou consulta removida. | não |
| `CONSULTA_SEM_ACESSO` | 403 | erro | Você não participa desta consulta. | Volte para a sua lista de consultas. | A rota responde 403 e nada é revelado. | Usuário não é o paciente nem o médico da consulta. | não |
| `CONSULTA_ESTADO_INVALIDO` | 409 | aviso | Esta consulta não permite essa ação no estado atual. | Atualize a página para ver a situação atual. | Ação recusada sem alterar nada. | Ação incompatível com o status (ex.: cancelar consulta concluída). | não |
| `CONSULTA_TRANSICAO_INVALIDA` | 409 | aviso | Não é possível mudar a consulta para esse status. | Atualize a página para ver a situação atual. | Ação recusada; a tabela de transições está em services/api/consultation.ts. | Transição de status não permitida. | não |
| `CONSULTA_EM_ANDAMENTO_NAO_CANCELA` | 409 | aviso | A consulta já está em andamento. Peça ao médico para encerrá-la. | Fale com o médico pelo chat da consulta. | Cancelamento recusado. | Paciente tentou cancelar consulta IN_PROGRESS. | não |
| `CONSULTA_PAGAMENTO_PENDENTE` | 409 | aviso | O pagamento desta consulta ainda não foi confirmado. | Aguarde a confirmação do pagamento (Pix e cartão confirmam em instantes). | Início da consulta recusado até o webhook do Asaas confirmar. | Consulta agendada sem pagamento CONFIRMED/RECEIVED. | sim |
| `CONSULTA_FALTA_ANTES_DO_HORARIO` | 409 | aviso | Só é possível marcar falta depois do horário da consulta. | Aguarde o horário marcado. | Ação recusada. | Médico tentou marcar NO_SHOW antes de scheduledAt. | não |
| `CONSULTA_FALTA_CEDO_DEMAIS` | 409 | aviso | Aguarde mais alguns minutos antes de marcar que o paciente não compareceu. | Espere o tempo indicado. | Ação recusada. | Menos de 3 minutos desde o início do atendimento. | não |
| `CONSULTA_NAO_INICIADA` | 409 | aviso | A consulta ainda não começou. | Aguarde o médico iniciar a consulta. | Ação recusada. | Ação de sala (mensagem, vídeo) antes do status IN_PROGRESS. | não |
| `CONSULTA_NAO_EM_ANDAMENTO` | 409 | aviso | A consulta não está em andamento. | Atualize a página para ver a situação atual. | Ação recusada. | Encerrar/marcar falta em consulta que não está IN_PROGRESS (ex.: já encerrada em outra aba). | não |
| `CONSULTA_ENCERRADA` | 409 | info | Esta consulta já foi encerrada. | Consulte o resumo e a receita na lista de consultas. | Ação recusada. | Consulta COMPLETED, CANCELLED ou NO_SHOW. | não |
| `CONSULTA_CANCELADA_SEM_REEMBOLSO` | 200 | info | Consulta cancelada. Como faltavam menos de 24 horas, não há reembolso. | Nada a fazer. | Cancelamento concluído sem estorno (política de cancelamento). | Paciente cancelou com menos de 24 h de antecedência. | não |
| `CONSULTA_REEMBOLSO_FALHOU` | 502 | erro | Não foi possível processar o estorno agora. Tente de novo em alguns minutos. | Tente cancelar de novo em alguns minutos. | Cancelamento não é concluído enquanto o estorno falhar (consulta continua ativa). | Asaas recusou ou não respondeu ao pedido de estorno. | sim |

### Pagamentos e webhook do Asaas

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `PAGAMENTO_NAO_AGUARDANDO` | 409 | aviso | Esta consulta não está aguardando pagamento. | Atualize a página. | Cobrança não é criada. | Consulta em status diferente de SCHEDULED. | não |
| `PAGAMENTO_JA_PAGO` | 409 | info | Esta consulta já está paga. | Nada a fazer: acompanhe a consulta na sua lista. | Nova cobrança não é criada. | Pagamento já CONFIRMED/RECEIVED. | não |
| `PAGAMENTO_ESTORNADO` | 409 | aviso | O pagamento desta consulta foi estornado. | Agende uma nova consulta. | Nova cobrança não é criada. | Pagamento REFUNDED. | não |
| `PAGAMENTO_HORARIO_EXPIRADO` | 409 | aviso | O horário desta consulta já passou. Agende um novo. | Agende outro horário. | Cobrança não é criada. | Paciente tentou pagar depois do horário marcado. | não |
| `PAGAMENTO_HORARIO_TOMADO` | 409 | aviso | Esse horário foi ocupado por outro paciente. Agende um novo. | Agende outro horário. | Cobrança não é criada. | Reserva de 30 min expirou e outro paciente pagou o slot. | não |
| `PAGAMENTO_RECUSADO` | 402 | aviso | O pagamento foi recusado. | Confira os dados do cartão ou escolha Pix. | Cobrança não é concluída; a mensagem do Asaas é repassada quando existir. | Asaas recusou (cartão negado, CPF inválido, dados incompletos). | não |
| `PAGAMENTO_GATEWAY_NAO_CONFIGURADO` | 503 | **crítico** | O pagamento está indisponível no momento. | Tente mais tarde; a equipe precisa corrigir a configuração. | Nenhuma cobrança é criada; o log registra o código. | ASAAS_API_KEY ausente ou inválida (Asaas responde 401). | não |
| `PAGAMENTO_GATEWAY_INDISPONIVEL` | 503 | erro | O serviço de pagamento não respondeu. Tente novamente em instantes. | Tente de novo em alguns minutos. | Requisição cancelada após 15 s; nada é cobrado. | Asaas fora do ar, lento (timeout) ou erro de rede. | sim |
| `PAGAMENTO_PIX_SEM_QR` | 200 | aviso | Não foi possível gerar o QR Code do Pix agora. | Use o código copia-e-cola ou tente de novo. | Cobrança criada sem QR; o log registra o código. | Falha ao buscar o QR Code no Asaas depois de criar a cobrança. | sim |
| `PAGAMENTO_SIMULACAO_DESLIGADA` | 404 | info | Simulação de pagamento indisponível neste ambiente. | Pague pelo Pix/cartão de verdade (sandbox). | Rota de simulação responde 404. | PAYMENT_MOCK diferente de true. | não |
| `PAGAMENTO_NAO_ENCONTRADO` | 404 | aviso | Pagamento não encontrado. | Atualize a página. | A rota responde 404. | Consulta sem registro de pagamento. | não |
| `WEBHOOK_TOKEN_INVALIDO` | 403 | **crítico** | Acesso negado. | Nenhuma (chamada externa). | Webhook recusado e registrado na auditoria (security.webhook_auth_failed). | Cabeçalho asaas-access-token ausente ou diferente de ASAAS_WEBHOOK_TOKEN. | não |
| `WEBHOOK_NAO_CONFIGURADO` | 500 | **crítico** | Servidor mal configurado. | Nenhuma (chamada externa). | Responde 500 para o Asaas reenviar depois que a variável for configurada. | ASAAS_WEBHOOK_TOKEN ausente no servidor. | não |
| `WEBHOOK_PAYLOAD_INVALIDO` | 422 | erro | Dados do webhook inválidos. | Nenhuma (chamada externa). | Evento ignorado. | Corpo sem payment.id ou payment.status. | não |
| `WEBHOOK_REGRESSAO_IGNORADA` | 200 | aviso | Evento ignorado. | Nenhuma (chamada externa). | O pagamento continua pago; o log registra o código. | Asaas mandou status PENDING/OVERDUE para pagamento já confirmado (evento atrasado ou fora de ordem). | não |

### Chat

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `CHAT_SALA_NAO_ENCONTRADA` | 404 | aviso | Sala de conversa não encontrada. | Volte para a consulta. | A rota responde 404. | roomToken inexistente. | não |
| `CHAT_FORA_DA_CONSULTA` | 409 | info | O chat só fica disponível durante a consulta. | Aguarde o médico iniciar a consulta. | Mensagem não é enviada. | Envio com a consulta ainda não iniciada (fora de WAITING/IN_PROGRESS e da janela pós-consulta). | não |
| `CHAT_ENCERRADO` | 409 | info | O chat desta consulta fechou 24 h depois do atendimento. | Se precisar, agende uma nova consulta. As mensagens antigas continuam visíveis. | Mensagem não é enviada; o histórico continua disponível para leitura. | Consulta COMPLETED há mais de CHAT_APOS_CONSULTA_HORAS (lib/chat-access.ts). | não |
| `CHAT_ENVIO_FALHOU` | 0 | aviso | Sua mensagem não foi enviada. | Toque em enviar de novo (o texto foi mantido). | O texto volta para a caixa de mensagem. | Falha de rede ou do servidor ao enviar. | sim |

### Receitas

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `RECEITA_NAO_ENCONTRADA` | 404 | aviso | Receita não encontrada. | Crie a receita antes de emitir. | A rota responde 404. | Consulta sem receita. | não |
| `RECEITA_JA_EMITIDA` | 409 | info | Esta receita já foi emitida e não pode mais ser alterada. | Baixe o PDF já emitido. | Ação recusada. | Receita com status ISSUED. | não |
| `RECEITA_SEM_ITENS` | 422 | aviso | Adicione ao menos um medicamento antes de emitir. | Inclua um item na receita. | Emissão recusada. | Receita sem itens. | não |
| `RECEITA_NAO_EMITIDA` | 409 | info | A receita ainda não foi emitida. | Aguarde o médico emitir a receita. | PDF não é entregue. | Receita em DRAFT. | não |
| `RECEITA_PERFIL_MEDICO_INCOMPLETO` | 409 | aviso | Seu perfil de médico está incompleto. | Complete o perfil (CRM, UF e especialidade). | Emissão recusada. | DoctorProfile ausente ou incompleto. | não |
| `RECEITA_PDF_FALHOU` | 500 | erro | Não foi possível gerar o PDF da receita. | Tente de novo; se continuar, avise o suporte. | Receita continua em rascunho; o log registra o erro. | Falha no pdf-lib ao montar o documento. | sim |

### Certificado digital e assinatura

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `CERTIFICADO_AUSENTE` | 409 | aviso | Você ainda não cadastrou um certificado digital. | Envie seu certificado .pfx ou gere um certificado de teste em Certificado digital. | Emissão recusada; a tela abre o envio do certificado. | Médico sem MedicalCertificate. | não |
| `CERTIFICADO_INATIVO` | 409 | aviso | Seu certificado digital está inativo. | Envie o certificado novamente. | Emissão recusada; a tela abre o envio do certificado. | MedicalCertificate.active = false. | não |
| `CERTIFICADO_EXPIRADO` | 409 | aviso | Seu certificado digital está vencido. | Envie um certificado válido. | Emissão recusada; a tela abre o envio do certificado. | validTo anterior à data atual. | não |
| `CERTIFICADO_ARQUIVO_PERDIDO` | 409 | erro | O arquivo do seu certificado não foi encontrado. | Envie o .pfx de novo, ou gere um certificado de teste em Certificado digital. | Emissão recusada; a tela abre o envio do certificado. | Registro existe mas o arquivo sumiu do armazenamento. | não |
| `CERTIFICADO_SENHA_INVALIDA` | 422 | aviso | Senha do certificado inválida. | Confira a senha e envie o certificado de novo. | Certificado não é salvo (ou a emissão é recusada). | Senha não abre o .pfx. | não |
| `CERTIFICADO_ARQUIVO_INVALIDO` | 422 | aviso | Arquivo de certificado inválido. Envie um .pfx ou .p12 de até 5 MB. | Exporte o certificado novamente em .pfx. | Certificado não é salvo. | Arquivo vazio, corrompido, não-DER ou maior que 5 MB. | não |
| `CERTIFICADO_ALGORITMO_NAO_SUPORTADO` | 422 | aviso | O formato de criptografia do seu certificado não é suportado. | Exporte o .pfx no modo "Compatibilidade — TripleDES-SHA1". | Emissão recusada. | PFX com algoritmo moderno (AES) que o node-forge não abre. | não |
| `CERTIFICADO_ASSINATURA_FALHOU` | 500 | erro | Não foi possível assinar a receita. | Tente de novo; se continuar, envie o certificado novamente. | Receita continua em rascunho; o log registra o erro técnico. | Falha no @signpdf ao assinar o PDF. | sim |
| `CERTIFICADO_CHAVE_SERVIDOR` | 503 | **crítico** | A assinatura digital está indisponível no momento. A equipe já pode corrigir pela configuração. | Tente mais tarde e avise o suporte. | Nenhum certificado é salvo ou usado; o log registra o código. | PFX_ENCRYPTION_KEY ausente, com tamanho errado ou trocada (os certificados guardados não abrem mais). | não |
| `CERTIFICADO_NAO_ENCONTRADO` | 404 | aviso | Certificado não encontrado. | Atualize a página. | A rota responde 404. | Exclusão de certificado inexistente. | não |

### Arquivos e anexos

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `ARQUIVO_AUSENTE` | 422 | aviso | Selecione um arquivo. | Escolha o arquivo e envie de novo. | Envio recusado. | Formulário sem arquivo. | não |
| `ARQUIVO_MUITO_GRANDE` | 413 | aviso | Arquivo grande demais. O limite é 4 MB. | Reduza o arquivo (foto menor ou PDF compactado). | Envio recusado antes de sair do navegador. | Vercel recusa corpos acima de ~4,5 MB antes de a rota rodar. | não |
| `ARQUIVO_TIPO_RECUSADO` | 415 | aviso | Tipo de arquivo não permitido. Envie PDF ou imagem. | Converta o arquivo para PDF, JPG ou PNG. | Envio recusado. | MIME fora da lista permitida. | não |
| `ARQUIVO_LINK_EXPIRADO` | 403 | aviso | Link do arquivo inválido ou expirado. | Volte à página e abra o arquivo de novo. | Download recusado. | Token de download HMAC vencido ou adulterado. | não |
| `ARQUIVO_NAO_ENCONTRADO` | 404 | aviso | Arquivo não encontrado. | Envie o arquivo novamente. | A rota responde 404. | Arquivo removido do S3/stored_files. | não |
| `ARQUIVO_ARMAZENAMENTO_FALHOU` | 502 | erro | Não foi possível salvar o arquivo agora. | Tente de novo em instantes. | Nada é registrado; o log guarda o erro técnico. | Falha no S3 ou no banco (tabela stored_files). | sim |
| `ARQUIVO_UPLOAD_DIRETO_INDISPONIVEL` | 501 | info | Envio direto indisponível neste servidor. | Use o botão de envio normal. | A rota responde 501. | Upload pré-assinado exige S3 configurado (hoje os arquivos ficam no banco). | não |

### Peso e IMC

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `PESO_PACIENTE_NAO_VINCULADO` | 403 | erro | Você não atende este paciente. | Acesse pelo atendimento do paciente. | Leitura/registro recusados. | Médico sem consulta com o paciente. | não |
| `PESO_PACIENTE_NAO_ENCONTRADO` | 404 | aviso | Paciente não encontrado. | Atualize a página. | A rota responde 404. | ID de paciente inexistente. | não |
| `PESO_REGISTRO_NAO_ENCONTRADO` | 404 | aviso | Registro de peso não encontrado. | Atualize a lista. | A rota responde 404. | Registro apagado em outra aba. | não |

### Videochamada

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `VIDEO_NAO_CONFIGURADO` | 503 | **crítico** | A videochamada está indisponível no momento. Use o chat da consulta. | Continue a consulta pelo chat e avise o suporte. | Token não é gerado; o log registra o código. | LIVEKIT_URL, LIVEKIT_API_KEY ou LIVEKIT_API_SECRET ausente. | não |
| `VIDEO_CONSULTA_NAO_INICIADA` | 409 | info | O vídeo abre quando o médico iniciar a consulta. | Aguarde nesta tela. | Token não é gerado. | Consulta fora de IN_PROGRESS. | não |
| `VIDEO_CAMERA_NEGADA` | 0 | aviso | O navegador bloqueou a câmera ou o microfone. | Clique no cadeado da barra de endereço, permita câmera e microfone e toque em Reconectar. | A sala continua aberta; chat e prontuário seguem funcionando. | Permissão negada (NotAllowedError). | não |
| `VIDEO_DISPOSITIVO_NAO_ENCONTRADO` | 0 | aviso | Não encontramos câmera ou microfone neste aparelho. | Conecte uma câmera/microfone ou use o chat. | A sala continua aberta sem vídeo. | Nenhum dispositivo de mídia (NotFoundError) ou em uso por outro app (NotReadableError). | não |
| `VIDEO_CONEXAO_PERDIDA` | 0 | aviso | A conexão de vídeo caiu. | Toque em Reconectar; se não voltar, use o chat. | Botão Reconectar pede novo token e reabre a sala. | Rede instável, LiveKit fora do ar ou bloqueio de CSP (NEXT_PUBLIC_LIVEKIT_URL). | sim |
| `VIDEO_NAVEGADOR_INSEGURO` | 0 | aviso | Este navegador não permite vídeo nesta conexão. | Abra o site pelo endereço https oficial. | O vídeo não é iniciado. | Página fora de contexto seguro (http na rede local). | não |

### Rede e conexão (só no site/app)

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `REDE_SEM_CONEXAO` | 0 | aviso | Sem conexão com a internet. | Verifique o Wi-Fi ou os dados móveis. | Aviso no topo da tela; as atualizações voltam sozinhas quando a conexão retorna. | Navegador/app offline ou servidor inacessível. | sim |
| `REDE_TEMPO_ESGOTADO` | 0 | aviso | O servidor demorou para responder. | Tente de novo em instantes. | Requisição cancelada após o tempo limite. | Rede lenta ou servidor sobrecarregado. | sim |
| `SERVIDOR_RESPOSTA_INVALIDA` | 0 | erro | O servidor respondeu de forma inesperada. | Recarregue a página e tente de novo. | A resposta é descartada; nada técnico é mostrado. | Resposta não-JSON (página HTML de erro da Vercel, 413, 504). | sim |
| `CONEXAO_INSTAVEL` | 0 | aviso | Conexão instável. Tentando reconectar… | Aguarde; se não voltar, recarregue a página. | Aviso aparece depois de 3 falhas seguidas das atualizações automáticas e some sozinho. | Polling de chat/status/fila falhando repetidamente. | sim |

### Infraestrutura (só no log)

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `INFRA_BANCO_INDISPONIVEL` | 503 | **crítico** | Nosso sistema está temporariamente indisponível. Tente novamente em instantes. | Aguarde alguns minutos e tente de novo. | A rota responde 503; o health check mostra o banco como fora. | Neon fora do ar, suspenso, credencial errada ou limite de conexões. | sim |
| `INFRA_REALTIME_FALHOU` | 0 | aviso | — (não aparece na tela) | Nenhuma: o usuário não vê este erro. | A ação é concluída normalmente; a atualização chega pelo polling (chat a cada 5 s). | Falha no LISTEN/NOTIFY do Postgres (lib/realtime.ts). | não |
| `INFRA_EMAIL_NAO_CONFIGURADO` | 0 | aviso | — (não aparece na tela) | Nenhuma: o usuário não vê este erro. | E-mail não é enviado; o log registra o código. | RESEND_API_KEY ausente. | não |
| `INFRA_AUDITORIA_FALHOU` | 0 | aviso | — (não aparece na tela) | Nenhuma: o usuário não vê este erro. | A ação continua; a falha vai para o log. | Falha ao gravar AuditLog. | não |

### Fila on-demand (desligada)

| Código | HTTP | Severidade | O usuário vê | O que ele deve fazer | Como o sistema reage | Causa | Repetir resolve? |
|---|---|---|---|---|---|---|---|
| `FILA_JA_EM_CONSULTA` | 409 | info | Você já tem uma consulta em andamento. | Acompanhe a consulta atual. | Entrada na fila recusada. | Paciente com consulta ativa. | não |
| `FILA_JA_ATENDIDO` | 409 | info | Paciente já foi atendido por outro médico. | Atualize a fila. | Ação recusada. | Outro médico pegou o paciente primeiro. | não |
| `MEDICO_EM_ANALISE` | 403 | info | Seu credenciamento ainda está em análise. Aguarde a aprovação. | Aguarde o e-mail de aprovação. | Acesso recusado. | DoctorProfile.approvalStatus = PENDING. | não |
| `MEDICO_REPROVADO` | 403 | erro | Seu cadastro de médico foi reprovado. Fale com a equipe Emacrescere. | Entre em contato com a equipe. | Acesso recusado. | DoctorProfile.approvalStatus = REJECTED. | não |

## Peças críticas: o que acontece quando uma para

| Peça | Papel | Sintoma | Códigos | Reação | Como detectar |
|---|---|---|---|---|---|
| Banco de dados (Neon PostgreSQL) | Guarda tudo: usuários, consultas, pagamentos, receitas, arquivos (stored_files) e sessões revalidadas. | Todas as telas que leem dados falham; login não funciona. | `INFRA_BANCO_INDISPONIVEL` | Rotas respondem 503 com mensagem amigável (sem texto do Prisma). Site e app mostram "temporariamente indisponível" com Tentar de novo. | GET /api/health (banco: fora) e logs da Vercel com code INFRA_BANCO_INDISPONIVEL. |
| Tempo real (LISTEN/NOTIFY do Postgres) | Empurra eventos de chat, status da sala e prontuário para quem está conectado. | Atualizações chegam com atraso (até o próximo polling). | `INFRA_REALTIME_FALHOU`, `CONEXAO_INSTAVEL` | A ação (mensagem, receita, encerramento) é salva e responde sucesso; a falha só vai para o log. O polling entrega a atualização. | Logs com code INFRA_REALTIME_FALHOU. |
| Videochamada (LiveKit) | Vídeo e áudio da consulta. | Sala sem vídeo ou vídeo caindo. | `VIDEO_NAO_CONFIGURADO`, `VIDEO_CONEXAO_PERDIDA`, `VIDEO_CAMERA_NEGADA`, `VIDEO_DISPOSITIVO_NAO_ENCONTRADO`, `VIDEO_NAVEGADOR_INSEGURO` | A sala continua aberta (chat, prontuário e receita funcionam). O vídeo mostra a causa e um botão Reconectar. | GET /api/health (video), mensagens na tela da sala e console do navegador (CSP). |
| Pagamentos (Asaas) | Cria cobranças Pix/cartão/boleto, confirma por webhook e faz estornos. | Paciente não consegue pagar; consultas não confirmam; cancelamento não estorna. | `PAGAMENTO_GATEWAY_INDISPONIVEL`, `PAGAMENTO_GATEWAY_NAO_CONFIGURADO`, `PAGAMENTO_RECUSADO`, `CONSULTA_REEMBOLSO_FALHOU`, `WEBHOOK_TOKEN_INVALIDO`, `WEBHOOK_NAO_CONFIGURADO` | Timeout de 15 s; nada é cobrado em falha; o webhook responde 500 em erro para o Asaas reenviar; cancelamento não é concluído se o estorno falhar. | GET /api/health (pagamento), painel do Asaas (webhooks com erro) e logs. |
| E-mail (Resend) | Envia o link de redefinição de senha. | Usuário não recebe o e-mail. | `AUTH_EMAIL_NAO_ENVIADO`, `INFRA_EMAIL_NAO_CONFIGURADO` | A tela continua com a mensagem genérica (não revela se o e-mail existe); a falha vai para o log. | GET /api/health (email) e logs. Em sandbox o Resend só entrega para o dono da conta. |
| Armazenamento de arquivos (S3 ou tabela stored_files) | Guarda anexos, PDFs de receita e certificados. | Upload ou download falha. | `ARQUIVO_ARMAZENAMENTO_FALHOU`, `ARQUIVO_NAO_ENCONTRADO`, `ARQUIVO_LINK_EXPIRADO`, `ARQUIVO_MUITO_GRANDE` | Nada é registrado se o arquivo não foi salvo; o usuário pode tentar de novo. | GET /api/health (armazenamento: s3 ou banco) e logs. |
| Certificados e chave de criptografia (PFX_ENCRYPTION_KEY) | Cifra os .pfx dos médicos e permite assinar receitas. | Médico não consegue enviar certificado nem emitir receita. | `CERTIFICADO_CHAVE_SERVIDOR`, `CERTIFICADO_ASSINATURA_FALHOU`, `CERTIFICADO_EXPIRADO`, `CERTIFICADO_SENHA_INVALIDA` | Emissão e upload recusados com mensagem clara; nada é gravado pela metade. Trocar a chave invalida todos os certificados guardados (médicos precisam reenviar). | GET /api/health (certificado) e logs. |
| Autenticação (NextAuth / NEXTAUTH_SECRET) | Sessões, login por e-mail/senha e Google, links de download assinados. | Ninguém consegue entrar; links de arquivos param. | `AUTH_SESSAO_EXPIRADA`, `AUTH_OAUTH_FALHOU`, `ARQUIVO_LINK_EXPIRADO` | API responde 401 JSON; site e app levam à tela de login. | GET /api/health (auth) e página /auth/error com error=Configuration. |
| Limitador de requisições (memória do servidor) | Protege login, cadastro, upload e outras rotas contra abuso. | Usuário legítimo bloqueado temporariamente. | `LIMITE_REQUISICOES`, `AUTH_LOGIN_BLOQUEADO` | 429 com Retry-After; a tela diz quanto esperar. Reiniciar o servidor zera os contadores. | Logs (auditoria security.rate_limit_hit em algumas rotas). |
| Plataforma de hospedagem (Vercel) | Executa o site e as rotas de API (região gru1). | Uploads grandes recusados; conexões SSE cortadas; respostas HTML de erro. | `ARQUIVO_MUITO_GRANDE`, `SERVIDOR_RESPOSTA_INVALIDA`, `REDE_TEMPO_ESGOTADO` | Limite de 4 MB checado antes do envio; cliente trata resposta não-JSON sem mostrar texto técnico; SSE reconecta e o polling cobre. | Painel da Vercel (funções com timeout/413). |

## Testes de falha

Cada cenário simula a peça parando (tudo com mocks: nenhum teste toca o banco real). Rodar com `npx vitest run test/falhas lib/api-client.test.ts`; o do app com `cd mobile && flutter test`.

| Peça | Simulação | Reação esperada | Teste |
|---|---|---|---|
| Banco de dados | Prisma lança PrismaClientInitializationError | 503 INFRA_BANCO_INDISPONIVEL, sem texto do Prisma | `rotas.test.ts` |
| Banco de dados | SELECT 1 do health check falha | /api/health responde 503, componente banco = fora | `webhook-health.test.ts` |
| Tempo real (NOTIFY) | conexão LISTEN do Postgres recusada | publish não lança; log INFRA_REALTIME_FALHOU; próxima chamada tenta de novo | `realtime.test.ts` |
| Asaas | rede caiu / timeout / 5xx | PAGAMENTO_GATEWAY_INDISPONIVEL (503) | `servicos-externos.test.ts` |
| Asaas | chave ausente ou recusada (401) | PAGAMENTO_GATEWAY_NAO_CONFIGURADO (503) | `servicos-externos.test.ts` |
| Asaas | cartão recusado (400 com descrição) | PAGAMENTO_RECUSADO com o motivo do Asaas | `servicos-externos.test.ts` |
| Webhook Asaas | PENDING atrasado para pagamento já confirmado | pagamento continua pago; log WEBHOOK_REGRESSAO_IGNORADA | `webhook-health.test.ts` |
| Resend | sem chave / 500 | sem chave: só log; 500: AUTH_EMAIL_NAO_ENVIADO | `servicos-externos.test.ts` |
| LiveKit | variáveis LIVEKIT_* ausentes | 503 VIDEO_NAO_CONFIGURADO na rota do token | `rotas.test.ts` |
| Chave dos certificados | PFX_ENCRYPTION_KEY ausente, curta ou trocada | CERTIFICADO_CHAVE_SERVIDOR (503) | `servicos-externos.test.ts` |
| Armazenamento | putObject lança no upload de anexo | 502 ARQUIVO_ARMAZENAMENTO_FALHOU, sem texto do storage | `rotas.test.ts` |
| Armazenamento | anexo acima de 4 MB | 413 ARQUIVO_MUITO_GRANDE (o site recusa antes de enviar) | `rotas.test.ts` |
| Auditoria | gravação do AuditLog falha | a ação (encerrar consulta) conclui; log INFRA_AUDITORIA_FALHOU | `rotas.test.ts` |
| Webhook Asaas | token errado / token não configurado / banco fora | 403 WEBHOOK_TOKEN_INVALIDO / 500 / 503 (o Asaas reenvia) | `webhook-health.test.ts` |
| Sessão | chamada /api/* sem cookie | 401 JSON AUTH_SESSAO_EXPIRADA (não mais redirect HTML) | `rotas.test.ts` |
| Login | 6ª tentativa em 15 min | código login_bloqueado → AUTH_LOGIN_BLOQUEADO | `login.test.ts` |
| Login | conta desativada (senha certa / senha errada) | conta_desativada / "senha incorreta" (não revela a conta) | `login.test.ts` |
| Permissão | médico tenta agendar como paciente | 403 AUTH_SEM_PERMISSAO (antes 401, como se a sessão tivesse caído) | `rotas.test.ts` |
| Requisição | corpo JSON malformado | 400 REQUISICAO_JSON_INVALIDO (antes 500) | `rotas.test.ts` |
| Requisição | ?status= inexistente | 422 PARAMETRO_INVALIDO (antes 500 do Prisma) | `rotas.test.ts` |
| Proteção CSRF | Referer malformado | 403 ORIGEM_NAO_AUTORIZADA (antes 500) | `classificacao.test.ts` |
| Cliente (site) | rede caiu, timeout, HTML no lugar de JSON, 401, 429 | ApiError com código e mensagem amigável; 401 leva ao login | `lib/api-client.test.ts` |
| Cliente (app) | cada DioExceptionType, HTML, 401, TypeError | ApiError com código; nunca texto do Dio | `mobile/test/api_error_test.dart` |

## Problemas conhecidos (registrados, ainda não corrigidos)

Ficaram de fora por exigirem mudança de schema (que vai para o banco de produção no deploy) ou de regra de negócio. Correção sugerida em cada um.

| Problema | Impacto | Causa | Correção sugerida |
|---|---|---|---|
| Reserva dupla de horário sob concorrência | Dois pacientes podem reservar o mesmo horário se clicarem ao mesmo tempo. | scheduleConsultation verifica e depois cria, sem transação nem índice único (doctorId, scheduledAt). | Índice único parcial ou transação serializável. Muda o schema, que vai para produção no db push: fazer depois da banca. |
| Médico com cadastro pendente consegue agir na consulta | Médico ainda não aprovado pode emitir receita, editar prontuário, mudar status, pegar token de vídeo e se marcar disponível. | assertDoctorApproved só é chamado nas rotas da fila. | Chamar assertDoctorApproved nas rotas de receita, prontuário, status, LiveKit e perfil (available=true). |
| Receita editável e emitível em qualquer status da consulta | Receita pode ser emitida para consulta cancelada ou que nunca aconteceu. | prescription PUT/issue não checam o status da consulta. | Permitir só em IN_PROGRESS ou COMPLETED. |
| Rotas da fila ativas na API | A fila está desligada na interface, mas /api/queue/* ainda aceita chamadas. | QUEUE_ENABLED só esconde a UI. | Responder 404 nas rotas /api/queue/* quando QUEUE_ENABLED=false. |
| Cliente novo no Asaas a cada tentativa de pagamento | Clientes duplicados no painel do Asaas. | A busca de cliente existente em initiatePayment é um placeholder; asaasCustomerId não é salvo. | Salvar asaasCustomerId no PatientProfile e reutilizar. |
| Consulta sob demanda paga pode não entrar na fila | Se moveConsultationToQueue falhar no webhook, o reenvio do Asaas não refaz o passo. | O pagamento é marcado como pago antes; no reenvio wasPaid=true pula a etapa. | Tornar o passo idempotente e executá-lo sempre que a consulta estiver paga e SCHEDULED. (Fila desligada: impacto atual nulo.) |
| Administrador pode desativar um super administrador | Um ADMIN pode bloquear contas de nível superior. | toggle não compara a hierarquia de papéis. | Recusar quando o alvo for ADMIN/SUPER_ADMIN e o autor não for SUPER_ADMIN. |
| CPF guardado em texto puro | Dado pessoal sensível exposto em caso de vazamento do banco (LGPD). | Coluna User.cpf sem cifragem (docs/auditoria-seguranca.md, 8c). | Cifrar com lib/crypto.ts e guardar um hash para a busca de duplicados. |
| Limitador de requisições em memória | Em várias instâncias da Vercel o limite real é multiplicado; reinício zera os contadores. | Map em memória por processo (lib/security.ts). | Usar Redis/Upstash ou tabela no banco. |
| Sessão de 30 dias | Sessão longa em aparelho compartilhado. | maxAge padrão do NextAuth (docs/auditoria-seguranca.md, 10a). | Definir session.maxAge menor (ex.: 7 dias). |
| Conexões SSE sem maxDuration | A Vercel corta o stream no limite da função; o cliente reconecta. | Rotas SSE sem export maxDuration. | Definir maxDuration e reconexão com backoff. O polling já cobre a entrega. |
| Dois hooks de SSE duplicados | Comportamentos de reconexão diferentes; hooks/useSSE.ts pode acumular conexões. | hooks/useSSE.ts e lib/hooks/useSse.ts coexistem. | Unificar em um só hook com backoff e limpeza no unmount. |
| Formulário de receita antigo aponta para rota inexistente | Nenhum hoje: o componente não é usado (a receita é feita no PrescriptionPanel da sala). | components/prescription/PrescriptionForm.tsx faz POST em /api/prescription, que não existe. | Apagar o componente ou apontá-lo para /api/consultations/[id]/prescription. |
| Upload de anexos limitado pela Vercel | Arquivos acima de ~4,5 MB não passam, apesar de o servidor aceitar 50 MB. | Limite de corpo das funções da Vercel; S3 não está configurado. | Configurar S3 e usar o upload pré-assinado (PUT direto no bucket). |
