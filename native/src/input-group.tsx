import { useState, type ReactNode } from "react";
import { Pressable, View, type TextInputProps } from "react-native";

import { cn, type Slots } from "./cn";
import { useFieldControl } from "./field";
import { useRivo } from "./provider";
import { Text, TextInput } from "./text";

export type InputGroupAction = {
  /**
   * The name the screen reader announces. Say the ACTION and never the state:
   * "Copiar" works, "copiado" does not say what happens on tap.
   */
  label: string;
  onPress: () => void;
  /** The button's drawing: short text goes in as a string, an icon as a node. */
  children?: ReactNode;
  disabled?: boolean;
  /** Styles the button, the touch box attached to the field. */
  className?: string;
};

export type InputGroupProps = Omit<TextInputProps, "value" | "onChangeText" | "className"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** The addon before the field: `R$`, an acronym, an icon. */
  prefix?: ReactNode;
  /** The addon after the field: `,00`, `kg`, `@empresa.com.br`. */
  suffix?: ReactNode;
  /** The buttons attached to the field, after the suffix. */
  actions?: InputGroupAction[];
  invalid?: boolean;
  /** Styles the frame. */
  className?: string;
  /**
   * Class per part, with the names of the web components: `input` (the field),
   * `prefix`, `suffix` and `action` (each button attached to the field, before
   * the action's own `className`).
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
