import { useState } from "react";
import { Pressable, View } from "react-native";

import { Badge, type BadgeProps } from "../badge";
import { Spinner } from "../basics";
import { Button } from "../button";
import { cn } from "../cn";
import { TOOL_CALL_STATUS_TEXT, toolDataText as asText, type ToolCallStatus } from "../shared/ai";
import { Text } from "../text";

export type { ToolCallStatus };

const STATUS: Record<
  ToolCallStatus,
  { text: string; tone: NonNullable<BadgeProps["tone"]>; mark: string }
> = {
  pending: { text: TOOL_CALL_STATUS_TEXT.pending, tone: "neutral", mark: "○" },
  running: { text: TOOL_CALL_STATUS_TEXT.running, tone: "info", mark: "" },
  done: { text: TOOL_CALL_STATUS_TEXT.done, tone: "success", mark: "✓" },
  error: { text: TOOL_CALL_STATUS_TEXT.error, tone: "danger", mark: "✕" },
  approval: { text: TOOL_CALL_STATUS_TEXT.approval, tone: "warning", mark: "!" },
};

function Block({ title, children }: { title: string; children: string }) {
  return (
    <View className="overflow-hidden rounded-lg border border-border bg-surface-raised">
      <Text font="mono" className="border-b border-border px-3 py-1.5 text-xs text-fg-subtle">
        {title}
      </Text>
      <Text font="mono" selectable className="p-3 text-xs text-fg">
        {children}
      </Text>
    </View>
  );
}

export type ToolCallProps = {
  /** O nome da ferramenta, como o modelo a chamou: `buscar_notas`. Sai em fonte mono. */
  name: string;
  /** A frase para gente, embaixo do nome: "Consultando as notas em aberto". */
  title?: string;
  /**
   * Em que pe a chamada esta. Cada estado sai com marca E texto, porque cor
   * nunca e o unico sinal; `running` gira.
   */
  status: ToolCallStatus;
  /** Os argumentos da chamada. Objeto sai como JSON indentado; texto sai como veio. */
  input?: unknown;
  /** O que a ferramenta devolveu, com a mesma regra do `input`. */
  output?: unknown;
  /** A frase do erro, quando `status` e `error`. */
  error?: string;
  /** Chamado pelo botao de aprovar, que so aparece em `approval`, fora do painel. */
  onApprove?: () => void;
  /** Chamado pelo botao de recusar, que so aparece em `approval`. */
  onReject?: () => void;
  /** Os textos dos estados e dos botoes, para outra lingua ou outro tom. */
  labels?: Partial<Record<ToolCallStatus | "approve" | "reject" | "input" | "output", string>>;
  /** Comeca aberto. Sem ele, abre sozinho so em `approval` e em `error`. */
  defaultOpen?: boolean;
  /** Aberto, controlado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export function ToolCall({
  name,
  title,
  status,
  input,
  output,
  error,
  onApprove,
  onReject,
  labels = {},
  defaultOpen,
  open,
  onOpenChange,
  className,
}: ToolCallProps) {
  const state = STATUS[status] ?? STATUS.pending;
  const [own, setOwn] = useState(defaultOpen ?? (status === "approval" || status === "error"));
  const expanded = open ?? own;
  const hasBody = input !== undefined || output !== undefined || Boolean(error);
  const asking = status === "approval" && (onApprove || onReject);
  const statusText = labels[status] ?? state.text;

  function toggle() {
    const next = !expanded;
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
  }

  return (
    <View
      accessibilityState={{ busy: status === "running" }}
      className={cn(
        "w-full overflow-hidden rounded-lg border bg-surface",
        status === "approval" ? "border-warning" : "border-border",
        className,
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${statusText}`}
        accessibilityState={{ expanded: hasBody ? expanded : undefined, disabled: !hasBody }}
        disabled={!hasBody}
        onPress={toggle}
        className="min-h-12 flex-row items-center gap-3 px-3 py-2.5"
      >
        <View className="flex-1 gap-0.5">
          <Text font="mono" numberOfLines={1} className="text-sm text-fg">
            {name}
          </Text>
          {title ? (
            <Text numberOfLines={1} className="text-sm text-fg-muted">
              {title}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center gap-1.5">
          {status === "running" ? <Spinner /> : null}
          <Badge tone={state.tone}>{state.mark ? `${state.mark} ${statusText}` : statusText}</Badge>
        </View>
      </Pressable>

      {hasBody && expanded ? (
        <View className="gap-3 border-t border-border px-3 py-3">
          {input !== undefined ? (
            <Block title={labels.input ?? "Entrada"}>{asText(input)}</Block>
          ) : null}
          {output !== undefined ? (
            <Block title={labels.output ?? "Saída"}>{asText(output)}</Block>
          ) : null}
          {error ? <Text className="text-sm text-danger-text">{error}</Text> : null}
        </View>
      ) : null}

      {asking ? (
        <View className="flex-row justify-end gap-2 border-t border-border px-3 py-2.5">
          {onReject ? (
            <Button variant="secondary" size="sm" onPress={onReject}>
              {labels.reject ?? "Recusar"}
            </Button>
          ) : null}
          {onApprove ? (
            <Button size="sm" onPress={onApprove}>
              {labels.approve ?? "Aprovar"}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
