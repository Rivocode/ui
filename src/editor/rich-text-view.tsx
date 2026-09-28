import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "../lib/cn";
import {
  isRichTextEmpty,
  richTextBlocks,
  type RichTextBlock,
  type RichTextInline,
  type RichTextJson,
} from "../shared/rich-text";
import { RICH_TEXT_CONTENT } from "./content";

export type RichTextViewProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /**
   * The saved content: the HTML that `RichTextEditor`'s `onValueChange`
   * handed over, or the JSON from `onJsonChange`. Neither of them becomes `innerHTML`:
   * the piece reads only the blocks and marks the editor writes and builds each one as a
   * React element, so `script`, an `on*` attribute and `style` have no way
   * in, and a link only comes out with `http`, `https`, `mailto`, `tel` or a relative
   * address.
   */
  value: string | RichTextJson | null | undefined;
  /**
   * What appears when the content has no text: `null`, an empty string or the
   * `<p></p>` of a blank editor. Without it, the piece draws nothing.
   */
  empty?: ReactNode;
  /**
   * The piece's texts, to change the language: `code` is the name the screen
   * reader hears on a code block that scrolls sideways. Pass only the ones that change.
   */
  labels?: Partial<RichTextViewLabels>;
  ref?: Ref<HTMLDivElement>;
};

export type RichTextViewLabels = {
  code: string;
};

const LABELS: RichTextViewLabels = { code: "Bloco de código" };

const Labels = createContext<RichTextViewLabels>(LABELS);

const WRAP = {
  code: (child: ReactNode, key: number) => <code key={key}>{child}</code>,
  strike: (child: ReactNode, key: number) => <s key={key}>{child}</s>,
  underline: (child: ReactNode, key: number) => <u key={key}>{child}</u>,
  italic: (child: ReactNode, key: number) => <em key={key}>{child}</em>,
  bold: (child: ReactNode, key: number) => <strong key={key}>{child}</strong>,
} as const;

const ORDER = ["code", "strike", "underline", "italic", "bold"] as const;

function inline(runs: RichTextInline[]) {
  if (runs.length === 0) return <br />;

  return runs.map((run, index) => {
    if (run.kind === "hardBreak") return <br key={index} />;

    let node: ReactNode = run.text;
    for (const style of ORDER) {
      if (run.styles.includes(style)) node = WRAP[style](node, index);
    }
    if (run.href) {
      node = (
        <a key={index} href={run.href} rel="noopener noreferrer nofollow">
          {node}
        </a>
      );
    }
    return node;
  });
}

function block(item: RichTextBlock, key: number): ReactNode {
  switch (item.kind) {
    case "paragraph":
      return <p key={key}>{inline(item.inline)}</p>;
    case "heading":
      return item.level === 2 ? (
        <h2 key={key}>{inline(item.inline)}</h2>
      ) : (
        <h3 key={key}>{inline(item.inline)}</h3>
      );
    case "bulletList":
      return (
        <ul key={key}>
          {item.items.map((blocks, index) => (
            <li key={index}>{blocks.map(block)}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} start={item.start === 1 ? undefined : item.start}>
          {item.items.map((blocks, index) => (
            <li key={index}>{blocks.map(block)}</li>
          ))}
        </ol>
      );
    case "blockquote":
      return <blockquote key={key}>{item.blocks.map(block)}</blockquote>;
    case "codeBlock":
      return <CodeBlock key={key} text={item.text} />;
    case "horizontalRule":
      return <hr key={key} />;
  }
}

function CodeBlock({ text }: { text: string }) {
  const labels = use(Labels);
  const ref = useRef<HTMLPreElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setOverflow(element.scrollWidth > element.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  return (
    <pre
      ref={ref}
      tabIndex={overflow ? 0 : undefined}
      role={overflow ? "region" : undefined}
      aria-label={overflow ? labels.code : undefined}
    >
      <code>{text}</code>
    </pre>
  );
}

export function RichTextView({ value, empty, labels, className, ...props }: RichTextViewProps) {
  const blocks = useMemo(() => richTextBlocks(value), [value]);
  const blank = isRichTextEmpty(blocks);

  if (blank && empty === undefined) return null;

  return (
    <div {...props} data-empty={blank || undefined} className={cn(RICH_TEXT_CONTENT, className)}>
      {blank ? empty : <Labels value={{ ...LABELS, ...labels }}>{blocks.map(block)}</Labels>}
    </div>
  );
}
