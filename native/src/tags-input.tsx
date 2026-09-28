import { useRef, useState, type ComponentRef } from "react";
import { Pressable, View, type TextInputProps } from "react-native";
import Animated from "react-native-reanimated";

import { cn, type Slots } from "./cn";
import { useMotion, useSettled } from "./motion";
import { useRivo } from "./provider";
import { Text, TextInput } from "./text";

export type TagsInputProps = Omit<TextInputProps, "value" | "onChangeText" | "className"> & {
  /** The current tags. The component is controlled: the app keeps the list. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /** What closes a tag besides Enter. Comma by default. */
  separators?: string[];
  /** Tag cap. Once reached, the field stops accepting. */
  max?: number;
  /**
   * What the screen reader hears on the component's buttons, as on the web and
   * in FilterChip. `remove` receives the tag.
   */
  labels?: { remove?: (tag: string) => string };
  invalid?: boolean;
  /** Styles the whole box, the same node as `classNames.field`. */
  className?: string;
  /**
   * Class per part: `field` (the box), `tag` (each tag), `remove` (the tag's X)
   * and `input` (the typing field).
   */
  classNames?: Slots<"field" | "tag" | "remove" | "input">;
};

function splitTags(text: string, separators: string[]) {
  const parts: string[] = [];
  let current = "";
  for (const char of text) {
    if (separators.includes(char)) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

export function TagsInput({
  value,
  onValueChange,
  separators = [","],
  max,
  labels = {},
  invalid,
  editable = true,
  onBlur,
  onFocus,
  className,
  classNames,
  ...props
}: TagsInputProps) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const { colors } = useRivo();
  const motion = useMotion();
  const settled = useSettled();

  const remove = labels.remove ?? ((tag: string) => `Remover ${tag}`);

  const full = max !== undefined && value.length >= max;

  function commit(incoming: string[]) {
    const next = [...value];
    for (const raw of incoming) {
      const tag = raw.trim();
      if (!tag || next.includes(tag)) continue;
      if (max !== undefined && next.length >= max) break;
      next.push(tag);
    }
    if (next.length !== value.length) onValueChange(next);
    setDraft("");
  }

  function handleChangeText(text: string) {
    const parts = splitTags(text, separators);
    if (parts.length === 1) {
      setDraft(text);
      return;
    }
    const rest = parts.pop() ?? "";
    commit(parts);
    setDraft(rest);
  }

  return (
    <Pressable
      accessible={false}
      accessibilityRole="none"
      onPress={() => input.current?.focus()}
      className={cn(
        "min-h-12 flex-row flex-wrap items-center gap-1.5 rounded-md border bg-surface p-2",
        invalid ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        !editable && "opacity-60",
        className,
        classNames?.field,
      )}
    >
      {value.map((tag) => (
        <Animated.View
          key={tag}
          entering={settled ? motion.popIn : undefined}
          exiting={motion.fadeOut}
          layout={motion.reflow}
          className={cn(
            "flex-row items-center gap-1.5 rounded-sm bg-accent-subtle py-1 pr-1.5 pl-2",
            classNames?.tag,
          )}
        >
          <Text className="text-sm text-fg">{tag}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={remove(tag)}
            accessibilityState={{ disabled: !editable }}
            disabled={!editable}
            onPress={() => onValueChange(value.filter((current) => current !== tag))}
            hitSlop={{ top: 4, bottom: 4, left: 6, right: 6 }}
            className={cn("size-4 items-center justify-center", classNames?.remove)}
          >
            <View className="absolute h-[1.5px] w-2.5 rotate-45 rounded-pill bg-fg-subtle" />
            <View className="absolute h-[1.5px] w-2.5 -rotate-45 rounded-pill bg-fg-subtle" />
          </Pressable>
        </Animated.View>
      ))}

      <TextInput
        {...props}
        ref={input}
        value={draft}
        editable={editable && !full}
        onChangeText={handleChangeText}
        onSubmitEditing={() => commit([draft])}
        submitBehavior="submit"
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          commit([draft]);
          onBlur?.(event);
        }}
        placeholderTextColor={colors["fg-subtle"]}
        className={cn("h-8 min-w-24 flex-1 text-base text-fg", classNames?.input)}
      />
    </Pressable>
  );
}
