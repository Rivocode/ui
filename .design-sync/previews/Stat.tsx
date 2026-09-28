import { Stat } from '@rivocode/ui'
import { Sparkline, currencyShort, percent } from '@rivocode/ui/chart'

const TREND = [128, 154, 142, 188, 205, 246]
const OVERDUE = [2, 3, 3, 5, 4, 6]

/** Default */
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

/** With trend */
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

/** Going up is bad */
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

/** The dashboard row */
export function Row() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <Stat label="Faturado" value={currencyShort(246_700)} delta={20} deltaLabel="sobre julho" />
      <Stat label="Recebido" value={currencyShort(198_300)} delta={3} deltaLabel="sobre julho" />
      <Stat label="Vencidas" value="6" delta={50} deltaLabel="sobre julho" invert />
    </div>
  )
}

/** A change that is not a percentage */
export function DeltaFormat() {
  /*
   * The delta speaks the same formatting vocabulary as the Progress, the Meter
   * and the chart axis. Without `deltaFormat` it renders as `percent`, which is
   * the default; with it, it renders in the unit the number actually has.
   */
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <Stat
        label="Faturado"
        value={currencyShort(246_700)}
        delta={12_400}
        deltaFormat="currencyShort"
        deltaLabel="sobre julho"
      />
      <Stat
        label="Notas emitidas"
        value="1.240"
        delta={86}
        deltaFormat="integer"
        deltaLabel="sobre julho"
      />
      <Stat
        label="Inadimplência"
        value="4,2%"
        delta={0.8}
        deltaFormat={(value) => percent(value, 1)}
        deltaLabel="sobre julho"
        invert
      />
    </div>
  )
}
