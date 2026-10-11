import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { AUTH_JS_CODES, COMPONENTES_CRITICOS, ERROS, isErrorCode } from "@/lib/error-catalog";
import { gerarMarkdown } from "@/lib/error-catalog-doc";

// Integridade do catálogo de erros (lib/error-catalog.ts): cada código bem
// preenchido, todo código usado no projeto existe, o app Flutter espelha as
// mensagens certas e o documento gerado está em dia.

const ROOT = join(__dirname, "..", "..");

function arquivos(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome.startsWith(".")) continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...arquivos(p, exts));
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

describe("catálogo de erros", () => {
  const entradas = Object.entries(ERROS);

  it("tem cada erro completo", () => {
    for (const [code, def] of entradas) {
      expect(code, code).toMatch(/^[A-Z][A-Z0-9_]+$/);
      expect(def.acao.length, `${code}.acao`).toBeGreaterThan(3);
      expect(def.reacao.length, `${code}.reacao`).toBeGreaterThan(3);
      expect(def.causa.length, `${code}.causa`).toBeGreaterThan(3);
      // Só erros de log (status 0 em INFRA) podem não ter mensagem de tela.
      if (def.dominio !== "INFRA") expect(def.mensagem.length, `${code}.mensagem`).toBeGreaterThan(3);
    }
  });

  it("usa status HTTP coerente", () => {
    for (const [code, def] of entradas) {
      const ok = def.status === 0 || def.status === 200 || (def.status >= 400 && def.status <= 599);
      expect(ok, `${code}: ${def.status}`).toBe(true);
      // Erro de rede é só do cliente: nunca sai da API.
      if (def.dominio === "REDE") expect(def.status, code).toBe(0);
    }
  });

  it("não deixa texto técnico nas mensagens ao usuário", () => {
    for (const [code, def] of entradas) {
      expect(def.mensagem, code).not.toMatch(/Prisma|undefined|null|stack|Error:|HTTP \d/);
    }
  });

  it("mapeia códigos do Auth.js e peças críticas só para códigos existentes", () => {
    for (const code of Object.values(AUTH_JS_CODES)) expect(isErrorCode(code), code).toBe(true);
    for (const c of COMPONENTES_CRITICOS) for (const code of c.codigos) expect(isErrorCode(code), `${c.nome}: ${code}`).toBe(true);
  });

  it("todo código usado no projeto está catalogado", () => {
    const padroes = [
      /new AppError\(\s*"([A-Z_]+)"/g,
      /apiError\(\s*"([A-Z_]+)"/g,
      /logError\(\s*"([A-Z_]+)"/g,
      /\bERROS\.([A-Z_]+)\b/g,
      /codigoDoErro\([^)]*\)\s*===\s*"([A-Z_]+)"/g,
    ];
    const usados = new Map<string, string>();
    for (const dir of ["app", "components", "hooks", "lib", "services"]) {
      for (const f of arquivos(join(ROOT, dir), [".ts", ".tsx"])) {
        if (f.endsWith("error-catalog.ts")) continue;
        const src = readFileSync(f, "utf8");
        for (const re of padroes) for (const m of Array.from(src.matchAll(re))) usados.set(m[1]!, relative(ROOT, f));
      }
    }
    expect(usados.size).toBeGreaterThan(50);
    const faltando = Array.from(usados).filter(([code]) => !isErrorCode(code));
    expect(faltando, JSON.stringify(faltando)).toEqual([]);
  });

  it("o app Flutter usa as mesmas mensagens do catálogo", () => {
    const dart = readFileSync(join(ROOT, "mobile", "lib", "errors", "error_catalog.dart"), "utf8");
    const pares = Array.from(dart.matchAll(/'([A-Z_]+)':\s*'([^']+)'/g));
    expect(pares.length).toBeGreaterThan(5);
    for (const [, code, msg] of pares) {
      expect(isErrorCode(code), `código do app inexistente: ${code}`).toBe(true);
      expect(msg, code).toBe(ERROS[code as keyof typeof ERROS].mensagem);
    }
    // Códigos que o app lê do Auth.js também existem.
    for (const m of Array.from(dart.matchAll(/'[\w]+':\s*'(AUTH_[A-Z_]+)'/g))) expect(isErrorCode(m[1]), m[1]).toBe(true);
  });

  it("docs/catalogo-erros.md está atualizado (rode: npx tsx scripts/gerar-catalogo-erros.ts)", () => {
    const doc = readFileSync(join(ROOT, "docs", "catalogo-erros.md"), "utf8").replace(/\r\n/g, "\n");
    expect(doc).toBe(gerarMarkdown());
  });
});
