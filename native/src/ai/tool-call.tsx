import { useState } from "react";
import { Pressable, View } from "react-native";

import { Badge, type BadgeProps } from "../badge";
import { Spinner } from "../basics";
import { Button } from "../button";
import { cn, type Slots } from "../cn";
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
  /** The tool name, as the model called it: `buscar_notas`. Rendered in a mono font. */
  name: string;
  /** The human-readable sentence, below the name: "Consultando as notas em aberto". */
  title?: string;
  /**
   * Where the call stands. Each state shows a mark AND text, because color is
   * never the only signal; `running` spins.
   */
  status: ToolCallStatus;
  /** The call arguments. An object is shown as indented JSON; text is shown as it came. */
  input?: unknown;
  /** What the tool returned, with the same rule as `input`. */
  output?: unknown;
  /** The error sentence, when `status` is `error`. */
  error?: string;
  /** Called by the approve button, which appears only in `approval`, outside the panel. */
  onApprove?: () => void;
  /** Called by the reject button, which appears only in `approval`. */
  onReject?: () => void;
  /** The texts of the states and buttons, for another language or another tone. */
  labels?: Partial<Record<ToolCallStatus | "approve" | "reject" | "input" | "output", string>>;
  /** Starts open. Without it, it opens on its own only in `approval` and `error`. */
  defaultOpen?: boolean;
  /** Open, controlled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /**
   * Class per part: `trigger` (the header that opens it), `name`, `status` (the
   * spinner and the badge), `panel` (the input and output), `error` and
   * `actions` (the approve and reject buttons).
   */
  classNames?: Slots<"trigger" | "name" | "status" | "panel" | "error" | "actions">;
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
  classNames,
}: ToolCallProps) {
  const state = STATUS[status] ?? STATUS.pending;
  const [own, setOwn] = useState(defaultOpen ?? (status === "approval" || status === "error"));
  const [seen, setSeen] = useState(status);
  if (seen !== status) {
    setSeen(status);
    if (open === undefined && (status === "approval" || status === "error")) setOwn(true);
  }
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
        className={cn("min-h-12 flex-row items-center gap-3 px-3 py-2.5", classNames?.trigger)}
      >
        <View className="flex-1 gap-0.5">
          <Text font="mono" numberOfLines={1} className={cn("text-sm text-fg", classNames?.name)}>
            {name}
          </Text>
          {title ? (
            <Text numberOfLines={1} className="text-sm text-fg-muted">
              {title}
            </Text>
          ) : null}
        </View>

        <View className={cn("flex-row items-center gap-1.5", classNames?.status)}>
          {status === "running" ? <Spinner /> : null}
          <Badge tone={state.tone}>{state.mark ? `${state.mark} ${statusText}` : statusText}</Badge>
        </View>
      </Pressable>

      {hasBody && expanded ? (
        <View className={cn("gap-3 border-t border-border px-3 py-3", classNames?.panel)}>
          {input !== undefined ? (
            <Block title={labels.input ?? "Entrada"}>{asText(input)}</Block>
          ) : null}
          {output !== undefined ? (
            <Block title={labels.output ?? "Saída"}>{asText(output)}</Block>
          ) : null}
          {error ? (
            <Text className={cn("text-sm text-danger-text", classNames?.error)}>{error}</Text>
          ) : null}
        </View>
      ) : null}

      {asking ? (
        <View
          className={cn(
            "flex-row justify-end gap-2 border-t border-border px-3 py-2.5",
            classNames?.actions,
          )}
        >
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
