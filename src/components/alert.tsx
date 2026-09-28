"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

export const alertVariants = cva(
  cn("flex items-start gap-3 rounded-lg border p-4 font-sans", "[&_svg]:size-4 [&_svg]:shrink-0"),
  {
    variants: {
      tone: {
        info: "border-border bg-info-subtle text-info-text",
        success: "border-border bg-success-subtle text-success-text",
        warning: "border-border bg-warning-subtle text-warning-text",
        danger: "border-border bg-danger-subtle text-danger-text",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

export type AlertProps = ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof alertVariants> & {
    /**
     * The symbol to the left of the text, with a guaranteed position.
     *
     * It exists because of the house rule: color is never the only signal. Someone
     * who cannot tell red from green reads four identical boxes, and the same goes
     * for black-and-white printing. The icon used to come in as a child, in the middle
     * of the title and the description - with no column of its own, no alignment with the
     * first line, and each screen put it in a different place.
     *
     * The canonical lucide pair, from the house icon table: `Info` for
     * `info`, `CheckCircle2` for `success`, `TriangleAlert` for `warning`,
     * `CircleX` for `danger`. It is rendered `aria-hidden`: the text beside it already says
     * what it draws, and the root's `role` already states the urgency.
     */
    icon?: ReactNode;
    /**
     * Turns on the x that closes the notice, in the right corner.
     *
     * Whoever called it makes the notice go away - the piece keeps no state at all -
     * for the same reason `Alert` has no `open`: a notice that disappears
     * by itself is a `Toast`, and `Alert` exists for what stays on the screen.
     *
     * Without it there is no button, which remains the default: a notice the person
     * can dismiss is the exception, not the rule.
     */
    onDismiss?: () => void;
    /**
     * The piece's texts, to change the language: `dismiss` is the name of the x,
     * "Fechar aviso" without it.
     */
    labels?: Partial<AlertLabels>;
  };

export type AlertLabels = {
  dismiss: string;
};

export function Alert({
  className,
  tone,
  icon,
  onDismiss,
  labels,
  children,
  ...props
}: AlertProps) {
  const isUrgent = tone === "danger" || tone === "warning";

  return (
    <div
      {...props}
      role={isUrgent ? "alert" : "status"}
      className={cn(alertVariants({ tone }), "animate-enter", className)}
    >
      {icon && (
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          {icon}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>

      {onDismiss && (
        <button
          type="button"
          aria-label={labels?.dismiss ?? "Fechar aviso"}
          onClick={onDismiss}
          className={cn(
            "-my-1 -mr-1 shrink-0 rounded-sm p-1 outline-none",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc-effects",
            "text-fg-muted hover:text-fg",
            "focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function AlertTitle({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-base font-rc-medium", className)} />;
}

export function AlertDescription({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-sm text-fg-muted", className)} />;
}
