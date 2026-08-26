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
     * O simbolo a esquerda do texto, com posicao garantida.
     *
     * Ele existe por causa da regra da casa: cor nunca e o unico sinal. Quem
     * nao distingue vermelho de verde le quatro caixas iguais, e o mesmo vale
     * para a impressao em preto e branco. O icone entrava como filho, no meio
     * do titulo e da descricao - sem coluna propria, sem alinhamento com a
     * primeira linha, e cada tela o colocava num lugar.
     *
     * O par canonico do lucide, na tabela de icones da casa: `Info` para
     * `info`, `CheckCircle2` para `success`, `TriangleAlert` para `warning`,
     * `CircleX` para `danger`. Ele sai `aria-hidden`: o texto ao lado ja diz o
     * que ele desenha, e o `role` da raiz ja diz a urgencia.
     */
    icon?: ReactNode;
    /**
     * Liga o xis que fecha o aviso, no canto direito.
     *
     * Quem some com o aviso e quem chamou - a peca nao guarda estado nenhum -,
     * pelo mesmo motivo de o `Alert` nao ter `open`: um aviso que se apaga
     * sozinho e `Toast`, e o `Alert` existe para o que fica na tela.
     *
     * Sem ele nao ha botao, que continua sendo o padrao: aviso que a pessoa
     * pode dispensar e o caso, e nao a regra.
     */
    onDismiss?: () => void;
    /** O nome do botao de fechar. Sem ele, "Fechar aviso". */
    dismissLabel?: string;
  };

export function Alert({
  className,
  tone,
  icon,
  onDismiss,
  dismissLabel = "Fechar aviso",
  children,
  ...props
}: AlertProps) {
  const isUrgent = tone === "danger" || tone === "warning";

  return (
    <div
      {...props}
      role={isUrgent ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
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
          aria-label={dismissLabel}
          onClick={onDismiss}
          className={cn(
            "-my-1 -mr-1 shrink-0 rounded-sm p-1 outline-none",
            "transition-opacity duration-[var(--rc-duration-fast)]",
            "opacity-70 hover:opacity-100",
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
  return <p {...props} className={cn("text-base font-medium", className)} />;
}

export function AlertDescription({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-sm text-fg-muted", className)} />;
}
