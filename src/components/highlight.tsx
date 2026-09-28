import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { splitHighlight } from "../shared/highlight";

export type HighlightProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** The whole text, as a string. The highlight is computed over it. */
  children: string;
  /**
   * The searched term, or a list of them. Case and accents do not matter: "sao"
   * finds "São". Empty highlights nothing, and two terms that touch become
   * a single stretch.
   */
  query: string | readonly string[];
  /** Class per part: `mark`, each stretch found. */
  classNames?: Slots<"mark">;
};

export function Highlight({ children, query, className, classNames, ...props }: HighlightProps) {
  const chunks = splitHighlight(children, query);

  return (
    <span {...props} className={className}>
      {chunks.map((chunk, index) =>
        chunk.match ? (
          <mark
            key={index}
            className={cn(
              "rounded-sm bg-warning font-rc-strong text-warning-fg box-decoration-clone",
              classNames?.mark,
            )}
          >
            {chunk.text}
          </mark>
        ) : (
          chunk.text
        ),
      )}
    </span>
  );
}
