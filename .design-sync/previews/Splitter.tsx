import { Card, CardContent, Splitter } from '@rivocode/ui'

const NOTAS = ['4813 · Clínica São Lucas', '4814 · Transportes Cabo Branco', '4815 · Padaria Aurora']

/** Lista e detalhe */
export function ListAndDetail() {
  return (
    <div className="h-64 w-[36rem]">
      <Splitter
        label="Lista e detalhe"
        defaultSize={38}
        min={25}
        className="h-full rounded-lg border border-border"
        start={
          <ul className="flex flex-col">
            {NOTAS.map((nota) => (
              <li key={nota} className="truncate px-3 py-2 text-sm text-fg-muted">
                {nota}
              </li>
            ))}
          </ul>
        }
        end={
          <Card className="m-3 border-0">
            <CardContent className="text-base text-fg">
              Escolha uma nota à esquerda para ver o detalhe aqui.
            </CardContent>
          </Card>
        }
      />
    </div>
  )
}
