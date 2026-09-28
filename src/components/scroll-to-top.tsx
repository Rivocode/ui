"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useReducedMotion } from "../hooks/environment";
import { cn } from "../lib/cn";
import { focusLandmark } from "../lib/focus";
import type { Slots } from "../lib/slots";
import { Affix, type AffixProps } from "./affix";
import { IconButton, type IconButtonProps } from "./icon-button";

export type ScrollToTopProps = Omit<AffixProps, "children" | "onClick"> & {
  /**
   * How many pixels the person needs to scroll down for the button to appear. Before that it does
   * not even exist.
   */
  threshold?: number;
  /**
   * The scrolling box, when it is not the window. Pass the element, not the ref:
   * `const [caixa, setCaixa] = useState<HTMLElement | null>(null)`.
   */
  target?: HTMLElement | null;
  /**
   * Where focus goes after scrolling up. Without it, the `target` box; without
   * `target`, the page's `<main>`, and without `<main>`, the `<body>`. Focus cannot
   * stay on the button, which disappears as soon as the page reaches the top.
   */
  focusTarget?: HTMLElement | null;
  /** The button's name, which the screen reader announces and the tooltip shows. */
  label?: string;
  /** The icon. Without it, the up arrow. */
  icon?: ReactNode;
  /** Shows `label` in a tooltip on pointer hover or keyboard focus. */
  tooltip?: boolean;
  /** The side of the button's square, read from `--rc-control-*`. */
  size?: IconButtonProps["size"];
  /** The `Button` variant underneath. `secondary` reads over any background. */
  variant?: IconButtonProps["variant"];
  /** Called after the scroll up has started and focus has already moved. */
  onScrollToTop?: () => void;
  classNames?: Slots<"button">;
};

function offsetOf(target: HTMLElement | null | undefined) {
  if (target) return target.scrollTop;
  return typeof window === "undefined" ? 0 : window.scrollY;
}

export function ScrollToTop({
  threshold = 400,
  target,
  focusTarget,
  label = "Voltar ao topo",
  icon,
  tooltip = false,
  size = "md",
  variant = "secondary",
  onScrollToTop,
  className,
  classNames,
  ...props
}: ScrollToTopProps) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const source: HTMLElement | Window = target ?? window;
    const update = () => setVisible(offsetOf(target) > threshold);
    update();
    source.addEventListener("scroll", update, { passive: true });
    return () => source.removeEventListener("scroll", update);
  }, [target, threshold]);

  if (!visible) return null;

  function climb() {
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    if (target) target.scrollTo?.({ top: 0, behavior });
    else window.scrollTo?.({ top: 0, behavior });

    const destination =
      focusTarget ?? target ?? document.querySelector<HTMLElement>("main") ?? document.body;
    focusLandmark(destination);
    onScrollToTop?.();
  }

  return (
    <Affix {...props} className={className}>
      <IconButton
        type="button"
        label={label}
        tooltip={tooltip}
        size={size}
        variant={variant}
        shape="pill"
        onClick={climb}
        className={cn("animate-pop shadow-2", classNames?.button)}
      >
        {icon ?? <ArrowUp />}
      </IconButton>
    </Affix>
  );
}
