import { Field, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rivocode/ui'

const PERIODOS = [
  { label: 'Ultimos 30 dias', value: '30' },
  { label: 'Ultimos 90 dias', value: '90' },
  { label: 'Este ano', value: 'ano' },
]

/** Fechado */
export function ClosedState() {
  return (
    <Select items={PERIODOS} defaultValue="30">
      <SelectTrigger aria-label="Período">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODOS.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Aberto */
export function Open() {
  return (
    <div className="min-h-56">
      <Select items={PERIODOS} defaultValue="90" defaultOpen>
        <SelectTrigger aria-label="Período">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Dentro de campo */
export function InsideAField() {
  return (
    <Field name="periodo" className="max-w-xs">
      <FieldLabel>Período do relatório</FieldLabel>
      <Select items={PERIODOS} defaultValue="ano">
        <SelectTrigger aria-label="Período do relatório">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
