/* Gerado de src/shared/ai.ts por bun run gen:compartilhado. Nao editar. */

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
