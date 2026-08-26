"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

/** Traco do estado misto: alguns selecionados, nem todos. */
function TracoMisto() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3">
      <line
        x1="2.5"
        y1="6"
        x2="9.5"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Visto() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3">
      <path
        d="M2.5 6.3 4.8 8.6 9.5 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type CheckboxProps = Omit<ComponentProps<typeof BaseCheckbox.Root>, "children"> & {
  /**
   * O texto ao lado. Com ele, a caixa sai dentro de um `<label>`, entao clicar
   * no texto tambem marca.
   *
   * Sem ele, sai so a caixa, e o arranjo fica com quem monta a tela. Use assim
   * quando o rotulo tiver estrutura: um `<strong>` com descricao embaixo, um
   * link no meio da frase.
   */
  children?: ReactNode;
  /**
   * Classe do `<label>` de fora, quando ha texto. E o nome antigo de
   * `classNames.label`, e continua valendo.
   */
  labelClassName?: string;
  /** Classe por parte: `box`, `indicator`, `label`. */
  classNames?: Slots<"box" | "indicator" | "label">;
};

export function Checkbox({
  className,
  children,
  labelClassName,
  classNames,
  ...props
}: CheckboxProps) {
  /*
   * O `Field` passa o proprio rotulo a todo controle que mora dentro dele, e
   * quando o controle ja tem texto proprio os dois se somam: o leitor de tela
   * anunciava "Impostos" no lugar de "ISS retido na fonte". Com texto proprio,
   * o texto e que nomeia.
   */
  const textId = useId();
  const named = children !== undefined;

  const box = (
    <BaseCheckbox.Root
      {...props}
      aria-labelledby={named ? textId : props["aria-labelledby"]}
      className={cn(
        "inline-flex size-[var(--rc-box)] shrink-0 items-center justify-center",
        "rounded-sm border border-border-strong bg-surface",
        "data-[invalid]:border-danger",
        "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "data-[checked]:border-accent data-[checked]:bg-accent data-[checked]:text-accent-fg",
        "data-[indeterminate]:border-accent data-[indeterminate]:bg-accent",
        "data-[indeterminate]:text-accent-fg",
        "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-raised",
        "data-[disabled]:text-fg-disabled",
        // WCAG 2.5.8 pede 24x24 de alvo, e o --rc-box desenha 18 (16 na
        // densidade compacta). Sem texto ao lado nao ha nada de onde emprestar
        // area - e o caso da coluna de selecao do DataTable, onde o dedo mais
        // mira -, entao um pseudo-elemento transparente estica so o alvo, seis
        // pixels para cada lado. Crescer a caixa de verdade engordaria a
        // coluna inteira, que e o oposto do que a densidade da casa quer.
        //
        // Com rotulo isto nao entra: o `<label>` de fora ja e o alvo, e o halo
        // so deitaria uma camada por cima do proprio texto.
        children === undefined && "relative after:absolute after:-inset-1.5",
        classNames?.box,
        className,
      )}
    >
      <BaseCheckbox.Indicator
        render={(indicatorProps, state) => (
          <span
            {...indicatorProps}
            data-rc-check={state.indeterminate ? "indeterminate" : "checked"}
            className={cn("flex items-center justify-center", classNames?.indicator)}
          >
            {state.indeterminate ? <TracoMisto /> : <Visto />}
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );

  if (children === undefined) return box;

  return (
    <label
      className={cn(
        // `flex` e nao `inline-flex`: tres opcoes empilhadas num `space-y`
        // caiam todas na mesma linha, porque elemento inline nao ocupa a
        // linha. `w-fit` impede o outro extremo, que e o rotulo esticar ate a
        // borda e fazer o clique valer a dez centimetros do texto.
        "flex w-fit cursor-pointer items-center gap-2 font-sans text-base text-fg",
        "has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-fg-disabled",
        classNames?.label,
        labelClassName,
      )}
    >
      {box}
      {/* O texto ganha id proprio, e e ele que nomeia a caixa. */}
      <span id={textId}>{children}</span>
    </label>
  );
}
