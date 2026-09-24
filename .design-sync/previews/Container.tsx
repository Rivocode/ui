import { Container, PageHeader } from '@rivocode/ui'

/** Formulário de cadastro */
export function Form() {
  return (
    <div className="w-full rounded-lg border border-dashed border-border">
      <Container size="md" className="py-6">
        <PageHeader
          titleAs="h2"
          title="Novo cliente"
          description="A largura de leitura de um cadastro: o campo não estica até a borda do monitor."
        />
      </Container>
    </div>
  )
}

/** Como região principal */
export function AsMain() {
  return (
    <div className="w-full rounded-lg border border-dashed border-border">
      <Container render={<main />} size="sm" className="py-6">
        <p className="text-base text-fg-muted">
          Uma tela de entrada, estreita, com o respiro lateral que acompanha a densidade.
        </p>
      </Container>
    </div>
  )
}
