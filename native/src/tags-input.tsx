import { useRef, useState, type ComponentRef } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";

export type TagsInputProps = Omit<
  TextInputProps,
  "value" | "onChangeText" | "className"
> & {
  /** As fichas de agora. A peça é controlada: quem guarda a lista é o app. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /** O que fecha uma ficha além do Enter. Vírgula por padrão. */
  separators?: string[];
  /** Teto de fichas. Alcançado, o campo para de aceitar. */
  max?: number;
  /** O que o leitor de tela ouve no botão de cada ficha. */
  removeLabel?: (tag: string) => string;
  invalid?: boolean;
  /** Veste a caixa toda. O campo de digitar é `inputClassName`. */
  className?: string;
  inputClassName?: string;
};

/**
 * Corta o que foi digitado nos separadores, à mão e não por expressão: a
 * lista vem de quem chama, e montar expressão com texto de fora pede escapar
 * cada caractere para um ganho de nada.
 */
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

/**
 * Lista de marcadores que a pessoa escreve: etiquetas de uma nota, palavras
 * de um filtro, emails de um convite.
 *
 * Não é `Combobox`. O combobox escolhe de uma lista que existe; aqui a lista
 * nasce do que se digita, e não há o que sugerir.
 *
 * Dois gestos do web atravessam e um não. O Enter fecha a ficha (por
 * `onSubmitEditing`, sem soltar o teclado) e o separador digitado também -
 * mas ele é lido no TEXTO, e não na tecla: o `onKeyPress` do Android não
 * chega para o teclado do sistema, e escutar tecla no toque é escutar o que
 * às vezes não é dito. O que não atravessa é o Backspace com o campo vazio
 * tirando a última: o mesmo `onKeyPress` que falta é o que o sustentaria, e
 * uma ficha que some por gesto invisível é pior do que gesto nenhum. No
 * celular a ficha se tira pelo xis, que já precisava existir para o dedo.
 *
 * O que sobrou meio escrito ainda vira ficha ao sair do campo - texto
 * digitado e não fechado some ao enviar o formulário, e ninguém entende por
 * quê.
 */
export function TagsInput({
  value,
  onValueChange,
  separators = [","],
  max,
  removeLabel = (tag) => `Remover ${tag}`,
  invalid,
  editable = true,
  onBlur,
  onFocus,
  className,
  inputClassName,
  ...props
}: TagsInputProps) {
  // O rascunho - o que está meio escrito - é o único estado que a peça guarda,
  // e de propósito: ele ainda não é dado. A lista fechada, que é o dado, mora
  // no app.
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const { colors } = useRivo();

  const full = max !== undefined && value.length >= max;

  /** Acrescenta o que couber: sem vazio, sem repetida, sem passar do teto. */
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
    // Sem separador no meio, o texto continua sendo rascunho.
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
      accessibilityRole="none"
      // A caixa é maior do que o campo depois da primeira ficha: tocar no
      // vazio ao lado precisa abrir o teclado, senão o alvo real vira a
      // sobra de linha.
      onPress={() => input.current?.focus()}
      className={cn(
        "min-h-12 flex-row flex-wrap items-center gap-1.5 rounded-md border bg-surface p-2",
        invalid ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        !editable && "opacity-60",
        className,
      )}
    >
      {value.map((tag) => (
        <View
          key={tag}
          className="flex-row items-center gap-1.5 rounded-sm bg-accent-subtle py-1 pr-1.5 pl-2"
        >
          <Text className="text-sm text-fg">{tag}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={removeLabel(tag)}
            accessibilityState={{ disabled: !editable }}
            disabled={!editable}
            onPress={() => onValueChange(value.filter((current) => current !== tag))}
            // 16px de desenho e 8 de folga de cada lado: 32 de alvo, sem a
            // ficha crescer.
            hitSlop={8}
            className="size-4 items-center justify-center"
          >
            {/* O xis: duas linhas cruzadas, nunca glyph de fonte. */}
            <View className="absolute h-[1.5px] w-2.5 rotate-45 rounded-pill bg-fg-subtle" />
            <View className="absolute h-[1.5px] w-2.5 -rotate-45 rounded-pill bg-fg-subtle" />
          </Pressable>
        </View>
      ))}

      <TextInput
        {...props}
        ref={input}
        value={draft}
        editable={editable && !full}
        onChangeText={handleChangeText}
        onSubmitEditing={() => commit([draft])}
        // Enter fecha a ficha e o teclado fica: quem escreve etiqueta escreve
        // a próxima em seguida.
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
        className={cn("h-8 min-w-24 flex-1 text-base text-fg", inputClassName)}
      />
    </Pressable>
  );
}
