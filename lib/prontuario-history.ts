/** Consulta anterior do paciente, como aparece no histórico do prontuário (só o médico vê). */
export interface HistoricoConsulta {
  id:             string;
  /** ISO da data em que a consulta aconteceu (início, ou horário marcado). */
  date:           string | null;
  chiefComplaint: string | null;
  diagnosis:      string | null;
  conduct:        string | null;
  notes:          string | null;
  /** Medicamentos da receita emitida nessa consulta, já em texto. */
  medications:    string[];
}
