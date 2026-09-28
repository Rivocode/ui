import { useState, type ReactNode } from "react";
import { View } from "react-native";

import { useAnnounce } from "../announce";
import { cn, type Slots } from "../cn";
import { IconButton } from "../icon-button";
import { useRivo } from "../provider";
import { PROMPT_INPUT_COUNT, type PromptInputLabels } from "../shared/ai";
import { Text, TextInput } from "../text";

const LINE = 24;

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

const LABELS: PromptInputLabels = {
  hint: "A tecla de retorno quebra a linha. Para enviar, use o botão de enviar.",
  submit: "Enviar mensagem",
  stop: "Parar resposta",
  ...PROMPT_INPUT_COUNT,
};

function SendGlyph({ color }: { color: string }) {
  return (
    <View className="size-4 items-center justify-center">
      <View className="absolute h-3.5 w-[2px] rounded-pill" style={{ backgroundColor: color }} />
      <View
        className="absolute top-0.5 size-2 -rotate-45 border-t-2 border-r-2"
        style={{ borderColor: color }}
      />
    </View>
  );
}

function StopGlyph({ color }: { color: string }) {
  return <View className="size-3 rounded-sm" style={{ backgroundColor: color }} />;
}

export type PromptInputProps = {
  /** The field text. Controlled, like every field in the package. */
  value: string;
  /** Called on every keystroke, with the whole text. */
  onValueChange: (value: string) => void;
  /**
   * Called by the send button, with the text. Does not fire when the field is
   * empty (whitespace alone counts as empty), disabled or `streaming`. The
   * caller clears the field.
   */
  onSubmit: (value: string) => void;
  /** The answer is arriving: the send button becomes the stop button. */
  streaming?: boolean;
  /** Called by the stop button, which exists only while `streaming`. */
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** The field name for the screen reader. Without it, "Mensagem". */
  label?: string;
  /** How many lines the field grows before it scrolls inside. Without it, 8. */
  maxRows?: number;
  /** The character cap. The field refuses what goes beyond it. */
  maxLength?: number;
  /** Shows the character count in the footer, in the danger tone when it hits the cap. */
  showCount?: boolean;
  /** The attachments already chosen, above the field. The component only reserves the space. */
  attachments?: ReactNode;
  /** The footer buttons, on the left: attach, dictate. */
  actions?: ReactNode;
  /**
   * The component's texts, to change the language: `submit` and `stop` are the
   * names of the send and stop buttons, `hint` the hint tied to the field,
   * `count` what is heard from the counter (also in the field hint) and `limit`
   * the announcement on hitting the cap. Pass only the ones that change.
   */
  labels?: Partial<PromptInputLabels>;
  className?: string;
  /**
   * Class per part: `attachments`, `textarea` (the field), `footer` (the bottom
   * row), `count` and `submit` (the send button, and the stop button in its
   * place).
   */
  classNames?: Slots<"attachments" | "textarea" | "footer" | "count" | "submit">;
};

export type { PromptInputLabels };

export function PromptInput({
  value,
  onValueChange,
  onSubmit,
  streaming = false,
  onStop,
  disabled = false,
  placeholder = "Escreva uma mensagem",
  label = "Mensagem",
  maxRows = 8,
  maxLength,
  showCount = false,
  attachments,
  actions,
  labels: labelsProp,
  className,
  classNames,
}: PromptInputProps) {
  const { colors } = useRivo();
  const [focused, setFocused] = useState(false);
  const labels = { ...LABELS, ...labelsProp };
  const blocked = disabled || streaming || value.trim() === "";
  const full = maxLength !== undefined && value.length >= maxLength;
  const hint = showCount ? `${labels.hint} ${labels.count(value.length, maxLength)}` : labels.hint;

  const limit = maxLength === undefined ? "" : labels.limit(maxLength);
  useAnnounce(full ? limit : null);

  return (
    <View
      className={cn(
        "w-full gap-2 rounded-lg border bg-surface p-2",
        focused ? "border-accent" : "border-border-strong",
        disabled && "opacity-50",
        className,
      )}
    >
      {attachments ? (
        <View className={cn("flex-row flex-wrap gap-2 px-1 pt-1", classNames?.attachments)}>
          {attachments}
        </View>
      ) : null}

      <TextInput
        multiline
        value={value}
        onChangeText={onValueChange}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={colors["fg-subtle"]}
        maxLength={maxLength}
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled }}
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ minHeight: LINE + 16, maxHeight: LINE * maxRows + 16 }}
        className={cn("px-2 py-2 text-base text-fg", classNames?.textarea)}
      />

      <View className={cn("flex-row items-center gap-2", classNames?.footer)}>
        <View className="flex-1 flex-row items-center gap-1">{actions}</View>

        {showCount ? (
          <Text
            {...HIDDEN}
            font="mono"
            className={cn(
              "text-xs",
              full ? "text-danger-text" : "text-fg-subtle",
              classNames?.count,
            )}
          >
            {maxLength === undefined ? String(value.length) : `${value.length}/${maxLength}`}
          </Text>
        ) : null}

        {streaming ? (
          <IconButton
            label={labels.stop}
            variant="secondary"
            size="sm"
            onPress={onStop}
            className={classNames?.submit}
          >
            {({ color }) => <StopGlyph color={color} />}
          </IconButton>
        ) : (
          <IconButton
            label={labels.submit}
            size="sm"
            disabled={blocked}
            onPress={() => {
              if (!blocked) onSubmit(value);
            }}
            className={classNames?.submit}
          >
            {({ color }) => <SendGlyph color={color} />}
          </IconButton>
        )}
      </View>
    </View>
  );
}
