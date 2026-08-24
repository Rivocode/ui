import { Field, FieldLabel, Fieldset, FieldsetLegend, Input } from '@rivocode/ui'

export function Endereco() {
  return (
    <Fieldset className="w-80">
      <FieldsetLegend>Endereco</FieldsetLegend>
      <Field>
        <FieldLabel>Rua</FieldLabel>
        <Input defaultValue="Av. Epitacio Pessoa" />
      </Field>
      <Field>
        <FieldLabel>Numero</FieldLabel>
        <Input defaultValue="1200" />
      </Field>
    </Fieldset>
  )
}
