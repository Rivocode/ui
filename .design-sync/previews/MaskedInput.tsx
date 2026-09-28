import { Field, FieldDescription, FieldLabel, MaskedInput, toCents } from '@rivocode/ui'
import { useState } from 'react'

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

/** Dinheiro */
export function Money() {
  const [cents, setCents] = useState(248_000)

  return (
    <div className="w-80">
      <Field>
        <FieldLabel>Valor da nota</FieldLabel>
        <MaskedInput
          mask="moeda"
          defaultValue="248000"
          onValueChange={(masked) => setCents(toCents(masked))}
        />
        <FieldDescription>Vai para o servidor como {cents} centavos.</FieldDescription>
      </Field>
    </div>
  )
}
