import { useMemo, type ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Heading } from "./heading";
import { Link } from "./link";
import {
  isRichTextEmpty,
  richTextBlocks,
  type RichTextBlock,
  type RichTextInline,
  type RichTextJson,
} from "./shared/rich-text";
import { Text, type TextTone } from "./text";

export type RichTextViewProps = {
  /**
   * O conteudo salvo pelo `RichTextEditor` do web: o HTML do `onValueChange`
   * ou o JSON do `onJsonChange`. Os dois sao lidos pelo mesmo leitor do web,
   * sem `WebView` e sem peer: cada bloco vira `View` e cada marca vira `Text`,
   * entao nada do conteudo executa, e link so abre com `http`, `https`,
   * `mailto`, `tel` ou endereco relativo.
   */
  value: string | RichTextJson | null | undefined;
  /**
   * O que aparece quando o conteudo nao tem texto: `null`, string vazia ou o
   * `<p></p>` de um editor em branco. Sem ele, a peca nao desenha nada.
   */
  empty?: ReactNode;
  className?: string;
};

const STYLE = {
  bold: "font-bold",
  italic: "italic",
  underline: "underline",
  strike: "line-through",
  code: "rounded-sm bg-surface-raised text-fg-muted",
} as const;

function inline(runs: RichTextInline[], tone: TextTone) {
  if (runs.length === 0) return " ";

  return runs.map((run, index) => {
    if (run.kind === "hardBreak") return "\n";

    const code = run.styles.includes("code");
    const className = cn(...run.styles.map((style) => STYLE[style]));

    if (run.href) {
      return (
        <Link key={index} href={run.href} className={className}>
          {run.text}
        </Link>
      );
    }

    if (run.styles.length === 0) return run.text;

    return (
      <Text key={index} font={code ? "mono" : "sans"} tone={code ? undefined : tone} className={className}>
        {run.text}
      </Text>
    );
  });
}

function block(item: RichTextBlock, key: number, tone: TextTone): ReactNode {
  switch (item.kind) {
    case "paragraph":
      return (
        <Text key={key} size="base" tone={tone}>
          {inline(item.inline, tone)}
        </Text>
      );
    case "heading":
      return (
        <Heading key={key} level={item.level}>
          {inline(item.inline, "neutral")}
        </Heading>
      );
    case "bulletList":
    case "orderedList":
      return (
        <View key={key} className="gap-1">
          {item.items.map((blocks, index) => (
            <View key={index} className="flex-row gap-2">
              <Text size="base" tone="subtle" className="min-w-5 text-right">
                {item.kind === "bulletList" ? "•" : `${item.start + index}.`}
              </Text>
              <View className="flex-1 gap-1">
                {blocks.map((child, position) => block(child, position, tone))}
              </View>
            </View>
          ))}
        </View>
      );
    case "blockquote":
      return (
        <View key={key} className="gap-2 border-l-2 border-border-strong pl-4">
          {item.blocks.map((child, position) => block(child, position, "muted"))}
        </View>
      );
    case "codeBlock":
      return (
        <View key={key} className="rounded-lg border border-border bg-surface-raised p-3">
          <Text font="mono" selectable className="text-xs text-fg">
            {item.text}
          </Text>
        </View>
      );
    case "horizontalRule":
      return <View key={key} className="my-4 h-px bg-border" />;
  }
}

export function RichTextView({ value, empty, className }: RichTextViewProps) {
  const blocks = useMemo(() => richTextBlocks(value), [value]);

  if (isRichTextEmpty(blocks)) {
    if (empty === undefined) return null;
    return (
      <View className={className}>
        {typeof empty === "string" ? (
          <Text size="base" tone="muted">
            {empty}
          </Text>
        ) : (
          empty
        )}
      </View>
    );
  }

  return (
    <View className={cn("gap-3", className)}>
      {blocks.map((item, index) => block(item, index, "neutral"))}
    </View>
  );
}
