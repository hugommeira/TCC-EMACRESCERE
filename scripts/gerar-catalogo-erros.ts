// Gera docs/catalogo-erros.md a partir de lib/error-catalog.ts.
// Uso: npx tsx scripts/gerar-catalogo-erros.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { gerarMarkdown } from "../lib/error-catalog-doc";

const destino = join(__dirname, "..", "docs", "catalogo-erros.md");
// CRLF: padrão dos arquivos do repositório.
writeFileSync(destino, gerarMarkdown().replace(/\n/g, "\r\n"), "utf8");
console.log(`Gerado: ${destino}`);
