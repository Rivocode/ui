import { Field, FieldDescription, FieldLabel, OTPField } from '@rivocode/ui'

/*
 * The surrounding `Field` is not decoration in the example: the first field of
 * the code is the one that receives the whole paste, and it is from it that
 * Base UI takes the group's label. Without the `FieldLabel`, that digit has no
 * name for screen reader users. The example shows the usage that works.
 */

/** Filled */
export function Filled() {
  return (
    <Field className="w-fit max-w-full">
      <FieldLabel>Código de verificação</FieldLabel>
      <OTPField length={6} defaultValue="481337" />
    </Field>
  )
}

/** Empty */
export function Empty() {
  return (
    <Field className="w-fit max-w-full">
      <FieldLabel>Código de verificação</FieldLabel>
      <OTPField length={6} />
      <FieldDescription>Enviamos por SMS. Colar o código inteiro funciona.</FieldDescription>
    </Field>
  )
}
