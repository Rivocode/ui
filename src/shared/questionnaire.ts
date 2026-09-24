export type QuestionnaireItemStatus = "unanswered" | "answered" | "skipped";

export type QuestionnaireAnswers = Record<string, string | string[]>;

export type QuestionnaireShortcuts = "letters" | "numbers";

export type QuestionnaireLabels = {
  /** A frase de cima: recebe a posicao, contando de um, e o total. */
  progress: (current: number, total: number) => string;
  previous: string;
  skip: string;
  next: string;
  submit: string;
  /** O erro da pergunta obrigatoria sem resposta. */
  required: string;
  /** O erro da pergunta opcional que nao foi respondida nem pulada. */
  unanswered: string;
  /** O nome falado do campo livre que fica ao lado das opcoes. */
  other: string;
  /** A marca ao lado do titulo da pergunta que aceita pular. */
  optional: string;
};

export const QUESTIONNAIRE_LABELS: QuestionnaireLabels = {
  progress: (current, total) => `Pergunta ${current} de ${total}`,
  previous: "Voltar",
  skip: "Pular",
  next: "Próxima",
  submit: "Enviar",
  required: "Responda esta pergunta para continuar.",
  unanswered: "Responda ou pule esta pergunta.",
  other: "Outra resposta",
  optional: "Opcional",
};

export type QuestionnaireVerdict = "ok" | "required" | "unanswered";

export function questionnaireVerdict(
  status: QuestionnaireItemStatus,
  required: boolean,
  disabled: boolean,
): QuestionnaireVerdict {
  if (disabled || status === "answered") return "ok";
  if (required) return "required";
  return status === "skipped" ? "ok" : "unanswered";
}

export function shortcutKey(index: number, mode: QuestionnaireShortcuts): string | null {
  if (mode === "numbers") return index < 9 ? String(index + 1) : null;
  return index < 26 ? String.fromCharCode(65 + index) : null;
}

export function shortcutIndex(key: string, mode: QuestionnaireShortcuts): number {
  if (mode === "numbers") return /^[1-9]$/.test(key) ? Number(key) - 1 : -1;
  return /^[a-z]$/i.test(key) ? key.toUpperCase().charCodeAt(0) - 65 : -1;
}

export function progressPercent(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(Math.max(current, 0), total) / total) * 100);
}
