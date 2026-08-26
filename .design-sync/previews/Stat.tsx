import { Stat } from '@rivocode/ui'
import { Sparkline, currencyShort } from '@rivocode/ui/chart'

const TREND = [128, 154, 142, 188, 205, 246]
const OVERDUE = [2, 3, 3, 5, 4, 6]

/** Padrão */
export function Default() {
  return (
    <Stat
      label="Faturado em agosto"
      value={currencyShort(246_700)}
      delta={20}
      deltaLabel="sobre julho"
      className="w-64"
    />
  )
}

/** Com tendência */
export function WithTrend() {
  return (
    <Stat
      label="Faturado em agosto"
      value={currencyShort(246_700)}
      delta={20}
      deltaLabel="sobre julho"
      hint="Tudo que foi emitido no mês, pago ou não."
      chart={<Sparkline data={TREND} variant="area" trend="auto" className="h-8 w-full" />}
      className="w-64"
    />
  )
}

/** Subir é ruim */
export function Inverted() {
  return (
    <Stat
      label="Vencidas"
      value="6"
      delta={50}
      deltaLabel="sobre julho"
      invert
      hint="Notas com vencimento passado e sem baixa."
      chart={
        <Sparkline
          data={OVERDUE.map((point) => -point)}
          variant="area"
          trend="auto"
          className="h-8 w-full"
        />
      }
      className="w-64"
    />
  )
}

/** A fileira de painel */
export function Row() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <Stat label="Faturado" value={currencyShort(246_700)} delta={20} deltaLabel="sobre julho" />
      <Stat label="Recebido" value={currencyShort(198_300)} delta={3} deltaLabel="sobre julho" />
      <Stat label="Vencidas" value="6" delta={50} deltaLabel="sobre julho" invert />
    </div>
  )
}
