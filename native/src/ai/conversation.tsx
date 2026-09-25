import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { announce, spokenText } from "../announce";
import { Button } from "../button";
import { cn } from "../cn";
import { EmptyState, type EmptyStateProps } from "../empty-state";
import { useReducedMotion } from "../motion";
import { STICK_DISTANCE } from "../shared/ai";

export type ConversationProps<Item> = {
  /** As mensagens, em ordem de chegada: a mais nova por ultimo, como no web. */
  items: Item[];
  /** Desenha uma mensagem. Costuma devolver um `Message`. */
  renderItem: (item: Item, index: number) => ReactNode;
  keyExtractor: (item: Item, index: number) => string;
  /** O nome da lista para o leitor de tela. Sem ele, "Conversa". */
  label?: string;
  /**
   * O que aparece quando `items` esta vazio. As `suggestions` viram botoes, e o
   * toque entrega o texto ao `onSuggestion`.
   */
  empty?: {
    title: string;
    description: string;
    icon?: EmptyStateProps["icon"];
    suggestions?: string[];
  };
  /** Chamado com o texto da sugestao tocada. Sem ele, as sugestoes nao aparecem. */
  onSuggestion?: (suggestion: string) => void;
  /** O texto do botao que volta ao fim da conversa. Sem ele, "Ir para o fim". */
  scrollLabel?: string;
  /**
   * O que o VoiceOver diz quando uma mensagem chega ao fim da lista. Sem ele, o
   * texto solto do que `renderItem` devolve, e nada enquanto houver `streaming`.
   * `null` espera: a mesma mensagem e anunciada quando a frase chegar.
   */
  announcement?: (item: Item, index: number) => string | null | undefined;
  className?: string;
};

type Listed<Item> = { item: Item; index: number };

export function Conversation<Item>({
  items,
  renderItem,
  keyExtractor,
  label = "Conversa",
  empty,
  onSuggestion,
  scrollLabel = "Ir para o fim",
  announcement,
  className,
}: ConversationProps<Item>) {
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
          action={
            empty.suggestions?.length && onSuggestion ? (
              <View className="flex-row flex-wrap justify-center gap-2">
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
      />

      {away ? (
        <View className="absolute bottom-3 w-full items-center" pointerEvents="box-none">
          <Button variant="secondary" size="sm" onPress={jump}>
            {scrollLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
