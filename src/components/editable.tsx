"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { inputVariants } from "./field";

export type EditableProps = Omit<
  ComponentProps<"div">,
  "onChange" | "children" | "value" | "defaultValue"
> & {
  /** The current text, when the consumer keeps the value. */
  value?: string;
  /** The text of the first render, when the piece keeps its own value. */
  defaultValue?: string;
  /** Notified on Enter and on leaving the field, and never on Escape. */
  onValueChange?: (value: string) => void;
  /** What the screen reader calls the field while it is open. */
  label: string;
  /** What appears when the value is empty. */
  placeholder?: string;
  disabled?: boolean;
  /** Class per part: `preview`, `input`. */
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
  const [swapped, setSwapped] = useState(false);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const text = controlled ? value : internal;
  const [draft, setDraft] = useState(text);
  const field = useRef<HTMLInputElement>(null);
  const reading = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (!editing) {
      if (returnFocus.current) reading.current?.focus();
      returnFocus.current = false;
      return;
    }
    field.current?.focus();
    field.current?.select();
  }, [editing]);

  const swap = swapped && "animate-[rc-fade_var(--rc-duration-base)_var(--rc-ease)_both]";

  function open() {
    setDraft(text);
    setSwapped(true);
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
      <div key="reading" {...props} className={cn("flex min-w-0", swap, className)}>
        <button
          ref={reading}
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
    <div key="editing" {...props} className={cn("flex min-w-0", swap, className)}>
      <input
        ref={field}
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            returnFocus.current = true;
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            returnFocus.current = true;
            setDraft(text);
            setEditing(false);
          }
        }}
        className={cn(inputVariants({ size: "sm" }), "min-w-0", classNames?.input)}
      />
    </div>
  );
}
