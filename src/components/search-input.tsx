"use client";

import { Search } from "lucide-react";
import type { ComponentProps, KeyboardEvent } from "react";

import { cn } from "../lib/cn";
import { Kbd } from "./kbd";

export type SearchInputProps = Omit<ComponentProps<"input">, "size" | "type"> & {
  /**
   * The field's height. The input's native `size` is a number and is dropped, as in
   * `Input`: here the variant carries the meaning. It exists because a
   * search next to a `Select size="sm"` in a filter bar came out taller
   * than its siblings, and the whole bar ended up crooked.
   */
  size?: "sm" | "md" | "lg";
  /**
   * The shortcut that opens or focuses the search, shown in a `Kbd` inside the field:
   * `"mod+k"`. Only the drawing - registering the shortcut is the job of whoever builds the
   * screen, because it is the screen that knows what else listens to the keyboard.
   */
  shortcut?: string;
  /**
   * Called on Esc. Without it, Esc clears the field through its own `onChange`, and a controlled
   * field clears when the consumer accepts the empty text.
   */
  onClear?: () => void;
  /**
   * Receives the text on every keystroke, as in `Input` and the native SearchInput. Without
   * `onClear`, Esc calls it with `""`. Coexists with `onChange`.
   */
  onValueChange?: (value: string) => void;
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
  onChange,
  onValueChange,
  ...props
}: SearchInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if (onClear) {
      onClear();
      return;
    }
    const input = event.currentTarget;
    if (input.value === "") {
      onValueChange?.("");
      return;
    }
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setValue?.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
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
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
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
