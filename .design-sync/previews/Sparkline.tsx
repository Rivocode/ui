import { Card, CardContent } from '@rivocode/ui'
import { Sparkline } from '@rivocode/ui/chart'

const BILLED = [128, 155, 142, 189, 205, 247]
const OVERDUE = [9, 8, 8, 6, 5, 3]

/** Dentro de um indicador */
export function InsideAKpi() {
  return (
    <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-fg-muted">Faturado</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <p className="font-display text-2xl text-fg">R$ 246,7 mil</p>
            <Sparkline data={BILLED} variant="area" tone="auto" className="h-8 w-20 shrink-0" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-fg-muted">Vencidas</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <p className="font-display text-2xl text-fg">3</p>
            <Sparkline data={OVERDUE} variant="area" className="h-8 w-20 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Linha e área */
export function LineAndArea() {
  return (
    <div className="flex items-center gap-8">
      <Sparkline data={BILLED} className="h-10 w-32" />
      <Sparkline data={BILLED} variant="area" className="h-10 w-32" />
    </div>
  )
}
