import { cn, type Slots } from "./cn";
import { splitHighlight } from "./shared/highlight";
import { Text, type TextProps } from "./text";

export type HighlightProps = Omit<TextProps, "children"> & {
  /** O texto inteiro, como string. O destaque e calculado sobre ele. */
  children: string;
  /**
   * O termo buscado, ou uma lista deles. Caixa e acento nao importam: "sao"
   * acha "São". Vazio nao destaca nada.
   */
  query: string | readonly string[];
  /** Classe por parte: `mark`, cada trecho achado, o `Text` aninhado que pinta o fundo. */
  classNames?: Slots<"mark">;
  /**
   * Obsoleta: a classe de cada trecho achado, hoje em `classNames.mark`.
   * @deprecated Use `classNames.mark`. Com os dois, as classes se somam e a de
   * `classNames.mark` vence.
   */
  markClassName?: string;
};

export function Highlight({
  children,
  query,
  classNames,
  markClassName,
  ...props
}: HighlightProps) {
  const chunks = splitHighlight(children, query);

  return (
    <Text {...props}>
      {chunks.map((chunk, index) =>
        chunk.match ? (
          <Text
            key={index}
            weight="semibold"
            className={cn("bg-warning text-warning-fg", markClassName, classNames?.mark)}
          >
            {chunk.text}
          </Text>
        ) : (
          chunk.text
        ),
      )}
    </Text>
  );
}
