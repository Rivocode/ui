"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import { createContext, use, useEffect, type ComponentProps, type Ref } from "react";

import { cn } from "../lib/cn";

export const inputVariants = cva(
  cn(
    "w-full rounded-md border border-border-strong bg-surface text-fg",
    "placeholder:text-fg-subtle",
    "max-sm:text-[16px]",
    "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:cursor-not-allowed disabled:text-fg-disabled",
    "data-[invalid]:border-danger",
  ),
  {
    variants: {
      size: {
        sm: "h-[var(--rc-control-sm)] px-[var(--rc-control-pad-sm)] text-sm",
        md: "h-[var(--rc-control-md)] px-[var(--rc-control-pad-md)] text-base",
        lg: "h-[var(--rc-control-lg)] px-[var(--rc-control-pad-lg)] text-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const FieldRootPresence = createContext(false);

export function missingFieldRootComplaint(part: string): string {
  return (
    `[rivocode/ui] <${part}> fora de <Field>: a Base UI derruba a árvore inteira quando uma ` +
    "parte do campo não encontra o <Field> em volta, e a página fica em branco sem erro na " +
    `tela. Envolva o bloco com <Field name="algo">, ou troque <${part}> por um elemento ` +
    "comum onde não houver campo nenhum. Aqui o desenho seguiu num elemento simples, sem " +
    "a ligação com o controle que o leitor de tela espera."
  );
}

function useMissingFieldRootWarning(part: string, missing: boolean) {
  useEffect(() => {
    if (!missing || process.env.NODE_ENV === "production") return;

    console.error(missingFieldRootComplaint(part));
  }, [part, missing]);
}

type BaseOnly = {
  render?: unknown;
  style?: unknown;
  match?: unknown;
  nativeLabel?: unknown;
};

function plainProps<T extends BaseOnly>(props: T) {
  const { render: _render, style, match: _match, nativeLabel: _nativeLabel, ...rest } = props;
  return {
    ...rest,
    style: typeof style === "function" ? undefined : (style as ComponentProps<"p">["style"]),
  };
}

export type FieldProps = ComponentProps<typeof BaseField.Root>;

export function Field({ className, ...props }: FieldProps) {
  return (
    <FieldRootPresence value={true}>
      <BaseField.Root {...props} className={cn("flex flex-col gap-1.5", className)} />
    </FieldRootPresence>
  );
}

export function FieldLabel({ className, ...props }: ComponentProps<typeof BaseField.Label>) {
  const inside = use(FieldRootPresence);
  const classes = cn("font-sans text-sm font-medium text-fg", className);

  useMissingFieldRootWarning("FieldLabel", !inside);

  if (!inside) {
    const { ref, ...plain } = plainProps(props);
    return <label {...plain} ref={ref as Ref<HTMLLabelElement>} className={classes} />;
  }

  return <BaseField.Label {...props} className={classes} />;
}

export type InputProps = Omit<ComponentProps<typeof BaseField.Control>, "size"> &
  VariantProps<typeof inputVariants>;

export function Input({ className, size, ...props }: InputProps) {
  return <BaseField.Control {...props} className={cn(inputVariants({ size }), className)} />;
}

export type TextareaProps = Omit<ComponentProps<typeof BaseField.Control>, "size"> & {
  /** Quantas linhas o campo mostra antes de rolar. */
  rows?: number;
};

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <BaseField.Control
      {...props}
      render={<textarea rows={rows} />}
      className={cn(
        inputVariants(),
        "h-auto min-h-[calc(var(--rc-control-md)*2)] resize-y py-2 leading-[var(--rc-leading-normal)]",
        className,
      )}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: ComponentProps<typeof BaseField.Description>) {
  const inside = use(FieldRootPresence);
  const classes = cn("text-xs text-fg-subtle", className);

  useMissingFieldRootWarning("FieldDescription", !inside);

  if (!inside) return <p {...plainProps(props)} className={classes} />;

  return <BaseField.Description {...props} className={classes} />;
}

export function FieldError({ className, ...props }: ComponentProps<typeof BaseField.Error>) {
  const inside = use(FieldRootPresence);
  const classes = cn("text-xs text-danger-text", className);

  useMissingFieldRootWarning("FieldError", !inside);

  if (!inside) {
    if (props.match !== true) return null;

    return <div {...plainProps(props)} className={classes} />;
  }

  return <BaseField.Error {...props} className={classes} />;
}
