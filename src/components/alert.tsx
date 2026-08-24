import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export const alertVariants = cva(
  cn("flex flex-col gap-1 rounded-lg border p-4 font-sans", "[&_svg]:size-4 [&_svg]:shrink-0"),
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

export type AlertProps = ComponentPropsWithoutRef<"div"> & VariantProps<typeof alertVariants>;

/**
 * Aviso que fica na tela, ao contrario do Toast, que passa.
 *
 * Erro e atencao usam `role="alert"`, que interrompe o leitor de tela na hora.
 * Sucesso e informacao usam `role="status"`, que espera a pessoa terminar a
 * frase. Interromper alguem para dizer "salvo com sucesso" e falta de educacao
 * com quem depende do leitor.
 */
export function Alert({ className, tone, ...props }: AlertProps) {
  const urgente = tone === "danger" || tone === "warning";

  return (
    <div
      {...props}
      role={urgente ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-base font-medium", className)} />;
}

export function AlertDescription({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-sm text-fg-muted", className)} />;
}
