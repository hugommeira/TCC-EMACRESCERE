/// Mensagens dos códigos de erro que o app precisa conhecer sozinho.
///
/// A fonte única do catálogo é `lib/error-catalog.ts` no site (backend). Os
/// erros que vêm da API já trazem `message` pronta; aqui ficam só os que
/// nascem no próprio app (rede, timeout, resposta inválida) e os que o app
/// precisa reconhecer pelo código (sessão, login).
///
/// O teste `test/falhas/catalogo.test.ts` (no site) confere que cada código
/// abaixo existe no catálogo com a mesma mensagem — não edite um lado só.
const Map<String, String> kErrorMessages = {
  'REDE_SEM_CONEXAO': 'Sem conexão com a internet.',
  'REDE_TEMPO_ESGOTADO': 'O servidor demorou para responder.',
  'SERVIDOR_RESPOSTA_INVALIDA': 'O servidor respondeu de forma inesperada.',
  'ERRO_INTERNO': 'Algo deu errado do nosso lado. Tente novamente em instantes.',
  'AUTH_SESSAO_EXPIRADA': 'Sua sessão expirou. Entre de novo para continuar.',
  'AUTH_CREDENCIAIS_INVALIDAS': 'E-mail ou senha incorretos.',
  'AUTH_SENHA_INCORRETA': 'Senha incorreta.',
  'AUTH_EMAIL_SENHA_INCORRETOS': 'E-mail e senha incorretos.',
  'AUTH_LOGIN_BLOQUEADO': 'Muitas tentativas de login. Aguarde 15 minutos e tente de novo.',
  'AUTH_CONTA_DESATIVADA': 'Sua conta está desativada. Fale com a equipe Emacrescere.',
  'CHAT_ENCERRADO': 'O chat desta consulta fechou 24 h depois do atendimento.',
  'LIMITE_REQUISICOES': 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.',
};

/// Códigos do Auth.js (`?error=` / `?code=` no redirect do login) → catálogo.
const Map<String, String> kAuthJsCodes = {
  'CredentialsSignin': 'AUTH_CREDENCIAIS_INVALIDAS',
  'credentials': 'AUTH_CREDENCIAIS_INVALIDAS',
  'login_bloqueado': 'AUTH_LOGIN_BLOQUEADO',
  'senha_incorreta': 'AUTH_SENHA_INCORRETA',
  'email_senha_incorretos': 'AUTH_EMAIL_SENHA_INCORRETOS',
  'conta_desativada': 'AUTH_CONTA_DESATIVADA',
};

String messageForCode(String code, {String? fallback}) =>
    kErrorMessages[code] ?? fallback ?? kErrorMessages['ERRO_INTERNO']!;
