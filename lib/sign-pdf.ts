import "server-only";
import * as forge from "node-forge";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { PDFDocument } from "pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";

export interface PfxInfo {
  subjectCN:    string | null;
  issuerCN:     string | null;
  serialNumber: string | null;
  validFrom:    Date | null;
  validTo:      Date | null;
}

/**
 * Tenta carregar o .pfx e validar a senha. Lança erro se a senha estiver
 * errada ou se o arquivo não for um PKCS#12 válido.
 * Os metadados são extraídos best-effort — se forge não conseguir parsear
 * o certificado (alguns ICP-Brasil usam AES-256 que pode não ser suportado),
 * retorna campos nulos mas NÃO falha o upload.
 */
export function extractPfxInfo(pfxBuffer: Buffer, password: string): PfxInfo {
  // 1) Decodifica o DER. Buffer -> binary string (forma canônica do forge)
  const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));

  // 2) Tenta abrir o PKCS#12 com a senha (valida senha aqui)
  //    Assinatura: pkcs12FromAsn1(obj, strict, password)
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
  } catch (err) {
    // Mensagem padronizada — pode ser senha errada ou algoritmo não suportado
    const msg = err instanceof Error ? err.message : String(err);
    if (/invalid password|MAC|integrity/i.test(msg)) {
      throw new Error("Senha do certificado inválida");
    }
    // Outros erros do forge (algoritmo não suportado etc) — repassa
    throw new Error(`Não foi possível abrir o .pfx: ${msg}`);
  }

  // 3) Procura o certificado X.509 dentro do PKCS#12
  let cert: forge.pki.Certificate | null = null;
  try {
    for (const safeContent of p12.safeContents) {
      for (const safeBag of safeContent.safeBags) {
        if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) {
          cert = safeBag.cert;
          break;
        }
      }
      if (cert) break;
    }
  } catch {
    cert = null;
  }

  if (!cert) {
    // PFX abriu mas não conseguimos ler o cert — segue com nulls
    return {
      subjectCN: null, issuerCN: null, serialNumber: null,
      validFrom: null, validTo: null,
    };
  }

  const cnOf = (attrs: forge.pki.CertificateField[]): string | null => {
    try {
      const cn = attrs.find((a) => a.name === "commonName");
      return cn && typeof cn.value === "string" ? cn.value : null;
    } catch {
      return null;
    }
  };

  return {
    subjectCN:    cnOf(cert.subject.attributes),
    issuerCN:     cnOf(cert.issuer.attributes),
    serialNumber: cert.serialNumber ?? null,
    validFrom:    cert.validity.notBefore ?? null,
    validTo:      cert.validity.notAfter  ?? null,
  };
}

/**
 * Verifica APENAS se a senha abre o .pfx. Sem extrair metadados.
 * Mais leniente — só checa se PKCS12 foi aberto com sucesso.
 */
export function validatePfxPassword(pfxBuffer: Buffer, password: string): void {
  const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
  try {
    forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/invalid password|MAC|integrity/i.test(msg)) {
      throw new Error("Senha do certificado inválida");
    }
    throw new Error(`Não foi possível abrir o .pfx: ${msg}`);
  }
}

/**
 * Assina um PDF (Buffer) com certificado A1 (.pfx) + senha.
 * Retorna o PDF assinado (Buffer).
 */
export async function signPdf(
  pdfBuffer: Buffer,
  pfxBuffer: Buffer,
  password:  string,
  options?: { reason?: string; location?: string; name?: string; contactInfo?: string },
): Promise<Buffer> {
  // Sanity check no .pfx ANTES de prosseguir
  if (!Buffer.isBuffer(pfxBuffer) || pfxBuffer.length < 100) {
    throw new Error("Arquivo .pfx corrompido ou vazio");
  }
  if (!password) {
    throw new Error("Senha do certificado vazia");
  }

  // Pre-valida a senha (falha cedo, com mensagem clara)
  try {
    validatePfxPassword(pfxBuffer, password);
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }

  let withPlaceholder: Buffer;
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pdflibAddPlaceholder({
      pdfDoc,
      reason:      options?.reason      ?? "Prescrição médica",
      contactInfo: options?.contactInfo ?? "",
      name:        options?.name        ?? "Médico",
      location:    options?.location    ?? "BR",
      // Certificados ICP-Brasil com cadeia completa geram assinaturas ~15KB.
      // Default do @signpdf é 8192 — aumentamos pra 32KB pra cobrir qualquer caso.
      signatureLength: 32768,
    });
    const bytes = await pdfDoc.save({ useObjectStreams: false });
    withPlaceholder = Buffer.from(bytes);
  } catch (err) {
    console.error("[signPdf] placeholder phase failed:", err);
    throw new Error(`Erro ao preparar PDF: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const signer = new P12Signer(pfxBuffer, { passphrase: password });
    const signed = await new SignPdf().sign(withPlaceholder, signer);
    return signed;
  } catch (err) {
    console.error("[signPdf] sign phase failed:", err);
    if (err instanceof Error && err.stack) console.error(err.stack);
    throw err instanceof Error ? err : new Error(String(err));
  }
}
