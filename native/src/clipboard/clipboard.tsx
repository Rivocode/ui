import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { setStringAsync } from "expo-clipboard";

import { BUTTON_CONTAINER, BUTTON_LABEL, type ButtonVariant } from "../button";
import { cn } from "../cn";
import { Text } from "../text";
import { useToast } from "../toast";

const ICON: Record<ButtonVariant, { copy: string; fill: string; check: string }> = {
  primary: { copy: "border-accent-fg", fill: "bg-accent", check: "border-accent-fg" },
  secondary: { copy: "border-fg-muted", fill: "bg-surface", check: "border-success-text" },
  ghost: { copy: "border-fg-muted", fill: "bg-surface", check: "border-success-text" },
  outline: { copy: "border-fg-muted", fill: "bg-surface", check: "border-success-text" },
  destructive: { copy: "border-danger-fg", fill: "bg-danger", check: "border-danger-fg" },
};

function CopyIcon({ variant }: { variant: ButtonVariant }) {
  const { copy, fill } = ICON[variant];
  return (
    <View className="h-4 w-4 items-end justify-end">
      <View className={cn("absolute top-0 left-0 h-3 w-2.5 rounded-sm border", copy)} />
      <View className={cn("h-3 w-2.5 rounded-sm border", copy, fill)} />
    </View>
  );
}

function CheckIcon({ variant }: { variant: ButtonVariant }) {
  return (
    <View className="h-4 w-4 items-center justify-center">
      <View
        className={cn("mb-0.5 h-1.5 w-2.5 -rotate-45 border-b-2 border-l-2", ICON[variant].check)}
      />
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
   * O aviso de "Copiado", ligado por padrão. Veja o comentário da peça.
   * Desligue na tela que copia várias coisas seguidas e não quer uma pilha de
   * avisos, ou quando o próprio app já avisa por outro caminho.
   */
  toast?: boolean;
  /**
   * O desenho do botao, com os mesmos nomes e o mesmo visual do `Button`. Nos
   * preenchidos (`primary` e `destructive`) o visto da confirmacao usa a tinta
   * do rotulo, porque o verde de sucesso nao se le sobre o fundo deles.
   */
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
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
        BUTTON_CONTAINER[variant],
        disabled && "opacity-50",
        className,
      )}
    >
      {copied ? <CheckIcon variant={variant} /> : <CopyIcon variant={variant} />}
      {children ? (
        <Text className={cn("text-base font-rc-medium", BUTTON_LABEL[variant])}>{spoken}</Text>
      ) : null}
    </Pressable>
  );
}
