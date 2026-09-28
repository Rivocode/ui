"use client";

import type { ReactElement, ReactNode } from "react";
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "../components/field";

export type FormFieldRow<
  Values extends FieldValues = FieldValues,
  Name extends FieldPath<Values> = FieldPath<Values>,
> = ControllerRenderProps<Values, Name>;

export type FormFieldProps<Values extends FieldValues, Name extends FieldPath<Values>> = {
  /** The field's path in the schema. */
  name: Name;
  label?: ReactNode;
  description?: ReactNode;
  /** Only when the field lives outside a `<Form>`. */
  control?: Control<Values>;
  className?: string;
  /** Receives the field ready to spread onto the control. */
  children: (field: FormFieldRow<Values, Name>, state: ControllerFieldState) => ReactElement;
};

export function FormField<Values extends FieldValues, Name extends FieldPath<Values>>({
  name,
  label,
  description,
  control,
  className,
  children,
}: FormFieldProps<Values, Name>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          name={field.name}
          disabled={field.disabled}
          invalid={Boolean(fieldState.error)}
          className={className}
        >
          {label && <FieldLabel>{label}</FieldLabel>}

          {children(field, fieldState)}

          {description && <FieldDescription>{description}</FieldDescription>}

          {fieldState.error?.message && <FieldError match>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
}
