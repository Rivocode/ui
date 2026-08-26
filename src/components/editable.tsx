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
