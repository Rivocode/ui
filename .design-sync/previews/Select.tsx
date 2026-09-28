import {
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@rivocode/ui'

const PERIODOS = [
  { label: 'Ultimos 30 dias', value: '30' },
  { label: 'Ultimos 90 dias', value: '90' },
  { label: 'Este ano', value: 'ano' },
]

/** Closed */
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

/** Open */
export function Open() {
  return (
    <div className="min-h-56">
      <Select items={PERIODOS} defaultValue="90" defaultOpen /* rc-keep-open */>
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

/** Inside a field */
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

const NATUREZAS = [
  { label: 'Venda de mercadoria', value: '5102', flow: 'Saída' },
  { label: 'Remessa para conserto', value: '5915', flow: 'Saída' },
  { label: 'Devolução de venda', value: '1202', flow: 'Entrada' },
  { label: 'Compra para revenda', value: '1102', flow: 'Entrada' },
]

/** Grouped by family */
export function Grouped() {
  return (
    <div className="min-h-72">
      {/* `items` is still the WHOLE, flat list: it is how the trigger
          translates the stored value into the label the person read. The
          group arranges the open list, not what the trigger shows. */}
      <Select items={NATUREZAS} defaultValue="5102" defaultOpen /* rc-keep-open */>
        <SelectTrigger aria-label="Natureza da operação" className="min-w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectGroupLabel>Saída</SelectGroupLabel>
            {NATUREZAS.filter((n) => n.flow === 'Saída').map((n) => (
              <SelectItem key={n.value} value={n.value}>
                {n.label}
              </SelectItem>
            ))}
          </SelectGroup>

          <SelectSeparator />

          <SelectGroup>
            <SelectGroupLabel>Entrada</SelectGroupLabel>
            {NATUREZAS.filter((n) => n.flow === 'Entrada').map((n) => (
              <SelectItem key={n.value} value={n.value}>
                {n.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

/** In the three sizes */
export function Sizes() {
  return (
    <div className="flex flex-col items-start gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Select key={size} items={PERIODOS} defaultValue="30" size={size}>
          <SelectTrigger aria-label={`Período, tamanho ${size}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}
