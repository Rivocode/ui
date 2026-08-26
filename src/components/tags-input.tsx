"use client";

import { X } from "lucide-react";
import { useState, type ComponentProps, type KeyboardEvent } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { inputVariants } from "./field";

export type TagsInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> & {
  /** As fichas de agora. A peca e controlada: quem guarda a lista e o app. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /** O que fecha uma ficha alem do Enter. Virgula por padrao. */
  separators?: string[];
  /** Teto de fichas. Alcancado, o campo para de aceitar. */
  max?: number;
  /** O que o leitor de tela ouve no botao de cada ficha. */
  removeLabel?: (tag: string) => string;
  /** Classe por parte: `field`, `tag`, `remove`, `input`. */
  classNames?: Slots<"field" | "tag" | "remove" | "input">;
};

/**
 * Lista de marcadores que a pessoa escreve: etiquetas de uma nota, palavras de
 * um filtro, emails de um convite.
 *
 * Nao e `Combobox`. O combobox escolhe de uma lista que existe; aqui a lista
 * nasce do que se digita, e nao ha o que sugerir. Quando as duas coisas valem
 * - escolher do catalogo ou criar na hora - o `Combobox` com fichas diz mais,
 * porque mostra o que ja existe antes de deixar inventar.
 *
 * Tres gestos que a peca resolve de uma vez, para nao serem resolvidos cinco
 * vezes diferentes: o Enter fecha a ficha, o Backspace com o campo vazio tira
 * a ultima - e o gesto que todo mundo tenta primeiro - e a repetida nao entra
 * duas vezes, porque marcar duas vezes a mesma coisa nunca e o que se quis.
 */
export function TagsInput({
  value,
  onValueChange,
  separators = [","],
  max,
  removeLabel = (tag) => `Remover ${tag}`,
  className,
  classNames,
  disabled,
  onKeyDown,
  ...props
}: TagsInputProps) {
  const [draft, setDraft] = useState("");
  const full = max !== undefined && value.length >= max;

  function add(raw: string) {
    const tag = raw.trim();
    if (!tag || full || value.includes(tag)) {
      setDraft("");
      return;
    }
    onValueChange([...value, tag]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "Enter" || separators.includes(event.key)) {
      // O Enter aqui fecha a ficha, e nao envia o formulario: dentro de um
      // <form>, sem isto, escrever a primeira etiqueta manda a nota embora.
      event.preventDefault();
      add(draft);
      return;
    }

    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onValueChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        inputVariants(),
        "flex h-auto min-h-[var(--rc-control-md)] flex-wrap items-center gap-1.5",
        "px-[var(--rc-control-pad-md)] py-1.5",
        disabled && "cursor-not-allowed opacity-60",
        classNames?.field,
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className={cn(
            "flex items-center gap-1 rounded-sm bg-accent-subtle px-1.5 py-0.5",
            "text-sm text-fg",
            classNames?.tag,
          )}
        >
          {tag}
          <button
            type="button"
            aria-label={removeLabel(tag)}
            disabled={disabled}
            onClick={() => onValueChange(value.filter((current) => current !== tag))}
            className={cn(
              "relative text-fg-subtle transition-colors hover:text-fg",
              // O alvo de toque cresce sem o desenho crescer, como no chip do
              // Combobox: 12px de icone nao alcancam os 24 da norma.
              "after:absolute after:-inset-1.5",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              classNames?.remove,
            )}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </span>
      ))}

      <input
        {...props}
        value={draft}
        disabled={disabled || full}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        // Sair do campo fecha o que estava escrito: texto digitado e nao
        // fechado some ao enviar o formulario, e ninguem entende por que.
        onBlur={(event) => {
          add(draft);
          props.onBlur?.(event);
        }}
        className={cn(
          "min-w-24 flex-1 border-0 bg-transparent p-0 text-base text-fg",
          "outline-none placeholder:text-fg-subtle",
          classNames?.input,
        )}
      />
    </div>
  );
}
