import { useState, type ReactNode } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";

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
};

export type InputGroupProps = Omit<
  TextInputProps,
  "value" | "onChangeText" | "className"
> & {
  value: string;
  onValueChange: (value: string) => void;
  /** O encosto antes do campo: `R$`, uma sigla, um ícone. */
  prefix?: ReactNode;
  /** O encosto depois do campo: `,00`, `kg`, `@empresa.com.br`. */
  suffix?: ReactNode;
  /** Os botões colados no campo, depois do sufixo. */
  actions?: InputGroupAction[];
  invalid?: boolean;
  /** Veste a moldura. O campo de dentro é `inputClassName`. */
  className?: string;
  inputClassName?: string;
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
  className,
  inputClassName,
  ...props
}: InputGroupProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useRivo();

  return (
    <View
      className={cn(
        "h-12 flex-row items-stretch overflow-hidden rounded-md border bg-surface",
        invalid ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        className,
      )}
    >
      {prefix !== undefined && <Affix className="border-r border-border">{prefix}</Affix>}

      <TextInput
        {...props}
        value={value}
        onChangeText={onValueChange}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={colors["fg-subtle"]}
        className={cn("h-full flex-1 px-3.5 text-base text-fg", inputClassName)}
      />

      {suffix !== undefined && <Affix className="border-l border-border">{suffix}</Affix>}

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
