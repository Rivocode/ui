"use client";

import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type InputGroupProps = ComponentProps<"div"> & {
  /**
   * A altura da moldura, que precisa acompanhar a do campo de dentro. O Input
   * tem tres tamanhos e a moldura tinha um: um campo `sm` dentro dela saia com
   * o respiro do medio.
   */
  size?: "sm" | "md" | "lg";
};

const HEIGHT = {
  sm: "h-[var(--rc-control-sm)]",
  md: "h-[var(--rc-control-md)]",
  lg: "h-[var(--rc-control-lg)]",
} as const;

export function InputGroup({ className, size = "md", ...props }: InputGroupProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-md border border-border-strong bg-surface",
        HEIGHT[size],
        "font-sans text-base text-fg",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "focus-within:ring-offset-bg",
        "has-[[data-invalid]]:border-danger has-[[data-disabled]]:opacity-60",
        "[&_input]:h-full [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent",
        "[&_input]:px-[var(--rc-control-pad-md)] [&_input]:outline-none",
        "[&_input]:focus-visible:ring-0 [&_input]:focus-visible:ring-offset-0",
        className,
      )}
    />
  );
}

const ENCOSTO = cn(
  "flex shrink-0 items-center gap-2 px-[var(--rc-control-pad-md)]",
  "text-base text-fg-subtle select-none",
);

export function InputPrefix({ className, ...props }: ComponentProps<"span">) {
  return <span {...props} className={cn(ENCOSTO, "border-r border-border", className)} />;
}

export function InputSuffix({ className, ...props }: ComponentProps<"span">) {
  return <span {...props} className={cn(ENCOSTO, "border-l border-border", className)} />;
}

export function InputAction({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex shrink-0 items-center justify-center gap-2 border-l border-border px-3",
        "text-fg-muted transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-accent-subtle hover:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:-outline-offset-2",
        "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent",
        className,
      )}
    />
  );
}
