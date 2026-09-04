"use client";

import { Search } from "lucide-react";
import type { ComponentProps, KeyboardEvent } from "react";

import { cn } from "../lib/cn";
import { Kbd } from "./kbd";

export type SearchInputProps = Omit<ComponentProps<"input">, "size" | "type"> & {
  /**
   * A altura do campo. O `size` nativo do input e numero e sai fora, como no
   * `Input`: aqui quem carrega o significado e a variante. Existe porque uma
   * busca ao lado de um `Select size="sm"` numa barra de filtro saia mais
   * alta que as irmas, e a barra inteira ficava torta.
   */
  size?: "sm" | "md" | "lg";
  /**
   * O atalho que abre ou foca a busca, mostrado num `Kbd` dentro do campo:
   * `"mod+k"`. So o desenho - registrar o atalho e trabalho de quem monta a
   * tela, porque e ela que sabe o que mais escuta teclado.
   */
  shortcut?: string;
  /** Chamado no Esc. Sem ele, o Esc limpa so o campo nao controlado. */
  onClear?: () => void;
};

const SIZE = {
  sm: "h-[var(--rc-control-sm)] pr-[var(--rc-control-pad-sm)] text-sm",
  md: "h-[var(--rc-control-md)] pr-[var(--rc-control-pad-md)] text-base",
  lg: "h-[var(--rc-control-lg)] pr-[var(--rc-control-pad-lg)] text-md",
} as const;

export function SearchInput({
  className,
  size = "md",
  shortcut,
  onClear,
  onKeyDown,
  ...props
}: SearchInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if (onClear) onClear();
    else event.currentTarget.value = "";
  }

  return (
    <div className="relative w-full">
      <Search
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
      />

      <input
        type="search"
        {...props}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full rounded-md border border-border-strong bg-surface",
          SIZE[size],
          "pl-8 font-sans max-sm:text-[16px] text-fg placeholder:text-fg-subtle",
          shortcut && "pr-16",
          "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-fg-disabled",
          "[&::-webkit-search-cancel-button]:hidden",
          className,
        )}
      />

      {shortcut && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
        >
          <Kbd size="sm" keys={shortcut} />
        </span>
      )}
    </div>
  );
}
