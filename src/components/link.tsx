import { useRender } from "@base-ui/react/use-render";
import { ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactElement, Ref } from "react";

import { cn } from "../lib/cn";

export type LinkTone = "accent" | "neutral" | "muted" | "inherit";

const TONE: Record<LinkTone, string> = {
  accent: "text-accent-text",
  neutral: "text-fg",
  muted: "text-fg-muted hover:text-fg",
  inherit: "",
};

const SAFE_REL = ["noopener", "noreferrer"];

export type LinkProps = ComponentPropsWithoutRef<"a"> & {
  /**
   * The color role. `accent` is the standalone link on the page; `neutral` and `muted`
   * serve a list of links and the footer; `inherit` takes the sentence's color, and is
   * what goes inside an `Alert`, where the tone's color was already measured against
   * its background.
   */
  tone?: LinkTone;
  /**
   * `always` always underlines, and is what the page needs when the link lives
   * in the middle of a sentence: color alone is not enough for someone who cannot tell the
   * color apart. `hover` only underlines on hover, and only applies outside running text, in a
   * list in which the position already says that it is a link.
   */
  underline?: "always" | "hover";
  /**
   * Opens in another tab, with `rel="noopener noreferrer"`, draws the exit
   * arrow and tells the screen reader with `labels.external`.
   */
  external?: boolean;
  /**
   * Swaps the element while keeping the look, for the router's link:
   * `<Link render={<RouterLink to="/notas" />}>`. The `href`, the focus and the
   * navigation become the router's; the drawing stays this piece's.
   */
  render?: ReactElement;
  ref?: Ref<HTMLAnchorElement>;
  /**
   * The piece's texts, to change the language: `external` is the notice the screen
   * reader hears after the text of an `external` link, "(abre em nova aba)"
   * without it.
   */
  labels?: Partial<LinkLabels>;
};

export type LinkLabels = {
  external: string;
};

export function Link({
  tone = "accent",
  underline = "always",
  external = false,
  render,
  labels,
  className,
  children,
  target,
  rel,
  ...props
}: LinkProps) {
  const externalLabel = labels?.external ?? "(abre em nova aba)";
  const safeRel = external
    ? [...new Set([...(rel?.split(/\s+/).filter(Boolean) ?? []), ...SAFE_REL])].join(" ")
    : rel;

  return useRender({
    render: render ?? <a />,
    props: {
      ...props,
      target: external ? (target ?? "_blank") : target,
      rel: safeRel,
      "data-external": external || undefined,
      className: cn(
        "rounded-sm box-decoration-clone underline-offset-[0.2em] decoration-1",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        underline === "always" ? "underline hover:decoration-2" : "no-underline hover:underline",
        TONE[tone],
        className,
      ),
      children: external ? (
        <>
          {children}
          <ArrowUpRight
            aria-hidden="true"
            className="-mr-[0.2em] ml-0.5 inline-block size-[0.9em] shrink-0 align-[-0.1em]"
          />
          <span className="sr-only">{` ${externalLabel}`}</span>
        </>
      ) : (
        children
      ),
    },
  });
}
