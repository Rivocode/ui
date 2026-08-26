import type { FieldPath, FieldValues, Noop, RefCallBack } from "react-hook-form";

import type { FormFieldRow } from "./form-field";

type Field<V extends FieldValues, N extends FieldPath<V>> = FormFieldRow<V, N>;

type Identity = {
  name: string;
  disabled?: boolean;
};

export type DateProps = Identity & {
  ref: RefCallBack;
  onBlur: Noop;
  value: Date | undefined;
  onValueChange: (data: Date | undefined) => void;
};

export type ValueProps<Value = unknown> = Identity & {
  value: Value;
  onValueChange: (value: Value) => void;
};

export type CheckedProps = Identity & {
  ref: RefCallBack;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export type PropsDeDatePicker = DateProps;
export type PropsDeSelect = ValueProps;
export type PropsDeCheckbox = CheckedProps;

export function forDate<V extends FieldValues, N extends FieldPath<V>>(
  field: Field<V, N>,
): DateProps {
  const { onChange, value, name, ...rest } = field;
  return {
    ...rest,
    name,
    value: value as Date | undefined,
    onValueChange: (data) => onChange(data),
  };
}

export function forValue<V extends FieldValues, N extends FieldPath<V>>(
  field: Field<V, N>,
): ValueProps<Field<V, N>["value"]> {
  const { onChange, ref: _ref, onBlur: _onBlur, name, ...rest } = field;
  return {
    ...rest,
    name,
    onValueChange: (value) => onChange(value),
  };
}

export function forChecked<V extends FieldValues, N extends FieldPath<V>>(
  field: Field<V, N>,
): CheckedProps {
  const { onChange, value, onBlur: _onBlur, name, ...rest } = field;
  return {
    ...rest,
    name,
    checked: Boolean(value),
    onCheckedChange: (checked) => onChange(checked),
  };
}

export const forDatePicker = forDate;
export const forSelect = forValue;
export const forCheckbox = forChecked;
