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
  /** O rótulo do `FormField`. Sem ele o controle não tem nome acessível. */
  accessibilityLabel: string;
  /** Se há erro agora: é o que acende a borda vermelha do `Input`. */
  invalid: boolean;
};

export type FormFieldProps<Values extends FieldValues, Name extends FieldPath<Values>> = {
  /** O caminho do campo no schema. */
  name: Name;
  /**
   * Obrigatório, ao contrário do web.
   *
   * Lá ele é opcional porque a Base UI ainda liga o controle a um rótulo
   * escrito fora do `Field`. Aqui não há como ligar coisa nenhuma: sem este
   * texto o campo fica sem nome na tela E sem nome no leitor de tela, que são
   * as duas metades do mesmo problema.
   */
  label: string;
  description?: string;
  /** Só quando o campo vive fora de um `<Form>`. */
  control?: Control<Values>;
  className?: string;
  /** Recebe o campo pronto para o adaptador. */
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
