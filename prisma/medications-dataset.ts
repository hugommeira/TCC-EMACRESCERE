/**
 * Base de medicamentos curada para o Emaerescere.
 *
 * Cobre os principais grupos terapêuticos usados na rotina médica brasileira,
 * com classificação ANVISA correta (Portaria 344/98 e RDC 471/2021).
 *
 * Classes:
 *  - COMUM:             receita branca comum
 *  - ANTIMICROBIANO:    receita branca 2 vias (RDC 471/2021)
 *  - CONTROLE_ESPECIAL: receita Controle Especial (branca, 2 vias) - lista C1
 *  - B1:                psicotrópicos (azul)
 *  - B2:                anorexígenos (azul especial)
 *  - A1/A2/A3:          entorpecentes (amarela)
 *  - GLP1:              análogos GLP-1/GIP (comum, com nota especial)
 */

import type { MedicationClass } from "@prisma/client";

export interface SeedMed {
  activeName:        string;
  commercialName?:   string;
  presentation:      string;
  laboratory?:       string;
  class:             MedicationClass;
  controlled?:       boolean;
  defaultDosage?:    string;
  defaultFrequency?: string;
  defaultRoute?:     string;
}

export const MEDICATIONS: SeedMed[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // GLP-1 / GIP — análogos (foco da plataforma)
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Tirzepatida", commercialName: "Mounjaro", presentation: "Caneta SC 2,5 mg/0,5 mL", laboratory: "Eli Lilly", class: "GLP1", defaultDosage: "1 aplicação", defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Tirzepatida", commercialName: "Mounjaro", presentation: "Caneta SC 5 mg/0,5 mL",   laboratory: "Eli Lilly", class: "GLP1", defaultDosage: "1 aplicação", defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Tirzepatida", commercialName: "Mounjaro", presentation: "Caneta SC 7,5 mg/0,5 mL", laboratory: "Eli Lilly", class: "GLP1", defaultDosage: "1 aplicação", defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Tirzepatida", commercialName: "Mounjaro", presentation: "Caneta SC 10 mg/0,5 mL",  laboratory: "Eli Lilly", class: "GLP1", defaultDosage: "1 aplicação", defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Tirzepatida", commercialName: "Mounjaro", presentation: "Caneta SC 12,5 mg/0,5 mL", laboratory: "Eli Lilly", class: "GLP1", defaultDosage: "1 aplicação", defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Tirzepatida", commercialName: "Mounjaro", presentation: "Caneta SC 15 mg/0,5 mL",  laboratory: "Eli Lilly", class: "GLP1", defaultDosage: "1 aplicação", defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },

  { activeName: "Semaglutida", commercialName: "Ozempic",  presentation: "Caneta SC 0,25/0,5 mg",       laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "0,25 mg",  defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Semaglutida", commercialName: "Ozempic",  presentation: "Caneta SC 1 mg",              laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "1 mg",     defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Semaglutida", commercialName: "Ozempic",  presentation: "Caneta SC 2 mg",              laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "2 mg",     defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Semaglutida", commercialName: "Wegovy",   presentation: "Caneta SC 0,25/0,5/1/1,7/2,4 mg", laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "0,25 mg", defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Semaglutida", commercialName: "Rybelsus", presentation: "Comprimido oral 3 mg",        laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia em jejum", defaultRoute: "Oral" },
  { activeName: "Semaglutida", commercialName: "Rybelsus", presentation: "Comprimido oral 7 mg",        laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia em jejum", defaultRoute: "Oral" },
  { activeName: "Semaglutida", commercialName: "Rybelsus", presentation: "Comprimido oral 14 mg",       laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia em jejum", defaultRoute: "Oral" },

  { activeName: "Liraglutida", commercialName: "Saxenda",  presentation: "Caneta SC 6 mg/mL (3 mL)",    laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "0,6 mg (titulação)", defaultFrequency: "1x ao dia", defaultRoute: "Subcutâneo" },
  { activeName: "Liraglutida", commercialName: "Victoza",  presentation: "Caneta SC 6 mg/mL (3 mL)",    laboratory: "Novo Nordisk", class: "GLP1", defaultDosage: "0,6 mg (titulação)", defaultFrequency: "1x ao dia", defaultRoute: "Subcutâneo" },
  { activeName: "Dulaglutida", commercialName: "Trulicity", presentation: "Caneta SC 0,75 mg/0,5 mL",    laboratory: "Eli Lilly",    class: "GLP1", defaultDosage: "0,75 mg", defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },
  { activeName: "Dulaglutida", commercialName: "Trulicity", presentation: "Caneta SC 1,5 mg/0,5 mL",     laboratory: "Eli Lilly",    class: "GLP1", defaultDosage: "1,5 mg",  defaultFrequency: "1x por semana", defaultRoute: "Subcutâneo" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Tratamento da obesidade (não GLP-1)
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Orlistate", commercialName: "Xenical",  presentation: "Cápsula 120 mg", laboratory: "Roche", class: "COMUM", defaultDosage: "1 cápsula", defaultFrequency: "3x ao dia nas refeições", defaultRoute: "Oral" },
  { activeName: "Bupropiona + Naltrexona", commercialName: "Contrave", presentation: "Comprimido 90 mg + 8 mg", class: "COMUM", defaultDosage: "Titular conforme bula", defaultFrequency: "2x ao dia", defaultRoute: "Oral" },
  { activeName: "Sibutramina", commercialName: "Reductil", presentation: "Cápsula 10 mg", class: "B2", controlled: true, defaultDosage: "1 cápsula", defaultFrequency: "1x ao dia pela manhã", defaultRoute: "Oral" },
  { activeName: "Sibutramina", commercialName: "Reductil", presentation: "Cápsula 15 mg", class: "B2", controlled: true, defaultDosage: "1 cápsula", defaultFrequency: "1x ao dia pela manhã", defaultRoute: "Oral" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Diabetes — antidiabéticos orais
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Metformina",  commercialName: "Glifage",   presentation: "Comprimido 500 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "2-3x ao dia", defaultRoute: "Oral" },
  { activeName: "Metformina",  commercialName: "Glifage",   presentation: "Comprimido 850 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "2-3x ao dia", defaultRoute: "Oral" },
  { activeName: "Metformina",  commercialName: "Glifage XR", presentation: "Comprimido LP 500 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Metformina",  commercialName: "Glifage XR", presentation: "Comprimido LP 1000 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Glibenclamida", presentation: "Comprimido 5 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1-2x ao dia", defaultRoute: "Oral" },
  { activeName: "Gliclazida",  commercialName: "Diamicron MR", presentation: "Comprimido LP 30 mg",  class: "COMUM", defaultDosage: "1-2 comprimidos", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Gliclazida",  commercialName: "Diamicron MR", presentation: "Comprimido LP 60 mg",  class: "COMUM", defaultDosage: "1-2 comprimidos", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Empagliflozina", commercialName: "Jardiance", presentation: "Comprimido 10 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Empagliflozina", commercialName: "Jardiance", presentation: "Comprimido 25 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Dapagliflozina", commercialName: "Forxiga",   presentation: "Comprimido 10 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Linagliptina",   commercialName: "Trayenta",  presentation: "Comprimido 5 mg",  class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Sitagliptina",   commercialName: "Januvia",   presentation: "Comprimido 50 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Sitagliptina",   commercialName: "Januvia",   presentation: "Comprimido 100 mg",class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Pioglitazona",   commercialName: "Actos",     presentation: "Comprimido 15 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Pioglitazona",   commercialName: "Actos",     presentation: "Comprimido 30 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },

  // Insulinas
  { activeName: "Insulina NPH",   commercialName: "Humulin N",    presentation: "Frasco 100 UI/mL (10 mL)", class: "COMUM", defaultRoute: "Subcutâneo" },
  { activeName: "Insulina Regular", commercialName: "Humulin R",  presentation: "Frasco 100 UI/mL (10 mL)", class: "COMUM", defaultRoute: "Subcutâneo" },
  { activeName: "Insulina Glargina", commercialName: "Lantus",    presentation: "Caneta SC 100 UI/mL",      class: "COMUM", defaultRoute: "Subcutâneo" },
  { activeName: "Insulina Glargina U300", commercialName: "Toujeo", presentation: "Caneta SC 300 UI/mL",    class: "COMUM", defaultRoute: "Subcutâneo" },
  { activeName: "Insulina Detemir", commercialName: "Levemir",    presentation: "Caneta SC 100 UI/mL",      class: "COMUM", defaultRoute: "Subcutâneo" },
  { activeName: "Insulina Lispro", commercialName: "Humalog",     presentation: "Caneta SC 100 UI/mL",      class: "COMUM", defaultRoute: "Subcutâneo" },
  { activeName: "Insulina Asparte", commercialName: "Novorapid",  presentation: "Caneta SC 100 UI/mL",      class: "COMUM", defaultRoute: "Subcutâneo" },
  { activeName: "Insulina Glulisina", commercialName: "Apidra",   presentation: "Caneta SC 100 UI/mL",      class: "COMUM", defaultRoute: "Subcutâneo" },
  { activeName: "Insulina Degludec", commercialName: "Tresiba",   presentation: "Caneta SC 100 UI/mL",      class: "COMUM", defaultRoute: "Subcutâneo" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Anti-hipertensivos
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Losartana",        commercialName: "Aradois", presentation: "Comprimido 25 mg",  class: "COMUM" },
  { activeName: "Losartana",        commercialName: "Aradois", presentation: "Comprimido 50 mg",  class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1-2x ao dia", defaultRoute: "Oral" },
  { activeName: "Losartana",        commercialName: "Aradois", presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Valsartana",       presentation: "Comprimido 80 mg",  class: "COMUM" },
  { activeName: "Valsartana",       presentation: "Comprimido 160 mg", class: "COMUM" },
  { activeName: "Olmesartana",      commercialName: "Benicar", presentation: "Comprimido 20 mg", class: "COMUM" },
  { activeName: "Olmesartana",      commercialName: "Benicar", presentation: "Comprimido 40 mg", class: "COMUM" },
  { activeName: "Enalapril",        presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Enalapril",        presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Enalapril",        presentation: "Comprimido 20 mg",  class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1-2x ao dia", defaultRoute: "Oral" },
  { activeName: "Captopril",        presentation: "Comprimido 25 mg",  class: "COMUM" },
  { activeName: "Captopril",        presentation: "Comprimido 50 mg",  class: "COMUM" },
  { activeName: "Atenolol",         presentation: "Comprimido 25 mg",  class: "COMUM" },
  { activeName: "Atenolol",         presentation: "Comprimido 50 mg",  class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Atenolol",         presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Metoprolol",       commercialName: "Selozok", presentation: "Comprimido 25 mg",  class: "COMUM" },
  { activeName: "Metoprolol",       commercialName: "Selozok", presentation: "Comprimido 50 mg",  class: "COMUM" },
  { activeName: "Metoprolol",       commercialName: "Selozok", presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Carvedilol",       presentation: "Comprimido 6,25 mg", class: "COMUM" },
  { activeName: "Carvedilol",       presentation: "Comprimido 12,5 mg", class: "COMUM" },
  { activeName: "Carvedilol",       presentation: "Comprimido 25 mg",   class: "COMUM" },
  { activeName: "Anlodipino",       commercialName: "Norvasc", presentation: "Comprimido 2,5 mg", class: "COMUM" },
  { activeName: "Anlodipino",       commercialName: "Norvasc", presentation: "Comprimido 5 mg",   class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Anlodipino",       commercialName: "Norvasc", presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Hidroclorotiazida", presentation: "Comprimido 25 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia pela manhã", defaultRoute: "Oral" },
  { activeName: "Hidroclorotiazida", presentation: "Comprimido 50 mg", class: "COMUM" },
  { activeName: "Indapamida",       presentation: "Comprimido 1,5 mg", class: "COMUM" },
  { activeName: "Espironolactona",  commercialName: "Aldactone", presentation: "Comprimido 25 mg",  class: "COMUM" },
  { activeName: "Espironolactona",  commercialName: "Aldactone", presentation: "Comprimido 50 mg",  class: "COMUM" },
  { activeName: "Espironolactona",  commercialName: "Aldactone", presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Furosemida",       commercialName: "Lasix", presentation: "Comprimido 40 mg", class: "COMUM" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Estatinas / dislipidemia
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Sinvastatina",   presentation: "Comprimido 10 mg", class: "COMUM" },
  { activeName: "Sinvastatina",   presentation: "Comprimido 20 mg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia à noite", defaultRoute: "Oral" },
  { activeName: "Sinvastatina",   presentation: "Comprimido 40 mg", class: "COMUM" },
  { activeName: "Atorvastatina",  commercialName: "Lipitor", presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Atorvastatina",  commercialName: "Lipitor", presentation: "Comprimido 20 mg",  class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia", defaultRoute: "Oral" },
  { activeName: "Atorvastatina",  commercialName: "Lipitor", presentation: "Comprimido 40 mg",  class: "COMUM" },
  { activeName: "Atorvastatina",  commercialName: "Lipitor", presentation: "Comprimido 80 mg",  class: "COMUM" },
  { activeName: "Rosuvastatina",  commercialName: "Crestor", presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Rosuvastatina",  commercialName: "Crestor", presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Rosuvastatina",  commercialName: "Crestor", presentation: "Comprimido 20 mg",  class: "COMUM" },
  { activeName: "Rosuvastatina",  commercialName: "Crestor", presentation: "Comprimido 40 mg",  class: "COMUM" },
  { activeName: "Pravastatina",   presentation: "Comprimido 20 mg", class: "COMUM" },
  { activeName: "Pravastatina",   presentation: "Comprimido 40 mg", class: "COMUM" },
  { activeName: "Ezetimiba",      commercialName: "Zetia", presentation: "Comprimido 10 mg", class: "COMUM" },
  { activeName: "Ciprofibrato",   presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Fenofibrato",    presentation: "Cápsula 250 mg", class: "COMUM" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Tireoide
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Levotiroxina",   commercialName: "Puran T4", presentation: "Comprimido 25 mcg", class: "COMUM" },
  { activeName: "Levotiroxina",   commercialName: "Puran T4", presentation: "Comprimido 50 mcg", class: "COMUM" },
  { activeName: "Levotiroxina",   commercialName: "Puran T4", presentation: "Comprimido 75 mcg", class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia em jejum", defaultRoute: "Oral" },
  { activeName: "Levotiroxina",   commercialName: "Puran T4", presentation: "Comprimido 88 mcg", class: "COMUM" },
  { activeName: "Levotiroxina",   commercialName: "Puran T4", presentation: "Comprimido 100 mcg", class: "COMUM" },
  { activeName: "Levotiroxina",   commercialName: "Puran T4", presentation: "Comprimido 112 mcg", class: "COMUM" },
  { activeName: "Levotiroxina",   commercialName: "Puran T4", presentation: "Comprimido 125 mcg", class: "COMUM" },
  { activeName: "Levotiroxina",   commercialName: "Puran T4", presentation: "Comprimido 150 mcg", class: "COMUM" },
  { activeName: "Metimazol",      commercialName: "Tapazol", presentation: "Comprimido 5 mg",  class: "COMUM" },
  { activeName: "Metimazol",      commercialName: "Tapazol", presentation: "Comprimido 10 mg", class: "COMUM" },
  { activeName: "Propiltiouracila", presentation: "Comprimido 100 mg", class: "COMUM" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Antimicrobianos (RDC 471/2021 — receita branca em 2 vias)
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Amoxicilina",         presentation: "Cápsula 500 mg",         class: "ANTIMICROBIANO", controlled: true, defaultDosage: "1 cápsula", defaultFrequency: "3x ao dia", defaultRoute: "Oral" },
  { activeName: "Amoxicilina",         presentation: "Suspensão 250 mg/5 mL",  class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Amoxicilina + Clavulanato", commercialName: "Clavulin", presentation: "Comprimido 500 + 125 mg", class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Amoxicilina + Clavulanato", commercialName: "Clavulin", presentation: "Comprimido 875 + 125 mg", class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Azitromicina",        presentation: "Comprimido 500 mg",      class: "ANTIMICROBIANO", controlled: true, defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia por 3-5 dias", defaultRoute: "Oral" },
  { activeName: "Azitromicina",        presentation: "Suspensão 200 mg/5 mL",  class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Cefalexina",          presentation: "Cápsula 500 mg",         class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Cefuroxima",          commercialName: "Zinnat",  presentation: "Comprimido 500 mg", class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Ciprofloxacino",      presentation: "Comprimido 500 mg",      class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Levofloxacino",       presentation: "Comprimido 500 mg",      class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Levofloxacino",       presentation: "Comprimido 750 mg",      class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Sulfametoxazol + Trimetoprima", commercialName: "Bactrim", presentation: "Comprimido 400 + 80 mg", class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Nitrofurantoína",     commercialName: "Macrodantina", presentation: "Cápsula 100 mg", class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Doxiciclina",         presentation: "Cápsula 100 mg",         class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Metronidazol",        presentation: "Comprimido 250 mg",      class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Metronidazol",        presentation: "Comprimido 400 mg",      class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Clindamicina",        presentation: "Cápsula 300 mg",         class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Eritromicina",        presentation: "Comprimido 500 mg",      class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Penicilina G Benzatina", commercialName: "Benzetacil", presentation: "Frasco 1.200.000 UI",  class: "ANTIMICROBIANO", controlled: true, defaultRoute: "Intramuscular" },
  { activeName: "Fluconazol",          presentation: "Cápsula 150 mg",         class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Itraconazol",         presentation: "Cápsula 100 mg",         class: "ANTIMICROBIANO", controlled: true },
  { activeName: "Nistatina",           presentation: "Suspensão 100.000 UI/mL", class: "ANTIMICROBIANO", controlled: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // Psicotrópicos B1 (azul)
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Clonazepam",  commercialName: "Rivotril",   presentation: "Comprimido 0,5 mg",  class: "B1", controlled: true },
  { activeName: "Clonazepam",  commercialName: "Rivotril",   presentation: "Comprimido 2 mg",    class: "B1", controlled: true, defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia à noite", defaultRoute: "Oral" },
  { activeName: "Clonazepam",  commercialName: "Rivotril",   presentation: "Gotas 2,5 mg/mL",    class: "B1", controlled: true },
  { activeName: "Alprazolam",  commercialName: "Frontal",    presentation: "Comprimido 0,25 mg", class: "B1", controlled: true },
  { activeName: "Alprazolam",  commercialName: "Frontal",    presentation: "Comprimido 0,5 mg",  class: "B1", controlled: true },
  { activeName: "Alprazolam",  commercialName: "Frontal",    presentation: "Comprimido 1 mg",    class: "B1", controlled: true },
  { activeName: "Alprazolam",  commercialName: "Frontal",    presentation: "Comprimido 2 mg",    class: "B1", controlled: true },
  { activeName: "Bromazepam",  commercialName: "Lexotan",    presentation: "Comprimido 3 mg",    class: "B1", controlled: true },
  { activeName: "Bromazepam",  commercialName: "Lexotan",    presentation: "Comprimido 6 mg",    class: "B1", controlled: true },
  { activeName: "Diazepam",    commercialName: "Valium",     presentation: "Comprimido 5 mg",    class: "B1", controlled: true },
  { activeName: "Diazepam",    commercialName: "Valium",     presentation: "Comprimido 10 mg",   class: "B1", controlled: true },
  { activeName: "Lorazepam",   commercialName: "Lorax",      presentation: "Comprimido 1 mg",    class: "B1", controlled: true },
  { activeName: "Lorazepam",   commercialName: "Lorax",      presentation: "Comprimido 2 mg",    class: "B1", controlled: true },
  { activeName: "Midazolam",   commercialName: "Dormonid",   presentation: "Comprimido 15 mg",   class: "B1", controlled: true },
  { activeName: "Zolpidem",    commercialName: "Stilnox",    presentation: "Comprimido 10 mg",   class: "B1", controlled: true, defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia ao deitar", defaultRoute: "Oral" },
  { activeName: "Zopiclona",   commercialName: "Imovane",    presentation: "Comprimido 7,5 mg",  class: "B1", controlled: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // Antidepressivos / ISRS / outros (não controlados, exceto onde indicado)
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Sertralina",   commercialName: "Zoloft",   presentation: "Comprimido 50 mg",  class: "COMUM", defaultDosage: "1 comprimido", defaultFrequency: "1x ao dia pela manhã", defaultRoute: "Oral" },
  { activeName: "Sertralina",   commercialName: "Zoloft",   presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Fluoxetina",   commercialName: "Prozac",   presentation: "Cápsula 20 mg",     class: "COMUM" },
  { activeName: "Escitalopram", commercialName: "Lexapro",  presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Escitalopram", commercialName: "Lexapro",  presentation: "Comprimido 15 mg",  class: "COMUM" },
  { activeName: "Escitalopram", commercialName: "Lexapro",  presentation: "Comprimido 20 mg",  class: "COMUM" },
  { activeName: "Citalopram",   presentation: "Comprimido 20 mg",  class: "COMUM" },
  { activeName: "Paroxetina",   commercialName: "Pondera",  presentation: "Comprimido 20 mg",  class: "COMUM" },
  { activeName: "Venlafaxina",  commercialName: "Efexor XR", presentation: "Cápsula LP 75 mg",  class: "COMUM" },
  { activeName: "Venlafaxina",  commercialName: "Efexor XR", presentation: "Cápsula LP 150 mg", class: "COMUM" },
  { activeName: "Duloxetina",   commercialName: "Cymbalta", presentation: "Cápsula 30 mg",     class: "COMUM" },
  { activeName: "Duloxetina",   commercialName: "Cymbalta", presentation: "Cápsula 60 mg",     class: "COMUM" },
  { activeName: "Bupropiona",   commercialName: "Wellbutrin XL", presentation: "Comprimido LP 150 mg", class: "COMUM" },
  { activeName: "Bupropiona",   commercialName: "Wellbutrin XL", presentation: "Comprimido LP 300 mg", class: "COMUM" },
  { activeName: "Mirtazapina",  commercialName: "Remeron",  presentation: "Comprimido 30 mg",  class: "COMUM" },
  { activeName: "Trazodona",    commercialName: "Donaren",  presentation: "Comprimido 50 mg",  class: "COMUM" },
  { activeName: "Trazodona",    commercialName: "Donaren",  presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Amitriptilina", presentation: "Comprimido 25 mg", class: "COMUM" },
  { activeName: "Amitriptilina", presentation: "Comprimido 75 mg", class: "COMUM" },
  { activeName: "Nortriptilina", commercialName: "Pamelor", presentation: "Cápsula 25 mg", class: "COMUM" },
  { activeName: "Lítio (Carbonato)", commercialName: "Carbolitium", presentation: "Comprimido 300 mg", class: "COMUM" },
  { activeName: "Quetiapina",   commercialName: "Seroquel", presentation: "Comprimido 25 mg",  class: "COMUM" },
  { activeName: "Quetiapina",   commercialName: "Seroquel", presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Quetiapina",   commercialName: "Seroquel", presentation: "Comprimido 200 mg", class: "COMUM" },
  { activeName: "Risperidona",  commercialName: "Risperdal", presentation: "Comprimido 1 mg", class: "COMUM" },
  { activeName: "Risperidona",  commercialName: "Risperdal", presentation: "Comprimido 2 mg", class: "COMUM" },
  { activeName: "Olanzapina",   commercialName: "Zyprexa",  presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Olanzapina",   commercialName: "Zyprexa",  presentation: "Comprimido 10 mg",  class: "COMUM" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Estimulantes do SNC (Controle Especial / A3)
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Metilfenidato", commercialName: "Ritalina",   presentation: "Comprimido 10 mg",      class: "A3", controlled: true },
  { activeName: "Metilfenidato", commercialName: "Ritalina LA", presentation: "Cápsula LP 20 mg",      class: "A3", controlled: true },
  { activeName: "Metilfenidato", commercialName: "Ritalina LA", presentation: "Cápsula LP 30 mg",      class: "A3", controlled: true },
  { activeName: "Metilfenidato", commercialName: "Ritalina LA", presentation: "Cápsula LP 40 mg",      class: "A3", controlled: true },
  { activeName: "Metilfenidato", commercialName: "Concerta",   presentation: "Comprimido LP 18 mg",   class: "A3", controlled: true },
  { activeName: "Metilfenidato", commercialName: "Concerta",   presentation: "Comprimido LP 36 mg",   class: "A3", controlled: true },
  { activeName: "Metilfenidato", commercialName: "Concerta",   presentation: "Comprimido LP 54 mg",   class: "A3", controlled: true },
  { activeName: "Lisdexanfetamina", commercialName: "Venvanse", presentation: "Cápsula 30 mg",  class: "A3", controlled: true },
  { activeName: "Lisdexanfetamina", commercialName: "Venvanse", presentation: "Cápsula 50 mg",  class: "A3", controlled: true },
  { activeName: "Lisdexanfetamina", commercialName: "Venvanse", presentation: "Cápsula 70 mg",  class: "A3", controlled: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // Opioides (A1/A2)
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Morfina",      presentation: "Comprimido 10 mg",       class: "A1", controlled: true },
  { activeName: "Morfina",      presentation: "Comprimido 30 mg",       class: "A1", controlled: true },
  { activeName: "Tramadol",     commercialName: "Tramal",  presentation: "Cápsula 50 mg",      class: "A2", controlled: true },
  { activeName: "Codeína + Paracetamol", commercialName: "Tylex", presentation: "Comprimido 30 + 500 mg", class: "A2", controlled: true },
  { activeName: "Oxicodona",    presentation: "Comprimido LC 10 mg",    class: "A1", controlled: true },
  { activeName: "Oxicodona",    presentation: "Comprimido LC 20 mg",    class: "A1", controlled: true },
  { activeName: "Tapentadol",   commercialName: "Palexia", presentation: "Comprimido 50 mg",   class: "A2", controlled: true },
  { activeName: "Tapentadol",   commercialName: "Palexia", presentation: "Comprimido 100 mg",  class: "A2", controlled: true },
  { activeName: "Fentanil",     presentation: "Adesivo TD 25 mcg/h",     class: "A1", controlled: true },
  { activeName: "Fentanil",     presentation: "Adesivo TD 50 mcg/h",     class: "A1", controlled: true },
  { activeName: "Buprenorfina", commercialName: "Restiva", presentation: "Adesivo TD 5 mcg/h",  class: "A1", controlled: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // Anticonvulsivantes (Controle Especial)
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Carbamazepina", commercialName: "Tegretol", presentation: "Comprimido 200 mg",  class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Carbamazepina", commercialName: "Tegretol", presentation: "Comprimido 400 mg",  class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Oxcarbazepina", commercialName: "Trileptal", presentation: "Comprimido 300 mg", class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Oxcarbazepina", commercialName: "Trileptal", presentation: "Comprimido 600 mg", class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Lamotrigina",   commercialName: "Lamictal", presentation: "Comprimido 25 mg",   class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Lamotrigina",   commercialName: "Lamictal", presentation: "Comprimido 50 mg",   class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Lamotrigina",   commercialName: "Lamictal", presentation: "Comprimido 100 mg",  class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Gabapentina",   commercialName: "Neurontin", presentation: "Cápsula 300 mg",    class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Pregabalina",   commercialName: "Lyrica",   presentation: "Cápsula 75 mg",     class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Pregabalina",   commercialName: "Lyrica",   presentation: "Cápsula 150 mg",    class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Topiramato",    commercialName: "Topamax",  presentation: "Comprimido 25 mg",  class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Topiramato",    commercialName: "Topamax",  presentation: "Comprimido 50 mg",  class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Topiramato",    commercialName: "Topamax",  presentation: "Comprimido 100 mg", class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Ácido Valproico", commercialName: "Depakene", presentation: "Cápsula 250 mg", class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Divalproato",   commercialName: "Depakote", presentation: "Comprimido LP 500 mg", class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Fenobarbital",  commercialName: "Gardenal", presentation: "Comprimido 100 mg", class: "CONTROLE_ESPECIAL", controlled: true },
  { activeName: "Fenitoína",     commercialName: "Hidantal", presentation: "Comprimido 100 mg", class: "CONTROLE_ESPECIAL", controlled: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // AINEs / Analgésicos
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Paracetamol",  commercialName: "Tylenol",  presentation: "Comprimido 500 mg", class: "COMUM" },
  { activeName: "Paracetamol",  commercialName: "Tylenol",  presentation: "Comprimido 750 mg", class: "COMUM" },
  { activeName: "Paracetamol",  commercialName: "Tylenol",  presentation: "Gotas 200 mg/mL",   class: "COMUM" },
  { activeName: "Dipirona",     commercialName: "Novalgina", presentation: "Comprimido 500 mg", class: "COMUM" },
  { activeName: "Dipirona",     commercialName: "Novalgina", presentation: "Gotas 500 mg/mL",   class: "COMUM" },
  { activeName: "Ibuprofeno",   commercialName: "Alivium",  presentation: "Comprimido 400 mg", class: "COMUM" },
  { activeName: "Ibuprofeno",   commercialName: "Alivium",  presentation: "Comprimido 600 mg", class: "COMUM" },
  { activeName: "Naproxeno",    commercialName: "Naprosyn", presentation: "Comprimido 500 mg", class: "COMUM" },
  { activeName: "Diclofenaco",  commercialName: "Voltaren", presentation: "Comprimido 50 mg",  class: "COMUM" },
  { activeName: "Diclofenaco",  commercialName: "Voltaren XR", presentation: "Comprimido LP 75 mg", class: "COMUM" },
  { activeName: "Nimesulida",   commercialName: "Nisulid",  presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Cetoprofeno",  commercialName: "Profenid", presentation: "Cápsula 50 mg",     class: "COMUM" },
  { activeName: "Cetoprofeno",  commercialName: "Profenid", presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Meloxicam",    commercialName: "Movatec",  presentation: "Comprimido 7,5 mg", class: "COMUM" },
  { activeName: "Meloxicam",    commercialName: "Movatec",  presentation: "Comprimido 15 mg",  class: "COMUM" },
  { activeName: "Etoricoxibe",  commercialName: "Arcoxia",  presentation: "Comprimido 60 mg",  class: "COMUM" },
  { activeName: "Etoricoxibe",  commercialName: "Arcoxia",  presentation: "Comprimido 90 mg",  class: "COMUM" },
  { activeName: "Celecoxibe",   commercialName: "Celebra",  presentation: "Cápsula 200 mg",    class: "COMUM" },

  // ═══════════════════════════════════════════════════════════════════════════
  // IBPs / Gastro
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Omeprazol",     commercialName: "Losec",    presentation: "Cápsula 20 mg",  class: "COMUM", defaultDosage: "1 cápsula", defaultFrequency: "1x ao dia em jejum", defaultRoute: "Oral" },
  { activeName: "Omeprazol",     commercialName: "Losec",    presentation: "Cápsula 40 mg",  class: "COMUM" },
  { activeName: "Pantoprazol",   commercialName: "Pantoloc", presentation: "Comprimido 20 mg", class: "COMUM" },
  { activeName: "Pantoprazol",   commercialName: "Pantoloc", presentation: "Comprimido 40 mg", class: "COMUM" },
  { activeName: "Esomeprazol",   commercialName: "Nexium",   presentation: "Cápsula 20 mg",  class: "COMUM" },
  { activeName: "Esomeprazol",   commercialName: "Nexium",   presentation: "Cápsula 40 mg",  class: "COMUM" },
  { activeName: "Lansoprazol",   commercialName: "Prazol",   presentation: "Cápsula 15 mg",  class: "COMUM" },
  { activeName: "Lansoprazol",   commercialName: "Prazol",   presentation: "Cápsula 30 mg",  class: "COMUM" },
  { activeName: "Ranitidina",    commercialName: "Antak",    presentation: "Comprimido 150 mg", class: "COMUM" },
  { activeName: "Domperidona",   commercialName: "Motilium", presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Metoclopramida", commercialName: "Plasil",  presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Ondansetrona",  commercialName: "Vonau",    presentation: "Comprimido 4 mg",   class: "COMUM" },
  { activeName: "Ondansetrona",  commercialName: "Vonau",    presentation: "Comprimido 8 mg",   class: "COMUM" },
  { activeName: "Bromoprida",    commercialName: "Digesan",  presentation: "Gotas 4 mg/mL",     class: "COMUM" },
  { activeName: "Sinvastatina + Ezetimiba", commercialName: "Vytorin", presentation: "Comprimido 20 + 10 mg", class: "COMUM" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Anti-histamínicos / Alergia
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Loratadina",     commercialName: "Claritin",  presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Desloratadina",  commercialName: "Desalex",   presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Cetirizina",     commercialName: "Zyrtec",    presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Levocetirizina", commercialName: "Zinetac",   presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Fexofenadina",   commercialName: "Allegra",   presentation: "Comprimido 120 mg", class: "COMUM" },
  { activeName: "Fexofenadina",   commercialName: "Allegra",   presentation: "Comprimido 180 mg", class: "COMUM" },
  { activeName: "Bilastina",      commercialName: "Alektos",   presentation: "Comprimido 20 mg",  class: "COMUM" },
  { activeName: "Ebastina",       commercialName: "Ebastel",   presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Prednisona",     commercialName: "Meticorten", presentation: "Comprimido 5 mg",  class: "COMUM" },
  { activeName: "Prednisona",     commercialName: "Meticorten", presentation: "Comprimido 20 mg", class: "COMUM" },
  { activeName: "Prednisolona",   commercialName: "Predsim",   presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Prednisolona",   commercialName: "Predsim",   presentation: "Comprimido 20 mg",  class: "COMUM" },
  { activeName: "Dexametasona",   commercialName: "Decadron",  presentation: "Comprimido 4 mg",   class: "COMUM" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Respiratório / Broncodilatadores
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Salbutamol",       commercialName: "Aerolin", presentation: "Aerossol 100 mcg/dose", class: "COMUM" },
  { activeName: "Formoterol + Budesonida", commercialName: "Symbicort", presentation: "Cápsula 6 + 200 mcg/dose", class: "COMUM" },
  { activeName: "Formoterol + Budesonida", commercialName: "Symbicort", presentation: "Cápsula 12 + 400 mcg/dose", class: "COMUM" },
  { activeName: "Salmeterol + Fluticasona", commercialName: "Seretide", presentation: "Aerossol 25 + 125 mcg/dose", class: "COMUM" },
  { activeName: "Tiotrópio",        commercialName: "Spiriva", presentation: "Cápsula inalatória 18 mcg", class: "COMUM" },
  { activeName: "Ipratrópio",       commercialName: "Atrovent", presentation: "Solução nebulização 0,25 mg/mL", class: "COMUM" },
  { activeName: "Montelucaste",     commercialName: "Singulair", presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Acebrofilina",     commercialName: "Brondilat", presentation: "Xarope 10 mg/mL",    class: "COMUM" },
  { activeName: "Bromexina",        commercialName: "Bisolvon", presentation: "Xarope 4 mg/5 mL",    class: "COMUM" },
  { activeName: "Carbocisteína",    commercialName: "Mucofan",  presentation: "Xarope 50 mg/mL",     class: "COMUM" },

  // ═══════════════════════════════════════════════════════════════════════════
  // Saúde feminina / Contraceptivos
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Etinilestradiol + Levonorgestrel", commercialName: "Microvlar", presentation: "Cartela 21 comprimidos 0,03 + 0,15 mg", class: "COMUM" },
  { activeName: "Etinilestradiol + Drospirenona",   commercialName: "Yasmin",    presentation: "Cartela 21 comprimidos 0,03 + 3 mg",   class: "COMUM" },
  { activeName: "Etinilestradiol + Drospirenona",   commercialName: "Yaz",       presentation: "Cartela 24 comprimidos 0,02 + 3 mg",   class: "COMUM" },
  { activeName: "Desogestrel",                      commercialName: "Cerazette", presentation: "Comprimido 75 mcg",                     class: "COMUM" },
  { activeName: "Estradiol",                        commercialName: "Estreva",   presentation: "Gel 0,1% (50 g)",                       class: "COMUM" },
  { activeName: "Estradiol + Noretisterona",        commercialName: "Activelle", presentation: "Comprimido 1 + 0,5 mg",                 class: "COMUM" },
  { activeName: "Tibolona",                         commercialName: "Livial",    presentation: "Comprimido 2,5 mg",                     class: "COMUM" },
  { activeName: "Acetato de Medroxiprogesterona",   commercialName: "Depo-Provera", presentation: "Frasco IM 150 mg/mL",                class: "COMUM" },
  { activeName: "Levonorgestrel",                   commercialName: "Postinor",  presentation: "Comprimido 1,5 mg",                     class: "COMUM" },

  // Misoprostol (uso hospitalar — Controle Especial)
  { activeName: "Misoprostol", commercialName: "Cytotec", presentation: "Comprimido 200 mcg", class: "CONTROLE_ESPECIAL", controlled: true },

  // ═══════════════════════════════════════════════════════════════════════════
  // Outros relevantes
  // ═══════════════════════════════════════════════════════════════════════════
  { activeName: "Ácido Acetilsalicílico", commercialName: "AAS",        presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Clopidogrel",            commercialName: "Plavix",     presentation: "Comprimido 75 mg",  class: "COMUM" },
  { activeName: "Varfarina",              commercialName: "Marevan",    presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Rivaroxabana",           commercialName: "Xarelto",    presentation: "Comprimido 10 mg",  class: "COMUM" },
  { activeName: "Rivaroxabana",           commercialName: "Xarelto",    presentation: "Comprimido 15 mg",  class: "COMUM" },
  { activeName: "Rivaroxabana",           commercialName: "Xarelto",    presentation: "Comprimido 20 mg",  class: "COMUM" },
  { activeName: "Apixabana",              commercialName: "Eliquis",    presentation: "Comprimido 2,5 mg", class: "COMUM" },
  { activeName: "Apixabana",              commercialName: "Eliquis",    presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Dabigatrana",            commercialName: "Pradaxa",    presentation: "Cápsula 150 mg",    class: "COMUM" },
  { activeName: "Alopurinol",             commercialName: "Zyloric",    presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Alopurinol",             commercialName: "Zyloric",    presentation: "Comprimido 300 mg", class: "COMUM" },
  { activeName: "Colchicina",             presentation: "Comprimido 0,5 mg", class: "COMUM" },
  { activeName: "Tansulosina",            commercialName: "Secotex",    presentation: "Comprimido 0,4 mg", class: "COMUM" },
  { activeName: "Finasterida",            commercialName: "Proscar",    presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Finasterida",            commercialName: "Propecia",   presentation: "Comprimido 1 mg",   class: "COMUM" },
  { activeName: "Dutasterida",            commercialName: "Avodart",    presentation: "Cápsula 0,5 mg",    class: "COMUM" },
  { activeName: "Sildenafila",            commercialName: "Viagra",     presentation: "Comprimido 25 mg",  class: "COMUM" },
  { activeName: "Sildenafila",            commercialName: "Viagra",     presentation: "Comprimido 50 mg",  class: "COMUM" },
  { activeName: "Sildenafila",            commercialName: "Viagra",     presentation: "Comprimido 100 mg", class: "COMUM" },
  { activeName: "Tadalafila",             commercialName: "Cialis",     presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Tadalafila",             commercialName: "Cialis",     presentation: "Comprimido 20 mg",  class: "COMUM" },
  { activeName: "Vitamina D3 (Colecalciferol)", presentation: "Cápsula 7.000 UI",  class: "COMUM" },
  { activeName: "Vitamina D3 (Colecalciferol)", presentation: "Cápsula 50.000 UI", class: "COMUM" },
  { activeName: "Vitamina B12 (Cianocobalamina)", presentation: "Ampola 1000 mcg/mL", class: "COMUM" },
  { activeName: "Ácido Fólico",          presentation: "Comprimido 5 mg",   class: "COMUM" },
  { activeName: "Sulfato Ferroso",       presentation: "Comprimido 40 mg de Fe2+", class: "COMUM" },
  { activeName: "Cálcio + Vitamina D3",  commercialName: "Calcium D3", presentation: "Comprimido 500 mg + 400 UI", class: "COMUM" },
];
