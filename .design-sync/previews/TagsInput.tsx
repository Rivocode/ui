import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, TagsInput } from '@rivocode/ui'

/** Marcadores da nota */
export function InvoiceTags() {
  const [tags, setTags] = useState(['nf-e', 'urgente'])

  return (
    <div className="w-80">
      <Field>
        <FieldLabel>Marcadores</FieldLabel>
        <TagsInput value={tags} onValueChange={setTags} placeholder="Escreva e tecle Enter" />
        <FieldDescription>Enter fecha a ficha; apagar com o campo vazio tira a última.</FieldDescription>
      </Field>
    </div>
  )
}
