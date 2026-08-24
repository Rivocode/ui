import { Field, FieldLabel, MaskedInput } from '@rivocode/ui'

/** Moldes */
export function Masks() {
  return (
    <div className="flex w-80 flex-col gap-3">
      <Field>
        <FieldLabel>CNPJ</FieldLabel>
        <MaskedInput mask="cnpj" defaultValue="12345678000199" />
      </Field>
      <Field>
        <FieldLabel>Telefone</FieldLabel>
        <MaskedInput mask="telefone" defaultValue="83988112233" />
      </Field>
      <Field>
        <FieldLabel>CEP</FieldLabel>
        <MaskedInput mask="cep" defaultValue="58000000" />
      </Field>
    </div>
  )
}
