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
        // O acento so pinta quando a caixa esta viva, e quem diz isso e o
        // `not-data-disabled` - nao a ordem das classes. O Tailwind emite as
        // variantes `data-[...]` em ordem alfabetica, entao `data-[disabled]`
        // vencia `data-[checked]` por "c" vir antes de "d", e PERDIA para
        // `data-[indeterminate]`, que vem depois: a caixa de selecionar-todas
        // desabilitada, em estado misto, saia pintada de acento cheio. Com os
        // dois seletores se excluindo, a ordem deixa de decidir.
        "data-[checked]:not-data-disabled:border-accent data-[checked]:not-data-disabled:bg-accent",
        "data-[checked]:not-data-disabled:text-accent-fg",
        "data-[indeterminate]:not-data-disabled:border-accent",
        "data-[indeterminate]:not-data-disabled:bg-accent",
        "data-[indeterminate]:not-data-disabled:text-accent-fg",
        // Desabilitado se pinta com token, e nao com `opacity-60` - que e o que
        // o Radio e o Switch faziam. Opacidade rebaixa borda, marca e texto de
        // uma vez, e o `check:contrast` nao mede opacidade: a peca saia da
        // guarda sem ninguem conferir o que o olho ve.
        //
        // A borda NAO muda com o estado. `--rc-border` diz de si mesmo que
        // "separa area, e nao identifica controle", e medido ele da 1,30:1
        // contra o proprio preenchimento nos dois temas - a caixa travada
        // sumiria. `--rc-border-strong` e a fronteira de controle nos 3:1 da
        // WCAG 1.4.11, e travada ela continua sendo uma caixa.
        "data-[disabled]:cursor-not-allowed",
        "data-[disabled]:bg-surface-raised data-[disabled]:text-fg-disabled",
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
        // `gap-2` e nao `gap-3`: o CheckboxGroup e o RadioGroup empilham as
        // opcoes com `gap-2`, e um respiro maior aqui poria o rotulo mais
        // perto da opcao de baixo do que do proprio controle.
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
