import { AUTH_JS_CODES, ERROS } from "@/lib/error-catalog";

// Mensagem de login a partir do ?error= / ?code= do Auth.js (ou do resultado
// de signIn). Usada pela tela de login e pela página /auth/error.

// Textos mais específicos que o genérico do catálogo, por provedor.
const DETALHE: Record<string, string> = {
  FacebookSemEmail: "O Facebook não compartilhou o seu e-mail, e ele é necessário para a conta. Tente de novo permitindo o e-mail, ou entre com e-mail e senha.",
  GoogleSemEmail:   "O Google não confirmou o e-mail desta conta, e ele é necessário. Use outra conta Google ou entre com e-mail e senha.",
};

export function mensagemLogin(error?: string | null, code?: string | null): string {
  // `code` é mais específico (login_bloqueado, conta_desativada) que `error`.
  if (code && AUTH_JS_CODES[code]) return ERROS[AUTH_JS_CODES[code]].mensagem;
  if (error && DETALHE[error]) return DETALHE[error];
  if (error && AUTH_JS_CODES[error]) return ERROS[AUTH_JS_CODES[error]].mensagem;
  return "Não foi possível entrar. Tente de novo.";
}
