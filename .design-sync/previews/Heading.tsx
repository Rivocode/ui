import { Heading, Text } from '@rivocode/ui'

/** The sizes that follow the level */
export function Levels() {
  return (
    <div className="flex flex-col gap-3">
      <Heading level={2}>Notas fiscais</Heading>
      <Heading level={3}>Emitidas em agosto</Heading>
      <Heading level={4}>Clínica São Lucas</Heading>
      <Heading level={5}>Itens da nota</Heading>
      <Heading level={6}>Observações</Heading>
    </div>
  )
}

/** Level and size separate */
export function SizeApart() {
  return (
    <section className="flex max-w-96 flex-col gap-2">
      <Heading level={2} size="md">
        Resumo do mês
      </Heading>
      <Text size="sm" tone="muted">
        O título é o segundo da página, e por isso é um h2. Aqui ele mora dentro de uma
        coluna estreita, e por isso é pequeno.
      </Text>
    </section>
  )
}

/** A title that does not fit */
export function Truncated() {
  return (
    <div className="w-64">
      <Heading level={3} truncate>
        Clínica São Lucas Serviços Médicos Ltda
      </Heading>
    </div>
  )
}
