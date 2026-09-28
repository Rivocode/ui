"use client";

import { Check, Copy } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

import { useClipboard } from "../hooks/clipboard";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";
import { IconButton } from "./icon-button";

export type ClipboardProps = Omit<
  ButtonProps,
  "children" | "onCopy" | "value" | "size" | "aria-label" | "aria-labelledby"
> & {
  /** What goes to the clipboard. */
  value: string;
  /**
   * Text beside the icon, replaced by `labels.copied` on confirmation. Without
   * it, the button is just the icon, drawn by `IconButton`.
   */
  children?: ReactNode;
  /**
   * The button's height, read from `--rc-control-*`. Without text, it is the side of the square.
   */
  size?: "sm" | "md" | "lg";
  /** How long the confirmation stays on screen, in ms. */
  timeout?: number;
  /**
   * What the screen reader calls the button before and after copying. With
   * `children`, the name before copying is the text itself, and only `copied` applies.
   */
  labels?: { copy?: string; copied?: string };
  /** Refused by the type: the button's name comes from `labels.copy` and `labels.copied`. */
  "aria-label"?: never;
  /** Refused by the type, for the same reason as `aria-label`. */
  "aria-labelledby"?: never;
  /** Called after copying, for those who want to fire their own notice. */
  onCopy?: (value: string) => void;
};

const CHECK: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "text-accent-fg",
  secondary: "text-success-text",
  ghost: "text-success-text",
  outline: "text-success-text",
  danger: "text-danger-fg",
};

export function Clipboard({
  value,
  children,
  timeout = 2000,
  labels = {},
  onCopy,
  onClick,
  variant = "secondary",
  size,
  className,
  ...props
}: ClipboardProps) {
  const { copy: copyLabel = "Copiar", copied: copiedLabel = "Copiado" } = labels;

  const clipboard = useClipboard({ timeout });
  const { copied } = clipboard;

  async function copy(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (await clipboard.copy(value)) onCopy?.(value);
  }

  const icon = copied ? (
    <Check
      size={14}
      aria-hidden="true"
      className={cn(
        "animate-[rc-fade_var(--rc-duration-base)_var(--rc-ease)_both]",
        CHECK[variant ?? "secondary"],
      )}
    />
  ) : (
    <Copy size={14} aria-hidden="true" />
  );

  if (!children) {
    return (
      <IconButton
        {...props}
        type="button"
        variant={variant}
        size={size ?? "sm"}
        onClick={copy}
        label={copied ? copiedLabel : copyLabel}
        className={className}
      >
        {icon}
      </IconButton>
    );
  }

  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      size={size ?? "sm"}
      onClick={copy}
      className={cn("gap-1.5", className)}
    >
      {icon}
      {copied ? copiedLabel : children}
    </Button>
  );
}
