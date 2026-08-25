import { Checkbox, Field, FieldLabel } from '@rivocode/ui'

/** Estados */
export function States() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <label className="flex items-center gap-2 text-base text-fg">
        <Checkbox aria-label="Não marcada" />
        Não marcada
      </label>
      <label className="flex items-center gap-2 text-base text-fg">
        <Checkbox checked aria-label="Marcada" />
        Marcada
      </label>
      <label className="flex items-center gap-2 text-base text-fg">
        <Checkbox indeterminate aria-label="Algumas" />
        Algumas
      </label>
      <label className="flex items-center gap-2 text-base text-fg-disabled">
        <Checkbox disabled aria-label="Desabilitada" />
        Desabilitada
      </label>
    </div>
  )
}

/** Selecionar todas */
export function SelectAll() {
  return (
    <div className="flex max-w-xs flex-col gap-3">
      <label className="flex items-center gap-2 border-b border-border pb-3 text-base font-medium text-fg">
        <Checkbox indeterminate aria-label="Selecionar todas" />
        Selecionar todas
      </label>
      <label className="flex items-center gap-2 text-base text-fg">
        <Checkbox checked aria-label="Nota 4813" />
        Nota 4813
      </label>
      <label className="flex items-center gap-2 text-base text-fg">
        <Checkbox aria-label="Nota 4814" />
        Nota 4814
      </label>
    </div>
  )
}

/** Dentro de campo */
export function InsideAField() {
  return (
    <Field name="termos" className="max-w-sm">
      <div className="flex items-center gap-2">
        <Checkbox aria-label="Aceito os termos" />
        <FieldLabel>Aceito os termos e condições</FieldLabel>
      </div>
    </Field>
  )
}

/** Com rótulo */
export function WithText() {
  return (
    <div className="space-y-3">
      <Checkbox defaultChecked>ISS retido na fonte</Checkbox>
      <Checkbox>INSS</Checkbox>
      <Checkbox disabled>IRRF, indisponível neste regime</Checkbox>
    </div>
  )
}
