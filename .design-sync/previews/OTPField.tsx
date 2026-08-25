import { Field, FieldDescription, FieldLabel, OTPField } from '@rivocode/ui'

/*
 * O `Field` em volta não é enfeite do exemplo: o primeiro campo do código é o
 * que recebe a colagem inteira, e é dele que a Base UI tira o rótulo do
 * conjunto. Sem o `FieldLabel`, aquele dígito fica sem nome para quem usa
 * leitor de tela. O exemplo mostra o uso que funciona.
 */

/** Preenchido */
export function Filled() {
  return (
    <Field className="w-fit">
      <FieldLabel>Código de verificação</FieldLabel>
      <OTPField length={6} defaultValue="481337" />
    </Field>
  )
}

/** Vazio */
export function Empty() {
  return (
    <Field className="w-fit">
      <FieldLabel>Código de verificação</FieldLabel>
      <OTPField length={6} />
      <FieldDescription>Enviamos por SMS. Colar o código inteiro funciona.</FieldDescription>
    </Field>
  )
}
