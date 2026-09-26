import { useState, type ReactNode } from "react";
import { Pressable, View, type TextInputProps } from "react-native";

import { cn, type Slots } from "./cn";
import { useFieldControl } from "./field";
import { useRivo } from "./provider";
import { Text, TextInput } from "./text";

export type InputGroupAction = {
  /**
   * O nome que o leitor de tela anuncia. Diga a AÇÃO e nunca o estado:
   * "Copiar" resolve, "copiado" não diz o que acontece ao tocar.
   */
  label: string;
  onPress: () => void;
  /** O desenho do botão: texto curto entra como string, ícone como nó. */
  children?: ReactNode;
  disabled?: boolean;
  /** Veste o botao, a caixa de toque colada no campo. */
  className?: string;
};

export type InputGroupProps = Omit<TextInputProps, "value" | "onChangeText" | "className"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** O encosto antes do campo: `R$`, uma sigla, um ícone. */
  prefix?: ReactNode;
  /** O encosto depois do campo: `,00`, `kg`, `@empresa.com.br`. */
  suffix?: ReactNode;
  /** Os botões colados no campo, depois do sufixo. */
  actions?: InputGroupAction[];
  invalid?: boolean;
  /** Veste a moldura. */
  className?: string;
  /**
   * Classe por parte, com os nomes das pecas do web: `input` (o campo),
   * `prefix`, `suffix` e `action` (cada botao colado no campo, antes do
   * `className` da propria acao).
   */
  classNames?: Slots<"input" | "prefix" | "suffix" | "action">;
};

function Affix({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cn("h-full shrink-0 flex-row items-center justify-center px-3", className)}>
      {typeof children === "string" || typeof children === "number" ? (
        <Text className="text-base text-fg-subtle">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function InputGroup({
  value,
  onValueChange,
  prefix,
  suffix,
  actions,
  invalid,
  onFocus,
  onBlur,
  onSubmitEditing,
  accessibilityHint,
  accessibilityLabel,
  className,
  classNames,
  ...props
}: InputGroupProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useRivo();
  const field = useFieldControl(value);
  const flagged = invalid ?? Boolean(field.error);

  return (
    <View
      className={cn(
        "h-12 flex-row items-stretch overflow-hidden rounded-md border bg-surface",
        flagged ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        className,
      )}
    >
      {prefix !== undefined && (
        <Affix className={cn("border-r border-border", classNames?.prefix)}>{prefix}</Affix>
      )}

      <TextInput
        {...props}
        accessibilityLabel={accessibilityLabel ?? field.label}
        accessibilityHint={accessibilityHint ?? field.error}
        value={value}
        onChangeText={(text) => {
          field.change(text);
          onValueChange(text);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          field.blur();
          onBlur?.(event);
        }}
        onSubmitEditing={(event) => {
          field.submit();
          onSubmitEditing?.(event);
        }}
        placeholderTextColor={colors["fg-subtle"]}
        className={cn("h-full flex-1 px-3.5 text-base text-fg", classNames?.input)}
      />

      {suffix !== undefined && (
        <Affix className={cn("border-l border-border", classNames?.suffix)}>{suffix}</Affix>
      )}

      {actions?.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ disabled: action.disabled === true }}
          disabled={action.disabled}
          onPress={action.onPress}
          className={cn(
            "h-full w-12 shrink-0 items-center justify-center border-l border-border",
            action.disabled ? "opacity-40" : "active:bg-selected",
            classNames?.action,
            action.className,
          )}
        >
          {typeof action.children === "string" || typeof action.children === "number" ? (
            <Text className="text-base text-fg-muted">{action.children}</Text>
          ) : (
            action.children
          )}
        </Pressable>
      ))}
    </View>
  );
}
