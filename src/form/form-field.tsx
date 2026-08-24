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

/**
 * O que o controle recebe: o campo do React Hook Form, sem tempero.
 *
 * O `id`, o `aria-invalid` e o `aria-describedby` nao entram aqui, e nao e
 * esquecimento: o `Field` da Base UI ja liga rotulo, ajuda e erro a qualquer
 * controle dela que esteja dentro, e calcular esses tres na mao so criaria um
 * segundo dono para o mesmo atributo.
 */
export type CampoDoFormulario<
  Valores extends FieldValues = FieldValues,
  Nome extends FieldPath<Valores> = FieldPath<Valores>,
> = ControllerRenderProps<Valores, Nome>;

export type FormFieldProps<Valores extends FieldValues, Nome extends FieldPath<Valores>> = {
  /** O caminho do campo no schema. */
  name: Nome;
  label?: ReactNode;
  description?: ReactNode;
  /** So quando o campo vive fora de um `<Form>`. */
  control?: Control<Valores>;
  className?: string;
  /** Recebe o campo pronto para espalhar no controle. */
  children: (campo: CampoDoFormulario<Valores, Nome>, estado: ControllerFieldState) => ReactElement;
};

/**
 * Uma linha de formulario: rotulo, controle, ajuda e erro, ligados entre si.
 *
 * O controle vem por funcao, e nao por clonagem do filho, porque cada controle
 * do catalogo tem um jeito proprio de receber valor, e adivinhar qual e falha
 * na tela e nao no tipo. Para `Input` e `DatePicker`, espalhar o campo basta;
 * para `Select` e `Checkbox`, os adaptadores fazem a ponte.
 *
 * Quem liga o rotulo ao controle e a Base UI, pelo contexto do `Field`. Por
 * isso todo controle do catalogo passa pelo `Field.Control` dela, o
 * `DatePicker` inclusive: o `for` do rotulo, o `aria-describedby` da ajuda e o
 * `aria-invalid` chegam sozinhos, e nao ha id para inventar aqui.
 *
 * A mensagem de erro e a do schema. O `match` diz a Base UI para nao consultar
 * a validacao nativa do navegador e deixar o React Hook Form mandar.
 */
export function FormField<Valores extends FieldValues, Nome extends FieldPath<Valores>>({
  name,
  label,
  description,
  control,
  className,
  children,
}: FormFieldProps<Valores, Nome>) {
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
