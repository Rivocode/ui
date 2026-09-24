import { Badge, Button, Field, FieldLabel, Input, Stack } from '@rivocode/ui'

const TAGS = ['Serviço', 'Recorrente', 'ISS retido', 'Simples Nacional', 'Prefeitura de João Pessoa']

/** Coluna de campos */
export function Column() {
  return (
    <Stack gap="lg" className="w-80">
      <Field name="razao">
        <FieldLabel>Razão social</FieldLabel>
        <Input defaultValue="Clínica São Lucas" />
      </Field>
      <Field name="cnpj">
        <FieldLabel>CNPJ</FieldLabel>
        <Input defaultValue="12.345.678/0001-99" />
      </Field>
      <Stack direction="row" gap="sm" justify="end">
        <Button variant="secondary">Cancelar</Button>
        <Button>Salvar</Button>
      </Stack>
    </Stack>
  )
}

/** Linha que quebra */
export function RowThatWraps() {
  return (
    <Stack direction="row" gap="xs" wrap className="w-72">
      {TAGS.map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </Stack>
  )
}

/** Título e ação nas pontas */
export function SpaceBetween() {
  return (
    <Stack direction="row" align="center" justify="between" className="w-96">
      <p className="text-base text-fg">Notas de agosto</p>
      <Button size="sm" variant="secondary">
        Exportar
      </Button>
    </Stack>
  )
}

/** Como lista */
export function AsList() {
  return (
    <Stack render={<ul />} gap="sm" className="w-64 text-base text-fg">
      <li>Nota 4813, autorizada</li>
      <li>Nota 4814, autorizada</li>
      <li>Nota 4815, em processamento</li>
    </Stack>
  )
}
