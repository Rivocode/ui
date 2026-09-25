"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { useArrivals } from "../lib/arrivals";
import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { inputVariants } from "./field";

export type TagsInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "max"
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
  /** Classe por parte: `field`, `tag`, `remove`, `input`. */
  classNames?: Slots<"field" | "tag" | "remove" | "input">;
};

export function TagsInput({
  value,
  defaultValue = [],
  onValueChange,
  separators = [","],
  max,
  labels = {},
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

  const remove = labels.remove ?? ((tag: string) => `Remover ${tag}`);

  const removers = useRef(new Map<string, HTMLButtonElement>());
  const field = useRef<HTMLInputElement>(null);
  const focusAfterRemoval = useRef<string | null | undefined>(undefined);

  useLayoutEffect(() => {
    const target = focusAfterRemoval.current;
    if (target === undefined) return;
    focusAfterRemoval.current = undefined;
    const neighbor = target === null ? undefined : removers.current.get(target);
    (neighbor ?? field.current)?.focus();
  }, [tags]);

  function removeAt(index: number) {
    focusAfterRemoval.current = tags[index + 1] ?? tags[index - 1] ?? null;
    change(tags.filter((_, current) => current !== index));
  }

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
      event.preventDefault();
      add(draft);
      return;
    }

    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      change(tags.slice(0, -1));
    }
  }

  const arrived = useArrivals(tags);

  return (
    <div
      className={cn(
        inputVariants(),
        "flex h-auto min-h-[var(--rc-control-md)] flex-wrap items-center gap-1.5",
        "px-[var(--rc-control-pad-md)] py-1.5",
        "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring",
        "has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-bg",
        "has-[[data-invalid]]:border-danger",
        disabled && "cursor-not-allowed border-border-disabled bg-surface-raised text-fg-disabled",
        classNames?.field,
        className,
      )}
    >
      {tags.map((tag, index) => (
        <span
          key={tag}
          className={cn(
            "flex items-center gap-1 rounded-sm bg-accent-subtle px-1.5 py-0.5",
            arrived(tag) && "animate-pop",
            "text-sm text-fg",
            classNames?.tag,
          )}
        >
          {tag}
          <button
            type="button"
            aria-label={remove(tag)}
            disabled={disabled}
            ref={(node) => {
              if (node) removers.current.set(tag, node);
              else removers.current.delete(tag);
            }}
            onClick={() => removeAt(index)}
            className={cn(
              "relative text-fg-subtle transition-colors duration-[var(--rc-duration-fast)] ease-rc hover:text-fg",
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
        ref={field}
        render={<input />}
        value={draft}
        disabled={disabled || full}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
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
