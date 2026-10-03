// Perfil do Facebook → campos da tabela `users`.
//
// O provedor padrão do Auth.js devolve `image`, mas a tabela chama a foto de
// `avatarUrl` e não tem coluna `image`: o adapter tentava gravar um campo que
// não existe e o PRIMEIRO login de quem ainda não tinha conta falhava.

export interface FacebookUserinfo {
  id:       string;
  name?:    string | null;
  email?:   string | null;
  picture?: { data?: { url?: string | null } | null } | null;
}

export interface FacebookUser {
  id:        string;
  role:      "PATIENT";
  name:      string;
  email:     string | null;
  avatarUrl: string | null;
}

export function facebookProfileToUser(p: FacebookUserinfo): FacebookUser {
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
