import "server-only";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

export interface PrescriptionData {
  // Receita
  prescriptionId:  string;
  type:            "COMUM" | "COMUM_DUAS_VIAS" | "CONTROLE_ESPECIAL" | "AZUL_B1" | "AZUL_B2" | "AMARELA_A1" | "AMARELA_A2" | "AMARELA_A3";
  issuedAt:        Date;

  // Médico
  doctorName:      string;
  doctorCrm:       string;
  doctorCrmState:  string;
  doctorSpecialty?: string;

  // Paciente
  patientName:     string;
  patientCpf?:     string;
  patientBirthDate?: Date;

  // Endereço (obrigatório para receitas controladas)
  patientAddress?: string;

  // Itens
  items: Array<{
    name:           string;     // princípio ativo + apresentação
    commercialName?: string;
    presentation?:  string;
    dosage:         string;
    route?:         string;
    frequency:      string;
    duration?:      string;
    quantity?:      string;
    instructions?:  string;
    continuous?:    boolean;
  }>;

  notes?: string;

  // Validação pública
  validationUrl?: string; // URL para validar a receita
}

const TYPE_LABELS: Record<PrescriptionData["type"], string> = {
  COMUM:             "Receita Médica",
  COMUM_DUAS_VIAS:   "Receita de Antimicrobiano (2 vias) — RDC 471/2021",
  CONTROLE_ESPECIAL: "Receita de Controle Especial (2 vias) — Portaria 344/98",
  AZUL_B1:           "Notificação de Receita Azul — B1 (Psicotrópico)",
  AZUL_B2:           "Notificação de Receita Azul — B2 (Anorexígeno)",
  AMARELA_A1:        "Notificação de Receita Amarela — A1 (Entorpecente)",
  AMARELA_A2:        "Notificação de Receita Amarela — A2 (Entorpecente)",
  AMARELA_A3:        "Notificação de Receita Amarela — A3 (Psicotrópico)",
};

const TYPE_COLORS: Record<PrescriptionData["type"], [number, number, number]> = {
  COMUM:             [0.06, 0.59, 0.51],  // brand-600 (verde)
  COMUM_DUAS_VIAS:   [0.06, 0.59, 0.51],
  CONTROLE_ESPECIAL: [0.06, 0.59, 0.51],
  AZUL_B1:           [0.15, 0.39, 0.92],  // azul
  AZUL_B2:           [0.15, 0.39, 0.92],
  AMARELA_A1:        [0.85, 0.65, 0.13],  // amarela/ouro
  AMARELA_A2:        [0.85, 0.65, 0.13],
  AMARELA_A3:        [0.85, 0.65, 0.13],
};

