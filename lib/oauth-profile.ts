// Perfil do Facebook / Google → campos da tabela `users`.
//
// Os provedores padrão do Auth.js devolvem `image`, mas a tabela chama a foto
// de `avatarUrl` e não tem coluna `image`: o adapter tentava gravar um campo
// que não existe e o PRIMEIRO login de quem ainda não tinha conta falhava.
// Regras comuns: papel sempre PATIENT, e-mail obrigatório (sem ele o login é
// recusado no callback signIn).

export interface FacebookUserinfo {
  id:       string;
  name?:    string | null;
  email?:   string | null;
  picture?: { data?: { url?: string | null } | null } | null;
}

export interface OAuthUser {
  id:        string;
  role:      "PATIENT";
  name:      string;
  email:     string | null;
  avatarUrl: string | null;
}

export function facebookProfileToUser(p: FacebookUserinfo): OAuthUser {
  return {
    id:        p.id,
    // Fixo: quem entra pelo Facebook é sempre paciente. O papel nunca vem
    // de fora (médico se cadastra pelo formulário, com CRM e aprovação).
    role:      "PATIENT",
    // `name` é obrigatório na tabela; o Facebook quase sempre manda.
    name:      p.name?.trim() || "Paciente",
    // Sem e-mail (a pessoa recusou a permissão, ou a conta é só por telefone)
    // o login é recusado no callback signIn, com mensagem na tela de login.
    email:     p.email?.trim().toLowerCase() || null,
    avatarUrl: p.picture?.data?.url ?? null,
  };
}

export interface GoogleUserinfo {
  sub:             string;
  name?:           string | null;
  email?:          string | null;
  email_verified?: boolean | null;
  picture?:        string | null;
}

export function googleProfileToUser(p: GoogleUserinfo): OAuthUser {
  return {
    id:        p.sub,
    role:      "PATIENT",
    name:      p.name?.trim() || "Paciente",
    // Só e-mail verificado pelo Google: a conta é vinculada pelo e-mail
    // (allowDangerousEmailAccountLinking), então um e-mail não verificado
    // permitiria entrar na conta de outra pessoa com o mesmo endereço.
    email:     p.email_verified ? (p.email?.trim().toLowerCase() || null) : null,
    avatarUrl: p.picture ?? null,
  };
}
