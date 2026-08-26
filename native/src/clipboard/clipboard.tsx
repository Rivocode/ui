import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { setStringAsync } from "expo-clipboard";

import { cn } from "../cn";
import { useToast } from "../toast";

/**
 * Duas folhas encostadas, desenhadas com `View`.
 *
 * Glyph de fonte não serve para ícone — a fonte muda de corpo entre iOS e
 * Android e o traço não —, e é a mesma razão do olho do `PasswordInput` e do
 * visto do `Checkbox`.
 */
function CopyIcon() {
  return (
    <View className="h-4 w-4 items-end justify-end">
      <View className="absolute top-0 left-0 h-3 w-2.5 rounded-sm border border-fg-muted" />
      <View className="h-3 w-2.5 rounded-sm border border-fg-muted bg-surface" />
    </View>
  );
}

/** O mesmo visto do `Checkbox`: borda inferior e esquerda, girada. */
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

/**
 * Copiar um dado para levar a outro lugar: chave de acesso, CNPJ, id de
 * rastro, código Pix, número da nota.
 *
 * Vive em `@rivocode/ui-native/clipboard`, e não no índice da raiz, porque o
 * `expo-clipboard` é peer **opcional** e módulo nativo — quem só quer um
 * `Button` não deveria ligar e reconstruir um módulo que nunca usa.
 *
 * ## A confirmação é dupla aqui, e no web era só do botão
 *
 * A regra da peça não muda: copiar é a ação sem resultado visível, então sem
 * confirmação a pessoa toca de novo por dúvida. O que muda é **por onde a
 * confirmação chega**, e são dois canais porque no toque nenhum dos dois basta
 * sozinho:
 *
 * - **O botão**, como no web: o ícone vira visto e o nome acessível vira
 *   "Copiado". É a confirmação de quem enxerga — e é a que o dedo cobre, no
 *   caso mais comum de todos, que é o botão só de ícone ao lado de uma chave
 *   de 44 dígitos.
 * - **O aviso**, que o web não precisava ter: aqui, trocar o
 *   `accessibilityLabel` de um `Pressable` que já está sob o foco **não é
 *   reanunciado** por VoiceOver nem por TalkBack — o leitor leu o nome antes
 *   do toque e não volta a lê-lo. Quem não vê o ícone trocar não ficaria
 *   sabendo de nada. O `useToast` do `RivoProvider` desenha o aviso dentro de
 *   um `accessibilityLiveRegion="polite"`, que é o único canal desta tela que
 *   fala sozinho.
 *
 * A confirmação volta sozinha depois de `timeout`, senão o botão fica preso
 * num estado que já passou.
 *
 * ## Quando não confirma
 *
 * O `setStringAsync` devolve `false` quando a área de transferência recusa — é
 * o caso do passe web do Expo, sem permissão ou fora de contexto seguro; no
 * iOS e no Android ele sempre resolve `true`. Recusado, **nada é confirmado**:
 * mentir que copiou é pior do que não confirmar, porque a pessoa cola o que
 * tinha antes e só descobre no destino.
 *
 * ## Por que não é o `Button`
 *
 * O `Button` nativo embrulha os filhos num `<Text>`, e um ícone desenhado com
 * `View` não passa por ali. O desenho abaixo é o do `variant` dele, com os
 * mesmos papéis de token.
 */
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
  // Cada nome tem o próprio padrão, e não o objeto inteiro: trocar só o verbo
  // obrigava a reescrever a confirmação junto, e quem esquecia perdia o
  // "Copiado" sem o TypeScript acusar. Igual ao web.
  const { copy: copyLabel = "Copiar", copied: copiedLabel = "Copiado" } = labels;

  // O `RivoProvider` já é o preço de entrada de `Input`, `Spinner` e de todo
  // papel de cor lido em runtime; pedir o mesmo provider aqui não acrescenta
  // exigência nenhuma ao app.
  const { add } = useToast();

  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // O timer não pode sobreviver ao componente: um toque seguido de navegação
  // deixaria um setState em pé atrás de uma tela que já saiu.
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
      // O nome falado é o do estado de agora, também quando há texto ao lado:
      // o texto visível diz o mesmo, e deixar o `accessibilityLabel` de fora
      // faria o leitor ler o rótulo e o estado por caminhos diferentes.
      accessibilityLabel={spoken}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={copy}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-md",
        // Só de ícone o alvo é quadrado e cheio: 44px, o mínimo da Apple, sem
        // depender de hitSlop para chegar lá.
        children ? "h-11 px-4" : "h-11 w-11",
        CONTAINER[variant],
        disabled && "opacity-50",
        // A classe de quem usa vence a da peça, como no web.
        className,
      )}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {children ? <Text className="text-base font-medium text-fg">{spoken}</Text> : null}
    </Pressable>
  );
}
