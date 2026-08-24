import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

/**
 * Marca de lugar enquanto o dado nao chegou.
 *
 * Fica escondido do leitor de tela de proposito: nao ha o que ler num retangulo
 * cinza, e anunciar um por linha viraria ruido. Quem precisa do aviso de
 * carregamento recebe pelo `aria-busy` do container.
 */
export function Skeleton({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-skeleton motion-reduce:animate-none", className)}
    />
  );
}
