/**
 * Destino de volta depois do login/cadastro (?callbackUrl=). Só aceita caminho
 * interno ("/..."): sem isso, "?callbackUrl=https://outro-site" levaria o
 * usuário recém-logado pra fora (open redirect). "//host" e "/\host" também
 * são externos para o navegador, então ficam de fora.
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
