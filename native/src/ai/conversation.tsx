import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { announce, spokenText } from "../announce";
import { Button } from "../button";
import { cn, type Slots } from "../cn";
import { EmptyState, type EmptyStateProps } from "../empty-state";
import { useReducedMotion } from "../motion";
import { STICK_DISTANCE } from "../shared/ai";

export type ConversationProps<Item> = {
  /** The messages, in arrival order: the newest last, as on the web. */
  items: Item[];
  /** Draws one message. Usually returns a `Message`. */
  renderItem: (item: Item, index: number) => ReactNode;
  keyExtractor: (item: Item, index: number) => string;
  /** The list's name for the screen reader. Without it, "Conversa". */
  label?: string;
  /**
   * What appears when `items` is empty. The `suggestions` become buttons, and a
   * tap hands the text to `onSuggestion`.
   */
  empty?: {
    title: string;
    description: string;
    icon?: EmptyStateProps["icon"];
    suggestions?: string[];
  };
  /** Called with the text of the tapped suggestion. Without it, the suggestions do not appear. */
  onSuggestion?: (suggestion: string) => void;
  /**
   * What VoiceOver says when a message arrives at the end of the list. Without
   * it, the plain text of what `renderItem` returns, and nothing while there is
   * `streaming`. `null` waits: the same message is announced when the sentence
   * arrives.
   */
  announcement?: (item: Item, index: number) => string | null | undefined;
  className?: string;
  /**
   * The component's texts, to change the language: `scroll` is the button that
   * goes back to the end of the conversation, "Ir para o fim" without it.
   */
  labels?: Partial<ConversationLabels>;
  /**
   * Class per part: `viewport` (the scrolling list), `content` (its content,
   * via `contentContainerClassName`), `empty`, `suggestions` (the row of
   * suggestions) and `scrollButton` (the go-to-end button).
   */
  classNames?: Slots<"viewport" | "content" | "empty" | "suggestions" | "scrollButton">;
};

type Listed<Item> = { item: Item; index: number };

export type ConversationLabels = {
  scroll: string;
};

export function Conversation<Item>({
  items,
  renderItem,
  keyExtractor,
  label = "Conversa",
  empty,
  onSuggestion,
  announcement,
  labels,
  className,
  classNames,
}: ConversationProps<Item>) {
  const scrollLabel = labels?.scroll ?? "Ir para o fim";
  const list = useRef<FlatList<Listed<Item>>>(null);
  const reduced = useReducedMotion();
  const [away, setAway] = useState(false);

  const lastIndex = items.length - 1;
  const lastKey = lastIndex < 0 ? null : keyExtractor(items[lastIndex] as Item, lastIndex);
  const heard = useRef(lastKey);

  useEffect(() => {
    if (lastKey === null || lastKey === heard.current) return;
    const item = items[lastIndex] as Item;
    const said = announcement
      ? announcement(item, lastIndex)
      : spokenText(renderItem(item, lastIndex));
    if (!said) return;
    heard.current = lastKey;
    announce(said, { liveRegion: true });
  });

  const newestFirst = useMemo(
    () => items.map((item, index) => ({ item, index })).reverse(),
    [items],
  );

  if (items.length === 0 && empty) {
    return (
      <View accessibilityLabel={label} className={cn("flex-1 justify-center", className)}>
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          className={classNames?.empty}
          action={
            empty.suggestions?.length && onSuggestion ? (
              <View
                className={cn("flex-row flex-wrap justify-center gap-2", classNames?.suggestions)}
              >
                {empty.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="secondary"
                    size="sm"
                    onPress={() => onSuggestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </View>
            ) : undefined
          }
        />
      </View>
    );
  }

  function scroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setAway(event.nativeEvent.contentOffset.y > STICK_DISTANCE);
  }

  function jump() {
    setAway(false);
    list.current?.scrollToOffset({ offset: 0, animated: !reduced });
  }

  return (
    <View className={cn("flex-1", className)}>
      <FlatList
        ref={list}
        inverted
        data={newestFirst}
        keyExtractor={(entry) => keyExtractor(entry.item, entry.index)}
        renderItem={({ item: entry }) => (
          <View className="px-1 py-3">{renderItem(entry.item, entry.index)}</View>
        )}
        onScroll={scroll}
        scrollEventThrottle={64}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={away ? { minIndexForVisible: 0 } : undefined}
        accessibilityLabel={label}
        accessibilityLiveRegion="polite"
        className={classNames?.viewport}
        contentContainerClassName={classNames?.content}
      />

      {away ? (
        <View className="absolute bottom-3 w-full items-center" pointerEvents="box-none">
          <Button variant="secondary" size="sm" onPress={jump} className={classNames?.scrollButton}>
            {scrollLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
