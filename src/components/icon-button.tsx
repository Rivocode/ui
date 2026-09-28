"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";
import { Tooltip, TooltipContent } from "./tooltip";

const SQUARE = {
  sm: "size-[var(--rc-control-sm)] p-0 [&_svg]:size-4",
  md: "size-[var(--rc-control-md)] p-0 [&_svg]:size-4",
  lg: "size-[var(--rc-control-lg)] p-0 [&_svg]:size-5",
} as const;

export type IconButtonProps = Omit<
  ButtonProps,
  "size" | "children" | "aria-label" | "aria-labelledby"
> & {
  /**
   * The button's name, required: it is what the screen reader announces, and the text
   * of the tooltip when `tooltip` is on. State the action ("Excluir nota"), not the
   * drawing ("Lixeira").
   */
  label: string;
  /** Refused by the type: the accessible name has a single path, which is `label`. */
  "aria-label"?: never;
  /** Refused by the type, for the same reason as `aria-label`. */
  "aria-labelledby"?: never;
  /** The icon, alone. It is rendered `aria-hidden`, because `label` is what names it. */
  children: ReactNode;
  /** The side of the square, read from `--rc-control-*`: shrinks with density. */
  size?: "sm" | "md" | "lg";
  /**
   * Shows `label` in a tooltip on pointer hover or keyboard focus.
   * Turn it on when the icon is not universal; the tooltip does not go into the name, which already
   * is `label`, so the screen reader does not hear the same sentence twice.
   */
  tooltip?: boolean;
  /** The side the tooltip opens on, when `tooltip` is on. Without it, on top. */
  tooltipSide?: "top" | "bottom" | "left" | "right";
};

export function IconButton({
  label,
  children,
  size = "md",
  tooltip = false,
  tooltipSide,
  loading = false,
  className,
  ...props
}: IconButtonProps) {
  const button: ReactElement = (
    <Button
      {...props}
      size={null}
      loading={loading}
      aria-label={label}
      className={cn(SQUARE[size], "[&_svg]:shrink-0", className)}
    >
      {loading ? null : (
        <span aria-hidden="true" className="contents">
          {children}
        </span>
      )}
    </Button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <BaseTooltip.Trigger render={button} />
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
