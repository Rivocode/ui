import { Badge } from '@rivocode/ui'

/** Tons */
export function Tones() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Rascunho</Badge>
      <Badge tone="accent">Novo</Badge>
      <Badge tone="success">Pago</Badge>
      <Badge tone="warning">Vence em 3 dias</Badge>
      <Badge tone="danger">Vencido</Badge>
      <Badge tone="info">Em analise</Badge>
    </div>
  )
}

/** Tamanhos */
export function Sizes() {
  return (
    <div className="flex items-center gap-2">
      <Badge size="sm" tone="success">Pequeno</Badge>
      <Badge size="md" tone="success">Médio</Badge>
    </div>
  )
}
