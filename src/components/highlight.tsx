import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { splitHighlight } from "../shared/highlight";

export type HighlightProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** O texto inteiro, como string. O destaque e calculado sobre ele. */
  children: string;
  /**
   * O termo buscado, ou uma lista deles. Caixa e acento nao importam: "sao"
   * acha "São". Vazio nao destaca nada, e dois termos que se encostam viram
   * um trecho so.
   */
  query: string | readonly string[];
  /** Classe por parte: `mark`, cada trecho achado. */
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
              "rounded-sm bg-warning-subtle font-rc-strong text-fg box-decoration-clone",
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
