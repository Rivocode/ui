import { extendTailwindMerge } from "tailwind-merge";

/**
 * O mesmo cn do web: junta e resolve conflito - a classe de quem usa vence a
 * da peca (h-14 do app derruba o h-12 do Button). E o que torna o wrapper de
 * cliente possivel sem estilo inline nem fork.
 *
 * As escalas da casa entram na configuracao porque o merge so expulsa o que
 * reconhece como mesmo grupo: sem isto, rounded-pill convivia com rounded-md
 * em vez de vence-lo.
 */
export const cn = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["sm", "md", "lg", "xl", "pill"],
      shadow: ["1", "2", "3"],
    },
  },
});
