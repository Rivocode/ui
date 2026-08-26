import type { FieldPath, FieldValues, Noop, RefCallBack } from "react-hook-form";

import type { FormFieldRow } from "./form-field";

type Row<V extends FieldValues, N extends FieldPath<V>> = FormFieldRow<V, N>;

type Identity = {
  name: string;
  disabled?: boolean;
  /** O rótulo do `FormField`, para o controle carregar o próprio nome. */
  accessibilityLabel: string;
};

export type TextProps = Identity & {
  ref: RefCallBack;
  onBlur: Noop;
  value: string;
  onChangeText: (text: string) => void;
  /** A borda vermelha do `Input` e do `Textarea`. */
  invalid: boolean;
};

export type ValueProps<Value = unknown> = Identity & {
  value: Value;
  onValueChange: (value: Value) => void;
};

export type CheckedProps = Identity & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export type NullableProps<Value = unknown> = Identity & {
  value: Value | null;
  onValueChange: (value: Value | null) => void;
};

export function forText<V extends FieldValues, N extends FieldPath<V>>(row: Row<V, N>): TextProps {
  const { onChange, value, name, ref, onBlur, disabled, accessibilityLabel, invalid } = row;
  return {
    name,
    disabled,
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
    accessibilityLabel,
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
    accessibilityLabel,
    value: value ?? null,
    onValueChange: (next) => {
      onChange(next);
    },
  };
}
