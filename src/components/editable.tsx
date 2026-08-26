"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { inputVariants } from "./field";

export type EditableProps = Omit<ComponentProps<"div">, "onChange" | "children"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** O que o leitor de tela chama o campo enquanto ele esta aberto. */
  label: string;
  /** O que aparece quando o valor esta vazio. */
  placeholder?: string;
  disabled?: boolean;
  /** Classe por parte: `preview`, `input`. */
  classNames?: Slots<"preview" | "input">;
};

/**
 * Edicao no lugar: o texto vira campo ao ser clicado, e volta a ser texto ao
 * ser confirmado.
 *
 * E o gesto que separa painel de leitura de painel de operacao. Corrigir o
 * nome de um cliente sem abrir uma tela de edicao, sem perder a posicao na
 * lista e sem esperar duas navegacoes e a diferenca entre a pessoa corrigir e
 * a pessoa deixar errado.
 *
 * Duas decisoes que a peca toma, e que sao a razao de ela existir:
 *
 * O Escape desfaz. Sair pela lateral e o gesto de quem se arrependeu, e
 * salvar ali transforma um clique errado numa edicao que ninguem pediu.
 *
 * Sair do campo salva. E o oposto do Escape de proposito: quem clicou fora
 * seguiu adiante, e obrigar um Enter depois de ja ter ido embora perde o que
 * foi escrito sem avisar.
 *
 * Fechado, o texto e um `button`: quem navega pelo teclado precisa saber que
 * aquilo abre alguma coisa, e um `div` com `onClick` nao diz isso a ninguem.
 */
export function Editable({
  value,
  onValueChange,
  label,
  placeholder = "—",
  disabled,
  className,
  classNames,
  ...props
}: EditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    field.current?.focus();
    // O texto ja vem selecionado: quem abre para trocar o valor inteiro - que e
    // o caso comum - digita por cima, e quem quer ajustar uma letra clica.
    field.current?.select();
  }, [editing]);

  function open() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (draft !== value) onValueChange(draft);
  }

  if (!editing) {
    return (
      <div {...props} className={cn("flex min-w-0", className)}>
        <button
          type="button"
          disabled={disabled}
          onClick={open}
          className={cn(
            "min-w-0 truncate rounded-sm px-1 py-0.5 text-left text-base text-fg",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
            "hover:bg-accent-subtle",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent",
            !value && "text-fg-subtle",
            classNames?.preview,
          )}
        >
          {value || placeholder}
        </button>
      </div>
    );
  }

  return (
    <div {...props} className={cn("flex min-w-0", className)}>
      <input
        ref={field}
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(inputVariants({ size: "sm" }), "min-w-0", classNames?.input)}
      />
    </div>
  );
}
