"use client";

import { cva } from "class-variance-authority";
import { CheckCircle2, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export const bannerVariants = cva("flex w-full items-start gap-3 border-b px-4 py-3 font-sans", {
  variants: {
    tone: {
      info: "border-info bg-info-subtle",
      success: "border-success bg-success-subtle",
      warning: "border-warning bg-warning-subtle",
      danger: "border-danger bg-danger-subtle",
    },
  },
  defaultVariants: { tone: "info" },
});

const TONE_TEXT: Record<BannerTone, string> = {
  info: "text-info-text",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
};

const TONE_ICON: Record<BannerTone, ReactNode> = {
  info: <Info />,
  success: <CheckCircle2 />,
  warning: <TriangleAlert />,
  danger: <CircleX />,
};

export type BannerProps = Omit<ComponentPropsWithoutRef<"div">, "title" | "children"> & {
  /**
   * O tom decide a cor, o icone padrao e o papel para o leitor de tela:
   * `danger` e `warning` saem `role="alert"` e interrompem; `info` e `success`
   * saem `role="status"` e esperam a frase terminar.
   */
  tone?: "info" | "success" | "warning" | "danger";
  /** A frase curta em negrito, antes da descricao. Opcional. */
  title?: ReactNode;
  /** O que aconteceu e o que a pessoa faz a respeito. E o corpo do aviso. */
  description: ReactNode;
  /**
   * Troca o icone do tom. Sem ele, sai o par canonico do lucide (`Info`,
   * `CheckCircle2`, `TriangleAlert`, `CircleX`); com `null`, nenhum icone.
   * Sai sempre `aria-hidden`.
   */
  icon?: ReactNode;
  /**
   * Os botoes da faixa, a direita do texto e embaixo dele no celular. Use
   * `Button` `size="sm"` `variant="secondary"`: a borda dele e a medida sobre
   * o fundo do tom.
   */
  actions?: ReactNode;
  /**
   * Liga o xis de fechar, no fim da faixa. Quem some com a faixa e quem
   * chamou: a peca nao guarda estado.
   */
  onDismiss?: () => void;
  /** O nome acessivel do xis. Sem ele, "Fechar aviso". */
  dismissLabel?: string;
  classNames?: Slots<"icon" | "content" | "title" | "description" | "actions" | "dismiss">;
};

export type BannerTone = NonNullable<BannerProps["tone"]>;

export function Banner({
  tone = "info",
  title,
  description,
  icon,
  actions,
  onDismiss,
  dismissLabel = "Fechar aviso",
  className,
  classNames,
  ...props
}: BannerProps) {
  const titleId = useId();
  const isUrgent = tone === "danger" || tone === "warning";
  const symbol = icon === undefined ? TONE_ICON[tone] : icon;

  return (
    <div
      role={isUrgent ? "alert" : "status"}
      aria-labelledby={title ? titleId : undefined}
      {...props}
      data-tone={tone}
      className={cn(bannerVariants({ tone }), className)}
    >
      {symbol && (
        <span
          aria-hidden="true"
          className={cn("mt-0.5 shrink-0 [&_svg]:size-4", TONE_TEXT[tone], classNames?.icon)}
        >
          {symbol}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", classNames?.content)}>
          {title && (
            <p
              id={titleId}
              className={cn("text-sm font-medium", TONE_TEXT[tone], classNames?.title)}
            >
              {title}
            </p>
          )}
          <div className={cn("text-sm text-fg", classNames?.description)}>{description}</div>
        </div>

        {actions && (
          <div
            className={cn(
              "flex min-w-0 flex-wrap items-center gap-2",
              "[&>button]:h-auto [&>button]:min-h-[var(--rc-control-sm)] [&>button]:max-w-full",
              "[&>button]:shrink [&>button]:py-1 [&>button]:whitespace-normal",
              classNames?.actions,
            )}
          >
            {actions}
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className={cn(
            "-my-1 -mr-1 shrink-0 rounded-sm p-1 outline-none",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc-effects",
            "hover:text-fg focus-visible:ring-2 focus-visible:ring-ring",
            "[&_svg]:size-4",
            TONE_TEXT[tone],
            classNames?.dismiss,
          )}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
