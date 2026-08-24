import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export type AspectRatioProps = ComponentPropsWithoutRef<"div"> & {
  /** Largura dividida por altura. `16 / 9`, `1`, `4 / 3`. */
  ratio?: number;
};

/**
 * Segura a proporcao de uma caixa antes do conteudo dela chegar.
 *
 * Serve para o que tem tamanho vindo de fora: imagem de produto, mapa,
 * incorporacao de video. Sem ela a linha inteira pula quando a imagem carrega,
 * e a pessoa clica no lugar errado porque o botao andou meio segundo depois de
 * ela mirar.
 *
 * `aspect-ratio` do CSS ja resolve isto sozinho hoje; o componente existe para
 * a proporcao virar um numero passado por prop, e nao mais uma classe
 * arbitraria escrita em cada tela.
 */
export function AspectRatio({ className, ratio = 16 / 9, style, ...props }: AspectRatioProps) {
  return (
    <div
      {...props}
      style={{ aspectRatio: String(ratio), ...style }}
      className={cn(
        // O que entra dentro cobre a caixa: imagem menor que a moldura deixa
        // um vao que parece defeito de carregamento.
        "relative w-full overflow-hidden",
        "[&>img]:size-full [&>img]:object-cover",
        "[&>video]:size-full [&>video]:object-cover",
        "[&>iframe]:size-full [&>iframe]:border-0",
        className,
      )}
    />
  );
}
