import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import { generatePrescriptionPdf, type PrescriptionData } from "./prescription-pdf";

const base: PrescriptionData = {
  prescriptionId: "cmtesteqrcode000000000001",
  type:           "COMUM",
  issuedAt:       new Date("2026-10-15T15:00:00.000Z"),
  doctorName:     "Fernanda Costa",
  doctorCrm:      "123456",
  doctorCrmState: "SP",
  patientName:    "Paciente Teste",
  items: [{ name: "Metformina 500mg", dosage: "1 comprimido", frequency: "2x ao dia" }],
};

/** Quantas imagens a primeira página desenha (o QR é a única imagem do PDF). */
async function imagensNaPagina(buf: Buffer): Promise<number> {
  const doc = await PDFDocument.load(buf);
  const page = doc.getPage(0);
  const resources = page.node.Resources();
  const xobj = resources?.lookup(PDFName.of("XObject"), PDFDict);
  return xobj ? xobj.keys().length : 0;
}

describe("generatePrescriptionPdf", () => {
  it("com endereço de validação, desenha o QR code", async () => {
    const buf = await generatePrescriptionPdf({ ...base, validationUrl: "https://tcc-emacrescere.vercel.app/prescricao/cmteste" });
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(await imagensNaPagina(buf)).toBe(1);
  });

  it("sem endereço de validação, não desenha imagem", async () => {
    const buf = await generatePrescriptionPdf(base);
    expect(await imagensNaPagina(buf)).toBe(0);
  });

  it("o PDF com QR continua sendo assinado (certificado de teste autoassinado)", async () => {
    const forge = (await import("node-forge")).default;
    const keys = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = "01";
    cert.validity.notBefore = new Date(Date.now() - 60_000);
    cert.validity.notAfter  = new Date(Date.now() + 86_400_000);
    const attrs = [{ name: "commonName", value: "Teste QR" }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey, forge.md.sha256.create());
    const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], "senha-teste", { algorithm: "3des" });
    const pfx = Buffer.from(forge.asn1.toDer(p12).getBytes(), "binary");

    const { signPdf } = await import("./sign-pdf");
    const pdf = await generatePrescriptionPdf({ ...base, validationUrl: "https://x.test/prescricao/1" });
    const signed = await signPdf(pdf, pfx, "senha-teste");
    expect(signed.length).toBeGreaterThan(pdf.length);
    expect(signed.toString("latin1")).toContain("/ByteRange");
    expect(await imagensNaPagina(signed)).toBe(1);
  }, 30_000);

  it("receita de duas vias leva o QR nas duas páginas", async () => {
    const buf = await generatePrescriptionPdf({ ...base, type: "CONTROLE_ESPECIAL", validationUrl: "https://x.test/prescricao/1" });
    const doc = await PDFDocument.load(buf);
    expect(doc.getPageCount()).toBe(2);
  });
});
