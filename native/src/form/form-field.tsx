import type { ReactElement } from "react";
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field } from "../field";

export type FormFieldRow<
  Values extends FieldValues = FieldValues,
  Name extends FieldPath<Values> = FieldPath<Values>,
> = ControllerRenderProps<Values, Name> & {
  /** The `FormField` label. Without it the control has no accessible name. */
  accessibilityLabel: string;
  /** Whether there is an error right now: it is what lights the red border of `Input`. */
  invalid: boolean;
};

export type FormFieldProps<Values extends FieldValues, Name extends FieldPath<Values>> = {
  /** The field's path in the schema. */
  name: Name;
  /**
   * Required, unlike on the web. There it is optional because Base UI still
   * ties the control to a label written outside the `Field`. Here there is no
   * way to tie anything: without this text the field has no name on screen AND
   * no name for the screen reader, which are the two halves of the same
   * problem.
   */
  label: string;
  description?: string;
  /** Only when the field lives outside a `<Form>`. */
  control?: Control<Values>;
  className?: string;
  /** Receives the field ready for the adapter. */
  children: (row: FormFieldRow<Values, Name>, state: ControllerFieldState) => ReactElement;
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
          label={label}
          description={description}
          error={fieldState.error?.message}
          className={className}
        >
          {children(
            { ...field, accessibilityLabel: label, invalid: Boolean(fieldState.error) },
            fieldState,
          )}
        </Field>
      )}
    />
  );
}
