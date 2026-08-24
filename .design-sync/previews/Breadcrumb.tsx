import { Breadcrumb } from '@rivocode/ui'

export function Caminho() {
  return (
    <Breadcrumb
      items={[
        { label: 'Inicio', href: '#' },
        { label: 'Clientes', href: '#' },
        { label: 'Clinica Sao Lucas', href: '#' },
        { label: '4813' },
      ]}
    />
  )
}

export function Dobrado() {
  return (
    <Breadcrumb
      items={[
        { label: 'Inicio', href: '#' },
        { label: 'Clientes', href: '#' },
        { label: 'Clinica Sao Lucas', href: '#' },
        { label: 'Notas', href: '#' },
        { label: '4813' },
      ]}
    />
  )
}
