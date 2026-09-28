/* Gerado de src/shared/spoiler.ts por bun run gen:compartilhado. Nao editar. */

export const SPOILER_MORE = "Ler mais";

export const SPOILER_LESS = "Ler menos";

export const SPOILER_HEIGHT = 120;

export const SPOILER_CLIPPED = "Texto cortado. Toque em Ler mais para ver o resto.";

export function revealsFocus({
  bottom,
  scrollTop,
  maxHeight,
  fade,
}: {
  bottom: number;
  scrollTop: number;
  maxHeight: number;
  fade: number;
}): boolean {
  return scrollTop > 0 || bottom > maxHeight - fade;
}
