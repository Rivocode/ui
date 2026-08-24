import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export type ButtonGroupProps = ComponentPropsWithoutRef<"div"> & {
  orientation?: "horizontal" | "vertical";
};

/**
 * Botoes que agem sobre a mesma coisa, encostados um no outro.
 *
 * Nao e um grupo de escolha: para isso existe o `ToggleGroup`, que guarda
 * estado. Aqui sao acoes irmas, do tipo "salvar" ao lado de "salvar e enviar",
 * ou um botao com o menu de variantes dele colado no lado.
 *
 * O encaixe e feito com o seletor de irmaos, e nao pedindo `className` em cada
 * filho: qualquer botao, link ou gatilho de menu entra no lugar certo sem
 * saber que esta num grupo. As bordas internas viram uma so, senao a divisao
 * entre dois botoes secundarios sai com o dobro da espessura das externas.
 */
export function ButtonGroup({
  className,
  orientation = "horizontal",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      {...props}
      role="group"
      data-orientacao={orientation}
      className={cn(
        "inline-flex",
        orientation === "vertical" ? "flex-col" : "flex-row",

        // Cantos: so as pontas do grupo ficam arredondadas.
        orientation === "vertical"
          ? cn(
              "[&>*:not(:first-child)]:rounded-t-none",
              "[&>*:not(:last-child)]:rounded-b-none",
              "[&>*:not(:first-child)]:-mt-px",
            )
          : cn(
              "[&>*:not(:first-child)]:rounded-l-none",
              "[&>*:not(:last-child)]:rounded-r-none",
              "[&>*:not(:first-child)]:-ml-px",
            ),

        // O foco precisa saltar por cima do vizinho, senao o anel fica cortado
        // pela borda do botao do lado.
        "[&>*:focus-visible]:relative [&>*:focus-visible]:z-[var(--rc-z-sticky)]",
        className,
      )}
    />
  );
}
