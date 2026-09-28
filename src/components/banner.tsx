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
   * The tone decides the color, the default icon and the role for the screen reader:
   * `danger` and `warning` are rendered with `role="alert"` and interrupt; `info` and `success`
   * are rendered with `role="status"` and wait for the sentence to finish.
   */
  tone?: "info" | "success" | "warning" | "danger";
  /** The short bold sentence, before the description. Optional. */
  title?: ReactNode;
  /** What happened and what the person does about it. It is the body of the notice. */
  description: ReactNode;
  /**
   * Replaces the tone's icon. Without it, the canonical lucide pair is used (`Info`,
   * `CheckCircle2`, `TriangleAlert`, `CircleX`); with `null`, no icon.
   * Always rendered `aria-hidden`.
   */
  icon?: ReactNode;
  /**
   * The banner's buttons, to the right of the text and below it on the phone. Use
   * `Button` `size="sm"` `variant="secondary"`: its border is the one measured over
   * the tone's background.
   */
  actions?: ReactNode;
  /**
   * Turns on the close x, at the end of the banner. Whoever called it makes the banner
   * go away: the piece keeps no state.
   */
  onDismiss?: () => void;
  /**
   * The piece's texts, to change the language: `dismiss` is the name of the x, "Fechar
   * aviso" without it.
   */
  labels?: Partial<BannerLabels>;
  classNames?: Slots<"icon" | "content" | "title" | "description" | "actions" | "dismiss">;
};

export type BannerTone = NonNullable<BannerProps["tone"]>;

export type BannerLabels = {
  dismiss: string;
};

export function Banner({
  tone = "info",
  title,
  description,
  icon,
  actions,
  onDismiss,
  labels,
  className,
  classNames,
  ...props
}: BannerProps) {
  const dismissLabel = labels?.dismiss ?? "Fechar aviso";
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
              className={cn("text-sm font-rc-medium", TONE_TEXT[tone], classNames?.title)}
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
