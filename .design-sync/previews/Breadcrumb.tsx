import { Breadcrumb } from '@rivocode/ui'

/** Path */
export function Path() {
  return (
    <Breadcrumb
      items={[
        { label: 'Início', href: '#' },
        { label: 'Clientes', href: '#' },
        { label: 'Clínica São Lucas', href: '#' },
        { label: '4813' },
      ]}
    />
  )
}

/** Collapsed */
export function Folded() {
  return (
    <Breadcrumb
      max={4}
      items={[
        { label: 'Início', href: '#' },
        { label: 'Clientes', href: '#' },
        { label: 'Clínica São Lucas', href: '#' },
        { label: 'Notas', href: '#' },
        { label: '4813' },
      ]}
    />
  )
}
