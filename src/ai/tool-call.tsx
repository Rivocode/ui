"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { CheckCircle2, ChevronDown, CircleX, Clock, Hand, LoaderCircle } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Badge, type BadgeProps } from "../components/badge";
import { Button } from "../components/button";
import { CodeBlock } from "../components/code";
import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { TOOL_CALL_STATUS_TEXT, toolDataText as asText, type ToolCallStatus } from "../shared/ai";

export type { ToolCallStatus };

const STATUS: Record<
  ToolCallStatus,
  { text: string; tone: NonNullable<BadgeProps["tone"]>; icon: ReactNode }
> = {
  pending: { text: TOOL_CALL_STATUS_TEXT.pending, tone: "neutral", icon: <Clock /> },
  running: {
    text: TOOL_CALL_STATUS_TEXT.running,
    tone: "info",
    icon: <LoaderCircle className="animate-spin motion-reduce:animate-none" />,
  },
  done: { text: TOOL_CALL_STATUS_TEXT.done, tone: "success", icon: <CheckCircle2 /> },
  error: { text: TOOL_CALL_STATUS_TEXT.error, tone: "danger", icon: <CircleX /> },
  approval: { text: TOOL_CALL_STATUS_TEXT.approval, tone: "warning", icon: <Hand /> },
};

export type ToolCallProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  /** O nome da ferramenta, como o modelo a chamou: `buscar_notas`. Sai em fonte mono. */
  name: string;
  /** A frase para gente, ao lado do nome: "Consultando as notas em aberto". */
  title?: ReactNode;
  /**
   * Em que pe a chamada esta. Cada estado sai com icone E texto, porque cor
   * nunca e o unico sinal: `pending`, `running` (o icone gira), `done`,
   * `error` e `approval`, que espera a pessoa decidir.
   */
  status: ToolCallStatus;
  /**
   * Os argumentos da chamada. Objeto sai como JSON indentado; texto sai como
   * veio.
   */
  input?: unknown;
  /** O que a ferramenta devolveu, com a mesma regra do `input`. */
  output?: unknown;
  /** A frase do erro, quando `status` e `error`. Sai no painel, no tom de perigo. */
  error?: ReactNode;
  /**
   * Chamado pelo botao de aprovar, que so aparece em `approval`. Os dois botoes
   * ficam fora do painel recolhivel: decisao que espera a pessoa nao se
   * esconde.
   */
  onApprove?: () => void;
  /** Chamado pelo botao de recusar, que so aparece em `approval`. */
  onReject?: () => void;
  /** Os textos dos estados e dos botoes, para outra lingua ou outro tom. */
  labels?: Partial<Record<ToolCallStatus | "approve" | "reject" | "input" | "output", string>>;
  /**
   * Comeca aberto. Sem ele, abre sozinho so em `approval` e em `error`, os dois
   * estados em que a pessoa precisa ler a entrada ou o erro.
   */
  defaultOpen?: boolean;
  /** Aberto, controlado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  ...props
}: ToolCallProps) {
  const state = STATUS[status] ?? STATUS.pending;
  const statusText = labels[status] ?? state.text;
  const asking = status === "approval" && (onApprove || onReject);
  const hasBody = input !== undefined || output !== undefined || Boolean(error);

  return (
    <div
      {...props}
      data-status={status}
      aria-busy={status === "running" || undefined}
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface font-sans",
        status === "approval" && "border-warning",
        className,
      )}
    >
      <BaseCollapsible.Root
        defaultOpen={defaultOpen ?? (status === "approval" || status === "error")}
        open={open}
        onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      >
        <BaseCollapsible.Trigger
          disabled={!hasBody}
          className={cn(
            "group flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 text-left",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
            "outline-none hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring",
            "focus-visible:ring-inset disabled:cursor-default disabled:hover:bg-transparent",
            classNames?.trigger,
          )}
        >
          <span className="flex min-w-[10rem] flex-1 basis-0 flex-col gap-0.5">
            <span className={cn("truncate font-mono text-sm text-fg", classNames?.name)}>
              {name}
            </span>
            {title && <span className="truncate text-sm text-fg-muted">{title}</span>}
          </span>

          <span className="ml-auto flex shrink-0 items-center gap-3">
            <Badge
              tone={state.tone}
              size="sm"
              className={cn("shrink-0 [&_svg]:size-3.5", classNames?.status)}
            >
              <span aria-hidden="true" className="contents">
                {state.icon}
              </span>
              {statusText}
            </Badge>

            {hasBody && (
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 text-fg-subtle",
                  "transition-transform duration-[var(--rc-duration-base)] ease-rc",
                  "group-data-[panel-open]:rotate-180",
                )}
              />
            )}
          </span>
        </BaseCollapsible.Trigger>

        {hasBody && (
          <BaseCollapsible.Panel
            className={cn(
              "h-[var(--collapsible-panel-height)] overflow-hidden",
              "transition-[height] duration-[var(--rc-duration-base)] ease-rc",
              "data-[starting-style]:h-0 data-[ending-style]:h-0",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-3 border-t border-border px-3 py-3",
                classNames?.panel,
              )}
            >
              {input !== undefined && (
                <CodeBlock title={labels.input ?? "Entrada"}>{asText(input)}</CodeBlock>
              )}
              {output !== undefined && (
                <CodeBlock title={labels.output ?? "Saída"}>{asText(output)}</CodeBlock>
              )}
              {error && (
                <p
                  className={cn(
                    "flex items-start gap-1.5 text-sm text-danger-text [&_svg]:mt-0.5",
                    "[&_svg]:size-4 [&_svg]:shrink-0",
                    classNames?.error,
                  )}
                >
                  <CircleX aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          </BaseCollapsible.Panel>
        )}
      </BaseCollapsible.Root>

      {asking && (
        <div
          className={cn(
            "flex flex-wrap justify-end gap-2 border-t border-border px-3 py-2.5",
            classNames?.actions,
          )}
        >
          {onReject && (
            <Button type="button" size="sm" variant="secondary" onClick={onReject}>
              {labels.reject ?? "Recusar"}
            </Button>
          )}
          {onApprove && (
            <Button type="button" size="sm" onClick={onApprove}>
              {labels.approve ?? "Aprovar"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
