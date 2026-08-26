"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { X } from "lucide-react";
import { useState, type ComponentProps, type KeyboardEvent } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { inputVariants } from "./field";

export type TagsInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> & {
  /** As fichas de agora, quando quem usa guarda a lista. */
  value?: string[];
  /** As fichas do primeiro desenho, quando a peca guarda a propria lista. */
  defaultValue?: string[];
  /** Avisado com a lista inteira a cada ficha que entra ou sai. */
  onValueChange?: (value: string[]) => void;
  /** O que fecha uma ficha alem do Enter. Virgula por padrao. */
  separators?: string[];
  /** Teto de fichas. Alcancado, o campo para de aceitar. */
  max?: number;
  /** O que o leitor de tela ouve nos botoes da peca. `remove` recebe a ficha. */
  labels?: { remove?: (tag: string) => string };
  /** @deprecated Use `labels.remove`. */
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
 *
 * Guarda a propria lista quando so recebe `defaultValue`, e obedece a de fora
 * quando recebe `value` - o mesmo par das cinco irmas de formulario. Ate aqui
 * ela era a unica que exigia estado do lado de fora, e um filtro de tela, que
 * nao envia nada e nao guarda nada, pagava um `useState` para existir.
 *
 * O campo de escrever passa pelo `Field.Control`, como o `Input` e o
 * `Textarea`: e ele, e nao a moldura em volta, que recebe o `id` do rotulo, o
 * `aria-describedby` da ajuda e do erro, e o `aria-invalid`. Sem isso o
 * `FieldLabel` apontava para um id que nao existia, o nome do campo caia no
 * `placeholder` - que some ao digitar - e clicar no rotulo nao focava nada.
 */
export function TagsInput({
  value,
  defaultValue = [],
  onValueChange,
  separators = [","],
  max,
  labels = {},
  removeLabel,
  className,
  classNames,
  disabled,
  onKeyDown,
  ...props
}: TagsInputProps) {
  const [draft, setDraft] = useState("");
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const tags = controlled ? value : internal;
  const full = max !== undefined && tags.length >= max;

  // O nome antigo vence o objeto quando os dois vierem: quem ainda passa
  // `removeLabel` passou de proposito, e a peca nao pode escolher o padrao por
  // ele so porque `labels` existe agora.
  const remove = removeLabel ?? labels.remove ?? ((tag: string) => `Remover ${tag}`);

  function change(next: string[]) {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  }

  function add(raw: string) {
    const tag = raw.trim();
    if (!tag || full || tags.includes(tag)) {
      setDraft("");
      return;
    }
    change([...tags, tag]);
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

    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      change(tags.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        inputVariants(),
        "flex h-auto min-h-[var(--rc-control-md)] flex-wrap items-center gap-1.5",
        "px-[var(--rc-control-pad-md)] py-1.5",
        // A moldura e uma `div`, e `div` sem foco nunca casa `:focus-visible`:
        // o anel que o `inputVariants` traz ficava inerte, e o campo focado
        // nao se pintava de jeito nenhum. Quem manda no anel e o campo de
        // dentro. E `has-[input:...]`, e nao `focus-within`, porque o xis de
        // cada ficha tem anel proprio - com `focus-within` acenderiam os dois
        // ao mesmo tempo, que e a borda dupla que o `InputGroup` evita.
        "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring",
        "has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-bg",
        // O `data-invalid` do `Field` cai no campo de dentro, e nao aqui.
        "has-[[data-invalid]]:border-danger",
        disabled && "cursor-not-allowed opacity-60",
        classNames?.field,
        className,
      )}
    >
      {tags.map((tag) => (
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
            aria-label={remove(tag)}
            disabled={disabled}
            onClick={() => change(tags.filter((current) => current !== tag))}
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

      <BaseField.Control
        {...props}
        render={<input />}
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
