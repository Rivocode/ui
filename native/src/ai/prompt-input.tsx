import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";

import { cn } from "../cn";
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
  hint: "Enter quebra a linha. Para enviar, use o botão de enviar.",
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
  /** O texto do campo. Controlado, como todo campo do pacote. */
  value: string;
  /** Chamado a cada tecla, com o texto inteiro. */
  onValueChange: (value: string) => void;
  /**
   * Chamado pelo botao de enviar, com o texto. Nao dispara com o campo vazio
   * (so espaco conta como vazio), desabilitado ou em `streaming`. Quem limpa o
   * campo e quem chamou.
   */
  onSubmit: (value: string) => void;
  /** A resposta esta chegando: o botao de enviar vira o de parar. */
  streaming?: boolean;
  /** Chamado pelo botao de parar, que so existe em `streaming`. */
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** O nome do campo para o leitor de tela. Sem ele, "Mensagem". */
  label?: string;
  /** O nome do botao de enviar. Sem ele, "Enviar mensagem". */
  submitLabel?: string;
  /** O nome do botao de parar. Sem ele, "Parar resposta". */
  stopLabel?: string;
  /** Quantas linhas o campo cresce antes de rolar por dentro. Sem ele, 6. */
  maxRows?: number;
  /** O teto de caracteres. O campo recusa o que passa dele. */
  maxLength?: number;
  /** Mostra a contagem de caracteres no rodape, no tom de perigo ao bater no teto. */
  showCount?: boolean;
  /** Os anexos ja escolhidos, acima do campo. A peca so reserva o lugar. */
  attachments?: ReactNode;
  /** Os botoes do rodape, a esquerda: anexar, ditar. */
  actions?: ReactNode;
  /**
   * Os textos que o leitor de tela ouve, para trocar o idioma: `hint` e a dica
   * ligada ao campo, `count` o que se ouve do contador (tambem na dica do campo)
   * e `limit` o anuncio ao bater no teto. Passe so os que mudam.
   */
  labels?: Partial<PromptInputLabels>;
  className?: string;
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
  submitLabel = "Enviar mensagem",
  stopLabel = "Parar resposta",
  maxRows = 6,
  maxLength,
  showCount = false,
  attachments,
  actions,
  labels: labelsProp,
  className,
}: PromptInputProps) {
  const { colors } = useRivo();
  const [focused, setFocused] = useState(false);
  const labels = { ...LABELS, ...labelsProp };
  const blocked = disabled || streaming || value.trim() === "";
  const full = maxLength !== undefined && value.length >= maxLength;
  const hint = showCount ? `${labels.hint} ${labels.count(value.length, maxLength)}` : labels.hint;

  const limit = maxLength === undefined ? "" : labels.limit(maxLength);
  const wasFull = useRef(full);
  useEffect(() => {
    if (full && !wasFull.current) AccessibilityInfo.announceForAccessibility(limit);
    wasFull.current = full;
  }, [full, limit]);

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
        <View className="flex-row flex-wrap gap-2 px-1 pt-1">{attachments}</View>
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
        className="px-2 py-2 text-base text-fg"
      />

      <View className="flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center gap-1">{actions}</View>

        {showCount ? (
          <Text
            {...HIDDEN}
            font="mono"
            className={cn("text-xs", full ? "text-danger-text" : "text-fg-subtle")}
          >
            {maxLength === undefined ? String(value.length) : `${value.length}/${maxLength}`}
          </Text>
        ) : null}

        {streaming ? (
          <IconButton accessibilityLabel={stopLabel} variant="secondary" size="sm" onPress={onStop}>
            {({ color }) => <StopGlyph color={color} />}
          </IconButton>
        ) : (
          <IconButton
            accessibilityLabel={submitLabel}
            size="sm"
            disabled={blocked}
            onPress={() => {
              if (!blocked) onSubmit(value);
            }}
          >
            {({ color }) => <SendGlyph color={color} />}
          </IconButton>
        )}
      </View>
    </View>
  );
}
