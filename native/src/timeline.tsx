import { View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type TimelineTone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONE: Record<TimelineTone, string> = {
  neutral: "bg-border-strong",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export type TimelineEvent = {
  /** O que aconteceu: "Nota autorizada pela Sefaz". */
  title: string;
  /**
   * Quando aconteceu, já escrito: `formatDate(...)`, "12/03 às 14:20", "há 2
   * minutos".
   *
   * `string`, e não um `RelativeTime` como no web, e a razão é o leitor de
   * tela. Cada evento é uma parada só, e o rótulo dessa parada é montado aqui
   * a partir deste texto — um relógio vivo lá dentro continuaria se refazendo
   * na tela enquanto o rótulo ficaria preso no "há 2 minutos" de quando o
   * evento montou. Trilha de auditoria não pode dizer duas horas diferentes.
   */
  at?: string;
  /** Quem fez. Numa trilha de auditoria, é metade da informação. */
  by?: string;
  /** O detalhe embaixo do título, quando o título não basta. */
  description?: string;
  tone?: TimelineTone;
  /**
   * O que ainda não aconteceu: marcador vazado, texto apagado, e o leitor de
   * tela dizendo isso com todas as letras. Preencher o marcador de um evento
   * futuro faz a linha prometer que ele já ocorreu, que é exatamente o erro
   * que uma trilha de auditoria não pode cometer.
   */
  pending?: boolean;
  /** O que o leitor de tela anuncia. Por padrão, a frase montada com o resto. */
  accessibilityLabel?: string;
};

export type TimelineProps = {
  items: TimelineEvent[];
  /** O que a linha conta: "Histórico da nota 4471". */
  label?: string;
  className?: string;
};

function describe(event: TimelineEvent, position: number, total: number) {
  if (event.accessibilityLabel !== undefined) return event.accessibilityLabel;

  const parts = [`${position} de ${total}: ${event.title}`];
  if (event.pending === true) parts.push("ainda não aconteceu");
  if (event.at !== undefined) parts.push(event.at);
  if (event.by !== undefined) parts.push(`por ${event.by}`);

  const sentence = parts.join(", ");
  return event.description === undefined ? sentence : `${sentence}. ${event.description}`;
}

export function Timeline({ items, label, className }: TimelineProps) {
  if (items.length === 0) return null;

  return (
    <View accessibilityRole="list" accessibilityLabel={label} className={cn(className)}>
      {items.map((event, index) => {
        const isLast = index === items.length - 1;
        const pending = event.pending === true;

        return (
          <View
            accessible
            accessibilityLabel={describe(event, index + 1, items.length)}
            className="w-full flex-row gap-3"
            key={index}
          >
            <View className="w-2.5 items-center">
              <View
                className={cn(
                  "mt-1.5 h-2.5 w-2.5 rounded-pill",
                  pending ? "border-2 border-border-strong bg-bg" : TONE[event.tone ?? "neutral"],
                )}
              />
              {!isLast && <View className="mt-1 w-px flex-1 bg-border" />}
            </View>

            <View className={cn("flex-1 gap-0.5", !isLast && "pb-5")}>
              <Text className={cn("text-base", pending ? "text-fg-muted" : "text-fg")}>
                {event.title}
              </Text>

              {(event.at !== undefined || event.by !== undefined) && (
                <Text font="mono" className="text-xs text-fg-subtle">
                  {[event.at, event.by].filter((part) => part !== undefined).join(" · ")}
                </Text>
              )}

              {event.description !== undefined && (
                <Text className="text-sm text-fg-muted">{event.description}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
