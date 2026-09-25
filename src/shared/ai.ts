export type MessageRole = "user" | "assistant" | "system";

export const MESSAGE_AUTHOR: Record<MessageRole, string> = {
  user: "Você",
  assistant: "Assistente",
  system: "Sistema",
};

export const STICK_DISTANCE = 48;

export type ToolCallStatus = "pending" | "running" | "done" | "error" | "approval";

export const TOOL_CALL_STATUS_TEXT: Record<ToolCallStatus, string> = {
  pending: "Pendente",
  running: "Rodando",
  done: "Concluída",
  error: "Erro",
  approval: "Aguardando aprovação",
};

export function toolDataText(data: unknown): string {
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2) ?? String(data);
  } catch {
    return String(data);
  }
}

export type PromptInputLabels = {
  hint: string;
  count: (count: number, max?: number) => string;
  limit: (max: number) => string;
};

const characters = (amount: number) => (amount === 1 ? "caractere" : "caracteres");

export const PROMPT_INPUT_COUNT: Pick<PromptInputLabels, "count" | "limit"> = {
  count: (count, max) =>
    max === undefined ? `${count} ${characters(count)}` : `${count} de ${max} ${characters(max)}`,
  limit: (max) => `Limite de ${max} ${characters(max)} atingido.`,
};
