import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactElement, Ref } from "react";

import { cn } from "../lib/cn";

export const buttonVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "font-sans font-medium",
    "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    // Desabilitado vira neutro de proposito. Desbotar a cor da marca produz
    // um verde sujo que parece defeito, nao estado.
    "disabled:pointer-events-none disabled:border-transparent",
    "disabled:bg-surface-raised disabled:text-fg-disabled disabled:shadow-none",
  ),
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active",
        secondary: "border border-border-strong bg-surface text-fg hover:bg-surface-raised",
        ghost: "text-fg-muted hover:bg-accent-subtle hover:text-fg",
        // Contorno grosso, sem preenchimento. E a chamada secundaria de pagina
        // de marketing, que precisa pesar ao lado da primaria sem competir com
        // ela.
        outline: cn(
          "border-2 border-border-strong bg-transparent text-fg",
          "hover:border-line-hover hover:bg-accent-subtle",
        ),
        destructive: "bg-danger text-danger-fg hover:opacity-90",
      },
      size: {
        sm: "h-[var(--rc-control-sm)] px-[var(--rc-control-pad-sm)] text-sm",
        md: "h-[var(--rc-control-md)] px-[var(--rc-control-pad-md)] text-base",
        lg: "h-[var(--rc-control-lg)] px-[var(--rc-control-pad-lg)] text-md",
        // Quadrado, para botao que so tem icone. Tabela vive cheio deles, e
        // botao de icone com padding de texto fica torto.
        icon: "size-[var(--rc-control-md)] p-0",
        // Chamada para acao de marketing: maior e em negrito, com medida
        // propria em vez de altura de controle. Botao de landing e botao de
        // formulario tem trabalhos diferentes, e forcar um no outro estraga
        // os dois.
        cta: "gap-2.5 px-6.5 py-3.75 text-[15.5px] font-bold",
        iconSm: "size-[var(--rc-control-sm)] p-0",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-pill",
      },
    },
    defaultVariants: { variant: "primary", size: "md", shape: "default" },
  },
);

export type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Desabilita e anuncia ocupado enquanto uma acao esta em andamento. */
    loading?: boolean;
    /**
     * Troca o elemento renderizado mantendo a aparencia. Use para link:
     * `<Button render={<a href="..." />}>`. Sem isto, todo link que parece
     * botao vira uma string de classe copiada, que e o problema que este
     * componente existe para resolver.
     */
    render?: ReactElement;
    ref?: Ref<HTMLButtonElement>;
  };

/**
 * Botao nativo de proposito. A Base UI nao entra aqui: `<button>` ja traz a
 * semantica e o teclado corretos, e embrulhar isso so adicionaria peso.
 */
export function Button({
  className,
  variant,
  size,
  shape,
  loading = false,
  disabled,
  children,
  render,
  ...props
}: ButtonProps) {
  const conteudo = (
    <>
      {loading && (
        <span
          aria-hidden="true"
          className={cn(
            "size-4 animate-spin rounded-pill border-2 border-current",
            "border-t-transparent",
          )}
        />
      )}
      {children}
    </>
  );

  return useRender({
    render: render ?? <button />,
    props: {
      ...props,
      ...(render ? {} : { disabled: disabled || loading }),
      "aria-busy": loading || undefined,
      className: cn(buttonVariants({ variant, size, shape }), className),
      children: conteudo,
    },
  });
}