const PT_BR_DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Helper: quebra texto em linhas que cabem na largura */
function wrap(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) { out.push(""); continue; }
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      if ((line + " " + w).trim().length > maxChars) {
        if (line) out.push(line);
        line = w;
      } else {
        line = line ? `${line} ${w}` : w;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/**
 * Gera o PDF do receituário (sem assinatura — a assinatura é aplicada depois).
 */
export async function generatePrescriptionPdf(data: PrescriptionData): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receita ${data.prescriptionId}`);
  pdf.setAuthor(`Dr(a). ${data.doctorName} — CRM ${data.doctorCrm}/${data.doctorCrmState}`);
  pdf.setSubject(TYPE_LABELS[data.type]);
  pdf.setCreator("Emaerescere — Plataforma de Telessaúde");
  pdf.setProducer("Emaerescere");
  pdf.setCreationDate(new Date());

  const font     = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontIt   = await pdf.embedFont(StandardFonts.HelveticaOblique);

  // Quantas vias? (controle especial e B1/B2/Amarela exigem 2 vias)
  const numVias =
    data.type === "COMUM" ? 1 : 2;

  for (let via = 1; via <= numVias; via++) {
    drawPage(pdf, data, { font, fontBold, fontIt }, via, numVias);
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

function drawPage(
  pdf:  PDFDocument,
  data: PrescriptionData,
  fonts: { font: PDFFont; fontBold: PDFFont; fontIt: PDFFont },
  viaNum: number,
  totalVias: number,
) {
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  const color = TYPE_COLORS[data.type];
  const colorRgb = rgb(color[0]!, color[1]!, color[2]!);
  const slate900 = rgb(0.06, 0.09, 0.16);
  const slate600 = rgb(0.29, 0.34, 0.42);
  const slate200 = rgb(0.89, 0.91, 0.94);

  let y = height - margin;

  // Cabeçalho com cor do tipo
  page.drawRectangle({ x: 0, y: y - 6, width, height: 6, color: colorRgb });
  y -= 26;

  // Título
  page.drawText("EMAERESCERE", {
    x: margin, y, size: 10, font: fonts.fontBold, color: colorRgb,
  });
  page.drawText("Plataforma de Telessaúde", {
    x: margin, y: y - 12, size: 8, font: fonts.font, color: slate600,
  });

  // Tipo + via (canto direito)
  const typeLabel = TYPE_LABELS[data.type];
  const labelW = fonts.fontBold.widthOfTextAtSize(typeLabel, 9);
  page.drawText(typeLabel, {
    x: width - margin - labelW, y, size: 9, font: fonts.fontBold, color: colorRgb,
  });
  if (totalVias > 1) {
    const viaLabel = `${viaNum}ª via de ${totalVias}`;
    const viaW = fonts.font.widthOfTextAtSize(viaLabel, 8);
    page.drawText(viaLabel, {
      x: width - margin - viaW, y: y - 12, size: 8, font: fonts.font, color: slate600,
    });
  }

  y -= 30;

  // Linha separadora
  page.drawLine({
    start: { x: margin, y }, end: { x: width - margin, y },
    color: slate200, thickness: 1,
  });
  y -= 20;

  // ─── MÉDICO ────────────────────────────────────────────────────────────────
  page.drawText("MÉDICO ASSISTENTE", { x: margin, y, size: 7, font: fonts.fontBold, color: slate600 });
  y -= 12;
  page.drawText(`Dr(a). ${data.doctorName}`, { x: margin, y, size: 11, font: fonts.fontBold, color: slate900 });
  y -= 13;
  page.drawText(
    `CRM ${data.doctorCrm}/${data.doctorCrmState}${data.doctorSpecialty ? "  ·  " + data.doctorSpecialty : ""}`,
    { x: margin, y, size: 9, font: fonts.font, color: slate600 },
  );
  y -= 20;

  // ─── PACIENTE ──────────────────────────────────────────────────────────────
  page.drawText("PACIENTE", { x: margin, y, size: 7, font: fonts.fontBold, color: slate600 });
  y -= 12;
  page.drawText(data.patientName, { x: margin, y, size: 11, font: fonts.fontBold, color: slate900 });
  y -= 13;
  const patientLine: string[] = [];
  if (data.patientCpf)       patientLine.push(`CPF ${formatCpf(data.patientCpf)}`);
  if (data.patientBirthDate) patientLine.push(`Nasc. ${PT_BR_DATE.format(data.patientBirthDate)}`);
  if (patientLine.length) {
    page.drawText(patientLine.join("  ·  "), { x: margin, y, size: 9, font: fonts.font, color: slate600 });
    y -= 13;
  }
  if (data.patientAddress) {
    page.drawText(`Endereço: ${data.patientAddress}`, {
      x: margin, y, size: 9, font: fonts.font, color: slate600, maxWidth: width - 2 * margin,
    });
    y -= 13;
  }
  y -= 8;

  // Linha separadora
  page.drawLine({
    start: { x: margin, y }, end: { x: width - margin, y },
    color: slate200, thickness: 1,
  });
  y -= 18;

  // ─── PRESCRIÇÃO ────────────────────────────────────────────────────────────
  page.drawText("PRESCRIÇÃO", { x: margin, y, size: 7, font: fonts.fontBold, color: slate600 });
  y -= 16;

  data.items.forEach((item, idx) => {
    if (y < 200) {
      // Footer numbering ficaria complicado em A4 multipágina; mantemos simples e
      // os itens cabem em 1 página na maioria dos casos.
    }

    // Número + nome
    page.drawText(`${idx + 1}.`, {
      x: margin, y, size: 11, font: fonts.fontBold, color: colorRgb,
    });
    page.drawText(item.name, {
      x: margin + 18, y, size: 11, font: fonts.fontBold, color: slate900,
      maxWidth: width - 2 * margin - 18,
    });
    y -= 14;

    if (item.commercialName || item.presentation) {
      const sub = [item.commercialName, item.presentation].filter(Boolean).join(" — ");
      page.drawText(sub, {
        x: margin + 18, y, size: 9, font: fonts.fontIt, color: slate600,
      });
      y -= 12;
    }

    // Posologia em formato "Tomar X, via Y, A cada Z, por W"
    const posPieces: string[] = [];
    if (item.dosage)    posPieces.push(item.dosage);
    if (item.route)     posPieces.push(item.route);
    if (item.frequency) posPieces.push(item.frequency);
    if (item.duration)  posPieces.push(item.duration);
    if (item.continuous) posPieces.push("Uso contínuo");

    const posText = posPieces.join(" · ");
    if (posText) {
      page.drawText(posText, { x: margin + 18, y, size: 10, font: fonts.font, color: slate900 });
      y -= 13;
    }

    if (item.quantity) {
      page.drawText(`Quantidade: ${item.quantity}`, {
        x: margin + 18, y, size: 9, font: fonts.font, color: slate600,
      });
      y -= 12;
    }

    if (item.instructions) {
      const lines = wrap(item.instructions, 78);
      for (const line of lines) {
        if (y < 130) break;
        page.drawText(line, {
          x: margin + 18, y, size: 9, font: fonts.fontIt, color: slate600,
        });
        y -= 12;
      }
    }

    y -= 8;
  });

  // ─── NOTAS ─────────────────────────────────────────────────────────────────
  if (data.notes) {
    y -= 4;
    page.drawText("ORIENTAÇÕES GERAIS", { x: margin, y, size: 7, font: fonts.fontBold, color: slate600 });
    y -= 13;
    for (const line of wrap(data.notes, 90)) {
      if (y < 130) break;
      page.drawText(line, { x: margin, y, size: 9, font: fonts.font, color: slate900 });
      y -= 12;
    }
  }

  // ─── RODAPÉ ────────────────────────────────────────────────────────────────
  const footerY = 80;

  page.drawLine({
    start: { x: margin, y: footerY + 50 }, end: { x: width - margin, y: footerY + 50 },
    color: slate200, thickness: 1,
  });

  // Data e local
  page.drawText(
    `Emitido em ${PT_BR_DATE.format(data.issuedAt)} via Emaerescere — Telessaúde`,
    { x: margin, y: footerY + 36, size: 8, font: fonts.font, color: slate600 },
  );

  // Assinatura digital ICP-Brasil
  page.drawText("Assinatura digital ICP-Brasil:", {
    x: margin, y: footerY + 20, size: 8, font: fonts.fontBold, color: slate900,
  });
  page.drawText(`Dr(a). ${data.doctorName} — CRM ${data.doctorCrm}/${data.doctorCrmState}`, {
    x: margin, y: footerY + 8, size: 8, font: fonts.font, color: slate900,
  });

  // Validação pública
  if (data.validationUrl) {
    const url = `Validar receita: ${data.validationUrl}`;
    page.drawText(url, {
      x: margin, y: footerY - 6, size: 7, font: fonts.font, color: slate600,
    });
  }

  // ID da receita (canto direito do rodapé)
  const idLabel = `#${data.prescriptionId.slice(-12).toUpperCase()}`;
  const idW = fonts.font.widthOfTextAtSize(idLabel, 8);
  page.drawText(idLabel, {
    x: width - margin - idW, y: footerY + 36, size: 8, font: fonts.font, color: slate600,
  });
}

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
