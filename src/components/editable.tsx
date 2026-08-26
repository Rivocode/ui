"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { inputVariants } from "./field";

export type EditableProps = Omit<
  ComponentProps<"div">,
  "onChange" | "children" | "value" | "defaultValue"
> & {
  /** O texto de agora, quando quem usa guarda o valor. */
  value?: string;
  /** O texto do primeiro desenho, quando a peca guarda o proprio valor. */
  defaultValue?: string;
  /** Avisado no Enter e ao sair do campo, e nunca no Escape. */
  onValueChange?: (value: string) => void;
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
 *
 * Guarda o proprio valor quando so recebe `defaultValue`, e obedece ao de fora
 * quando recebe `value` - o mesmo par das cinco irmas de formulario.
 */
export function Editable({
  value,
  defaultValue = "",
  onValueChange,
  label,
  placeholder = "—",
  disabled,
  className,
  classNames,
  ...props
}: EditableProps) {
  const [editing, setEditing] = useState(false);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const text = controlled ? value : internal;
  const [draft, setDraft] = useState(text);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    field.current?.focus();
    // O texto ja vem selecionado: quem abre para trocar o valor inteiro - que e
    // o caso comum - digita por cima, e quem quer ajustar uma letra clica.
    field.current?.select();
  }, [editing]);

  function open() {
    setDraft(text);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (draft === text) return;
    if (!controlled) setInternal(draft);
    onValueChange?.(draft);
  }

  if (!editing) {
    return (
      <div {...props} className={cn("flex min-w-0", className)}>
        <button
          type="button"
          disabled={disabled}
          onClick={open}
          // O valor e o registro em si, e fechado ele mora numa linha que
          // corta. `text || undefined` de proposito: vazio mostra o
          // placeholder, que e texto do desenvolvedor e nao vira dica.
          title={text || undefined}
          className={cn(
            "min-w-0 truncate rounded-sm px-1 py-0.5 text-left text-base text-fg",
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
            "hover:bg-accent-subtle",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent",
            !text && "text-fg-subtle",
            classNames?.preview,
          )}
        >
          {text || placeholder}
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
            setDraft(text);
            setEditing(false);
          }
        }}
        className={cn(inputVariants({ size: "sm" }), "min-w-0", classNames?.input)}
      />
    </div>
  );
}
