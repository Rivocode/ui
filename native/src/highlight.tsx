import { cn, type Slots } from "./cn";
import { splitHighlight } from "./shared/highlight";
import { Text, type TextProps } from "./text";

export type HighlightProps = Omit<TextProps, "children"> & {
  /** The whole text, as a string. The highlight is computed over it. */
  children: string;
  /**
   * The searched term, or a list of them. Case and accents do not matter: "sao"
   * finds "São". Empty highlights nothing.
   */
  query: string | readonly string[];
  /** Class per part: `mark`, each match found, the nested `Text` that paints the background. */
  classNames?: Slots<"mark">;
};

export function Highlight({
  children,
  query,
  classNames,
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
            className={cn("bg-warning text-warning-fg", classNames?.mark)}
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
