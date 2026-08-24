import { Field, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rivocode/ui'

const PERIODOS = [
  { label: 'Ultimos 30 dias', value: '30' },
  { label: 'Ultimos 90 dias', value: '90' },
  { label: 'Este ano', value: 'ano' },
]

export function Fechado() {
  return (
    <Select items={PERIODOS} defaultValue="30">
      <SelectTrigger aria-label="Periodo">
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

export function Aberto() {
  return (
    <div className="min-h-56">
      <Select items={PERIODOS} defaultValue="90" defaultOpen>
        <SelectTrigger aria-label="Periodo">
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

export function DentroDeCampo() {
  return (
    <Field name="periodo" className="max-w-xs">
      <FieldLabel>Periodo do relatorio</FieldLabel>
      <Select items={PERIODOS} defaultValue="ano">
        <SelectTrigger aria-label="Periodo do relatorio">
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
