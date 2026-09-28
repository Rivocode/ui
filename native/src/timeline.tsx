import { View } from "react-native";

import { cn } from "./cn";
import { Entrance } from "./motion";
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
  /** What happened: "Nota autorizada pela Sefaz". */
  title: string;
  /**
   * When it happened, already written: `formatDate(...)`, "12/03 às 14:20", "há
   * 2 minutos". `string`, and not a `RelativeTime` as on the web, and the
   * reason is the screen reader. Each event is a single stop, and the label of
   * that stop is built here from this text: a live clock inside would keep
   * re-rendering on screen while the label stayed stuck at the "há 2 minutos"
   * from when the event mounted. An audit trail cannot state two different
   * times.
   */
  at?: string;
  /** Who did it. In an audit trail, it is half the information. */
  by?: string;
  /** The detail below the title, when the title is not enough. */
  description?: string;
  tone?: TimelineTone;
  /**
   * What has not happened yet: hollow marker, dimmed text, and the screen
   * reader saying so in so many words. Filling the marker of a future event
   * makes the line promise it already happened, which is exactly the mistake an
   * audit trail cannot make.
   */
  pending?: boolean;
  /** What the screen reader announces. By default, the sentence built from the rest. */
  accessibilityLabel?: string;
};

export type TimelineProps = {
  items: TimelineEvent[];
  /** What the line tells: "Histórico da nota 4471". */
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
    <Entrance
      effect="fadeIn"
      accessibilityRole="list"
      accessibilityLabel={label}
      className={cn(className)}
    >
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
    </Entrance>
  );
}
