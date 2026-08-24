"use client";

import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type SeparatorProps = ComponentProps<typeof BaseSeparator>;

/**
 * Linha que separa. Sai com `role="separator"` de proposito: quando ela divide
 * assunto, e nao so enfeite, o leitor de tela precisa saber que ali termina um
 * bloco. Para risco puramente decorativo, uma borda no proprio elemento sai
 * mais barata.
 */
export function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      {...props}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "h-full w-px" : "h-px w-full",
        className,
      )}
    />
  );
}
