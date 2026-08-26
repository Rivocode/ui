import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { setStringAsync } from "expo-clipboard";

import { cn } from "../cn";
import { useToast } from "../toast";

function CopyIcon() {
  return (
    <View className="h-4 w-4 items-end justify-end">
      <View className="absolute top-0 left-0 h-3 w-2.5 rounded-sm border border-fg-muted" />
      <View className="h-3 w-2.5 rounded-sm border border-fg-muted bg-surface" />
    </View>
  );
}

function CheckIcon() {
  return (
    <View className="h-4 w-4 items-center justify-center">
      <View className="mb-0.5 h-1.5 w-2.5 -rotate-45 border-b-2 border-l-2 border-success-text" />
    </View>
  );
}

export type ClipboardProps = {
  /** O que vai para a área de transferência. */
  value: string;
  /**
   * Liga o texto ao lado do ícone. Como no web, o conteúdo é ignorado: o que
   * aparece é `labels.copy` e depois `labels.copied`, senão o botão diria uma
   * coisa e anunciaria outra.
   */
  children?: string;
  /** Quanto tempo a confirmação fica no botão, em ms. */
  timeout?: number;
  /** O que o leitor de tela chama o botão antes e depois de copiar. */
  labels?: { copy?: string; copied?: string };
  /** Chamado depois de copiar, para quem quer disparar um aviso próprio. */
  onCopy?: (value: string) => void;
  /**
   * O aviso de "Copiado", ligado por padrão — veja o comentário da peça.
   * Desligue na tela que copia várias coisas seguidas e não quer uma pilha de
   * avisos, ou quando o próprio app já avisa por outro caminho.
   */
  toast?: boolean;
  /** Os dois papéis que um botão de copiar tem: ao lado do dado, ou solto. */
  variant?: "secondary" | "ghost";
  disabled?: boolean;
  className?: string;
};

const CONTAINER: Record<string, string> = {
  secondary: "bg-surface border border-border-strong active:bg-surface-raised",
  ghost: "active:bg-accent-subtle",
};

export function Clipboard({
  value,
  children,
  timeout = 2000,
  labels = {},
  onCopy,
  toast = true,
  variant = "secondary",
  disabled,
  className,
}: ClipboardProps) {
  const { copy: copyLabel = "Copiar", copied: copiedLabel = "Copiado" } = labels;

  const { add } = useToast();

  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      ok = await setStringAsync(value);
    } catch {
      ok = false;
    }

    if (!ok) return;

    setCopied(true);
    if (toast) add({ title: copiedLabel });
    onCopy?.(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), timeout);
  }

  const spoken = copied ? copiedLabel : copyLabel;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={copy}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-md",
        children ? "h-11 px-4" : "h-11 w-11",
        CONTAINER[variant],
        disabled && "opacity-50",
        className,
      )}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {children ? <Text className="text-base font-medium text-fg">{spoken}</Text> : null}
    </Pressable>
  );
}
