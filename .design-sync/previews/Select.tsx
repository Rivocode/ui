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

const NATUREZAS = [
  { label: 'Venda de mercadoria', value: '5102', flow: 'Saída' },
  { label: 'Remessa para conserto', value: '5915', flow: 'Saída' },
  { label: 'Devolução de venda', value: '1202', flow: 'Entrada' },
  { label: 'Compra para revenda', value: '1102', flow: 'Entrada' },
]

/** Agrupado por família */
export function Grouped() {
  return (
    <div className="min-h-72">
      {/* O `items` continua sendo a lista INTEIRA e plana: e por ele que o
          gatilho traduz o valor guardado no rotulo que a pessoa leu. O grupo
          arruma a lista aberta, e nao o que o gatilho mostra. */}
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
