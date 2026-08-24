import { Breadcrumb } from '@rivocode/ui'

/** Caminho */
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

/** Dobrado */
export function Folded() {
  return (
    <Breadcrumb
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
