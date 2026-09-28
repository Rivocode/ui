import type { FieldPath, FieldValues, Noop, RefCallBack } from "react-hook-form";

import type { FormFieldRow } from "./form-field";

type Row<V extends FieldValues, N extends FieldPath<V>> = FormFieldRow<V, N>;

type Identity = {
  name: string;
  disabled?: boolean;
};

type Named = {
  /** O rotulo do `FormField`, no `label` da peca, que e o nome dela no leitor de tela. */
  label: string;
};

type Spoken = {
  /** O rotulo do `FormField`, no nome do `TextInput` de baixo. */
  accessibilityLabel: string;
};

export type TextProps = Identity & Spoken & {
  ref: RefCallBack;
  onBlur: Noop;
  value: string;
  onChangeText: (text: string) => void;
  /** A borda vermelha do `Input` e do `Textarea`. */
  invalid: boolean;
  /** O `disabled` do `FormField` na lingua do `TextInput`, que nao le `disabled`. */
  editable?: boolean;
};

export type ValueProps<Value = unknown> = Identity & Named & Spoken & {
  value: Value;
  onValueChange: (value: Value) => void;
};

export type CheckedProps = Identity & Named & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export type NullableProps<Value = unknown> = Identity & Named & {
  value: Value | null;
  onValueChange: (value: Value | null) => void;
};

export function forText<V extends FieldValues, N extends FieldPath<V>>(row: Row<V, N>): TextProps {
  const { onChange, value, name, ref, onBlur, disabled, accessibilityLabel, invalid } = row;
  return {
    name,
    disabled,
    ...(disabled ? { editable: false } : {}),
    accessibilityLabel,
    invalid,
    ref,
    onBlur,
    value: value === undefined || value === null ? "" : String(value),
    onChangeText: (text) => {
      onChange(text);
    },
  };
}

export function forValue<V extends FieldValues, N extends FieldPath<V>>(
  row: Row<V, N>,
): ValueProps<Row<V, N>["value"]> {
  const { onChange, value, name, disabled, accessibilityLabel } = row;
  return {
    name,
    disabled,
    label: accessibilityLabel,
    accessibilityLabel,
    value,
    onValueChange: (next) => {
      onChange(next);
    },
  };
}

export function forChecked<V extends FieldValues, N extends FieldPath<V>>(
  row: Row<V, N>,
): CheckedProps {
  const { onChange, value, name, disabled, accessibilityLabel } = row;
  return {
    name,
    disabled,
    label: accessibilityLabel,
    checked: Boolean(value),
    onCheckedChange: (checked) => {
      onChange(checked);
    },
  };
}

export function forDate<V extends FieldValues, N extends FieldPath<V>>(
  row: Row<V, N>,
): NullableProps<NonNullable<Row<V, N>["value"]>> {
  const { onChange, value, name, disabled, accessibilityLabel } = row;
  return {
    name,
    disabled,
    label: accessibilityLabel,
    value: value ?? null,
    onValueChange: (next) => {
      onChange(next);
    },
  };
}
