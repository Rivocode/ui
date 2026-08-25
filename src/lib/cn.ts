import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* As escalas da casa, porque o merge so expulsa o que reconhece como mesmo
   grupo: sem isto, um `rounded-pill` de quem usa convivia com o `rounded-md`
   da peca em vez de vence-lo - e o wrapper de cliente e exatamente esse
   gesto. `shadow-1..3` pela mesma razao. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["sm", "md", "lg", "xl", "pill"],
      shadow: ["1", "2", "3"],
    },
  },
});

/** Junta classes condicionais resolvendo conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
