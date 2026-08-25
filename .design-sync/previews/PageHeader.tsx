import { Breadcrumb, Button, PageHeader } from '@rivocode/ui'
import { Download, Plus } from 'lucide-react'

/** Padrão */
export function Default() {
  return (
    <PageHeader
      className="w-full"
      title="Notas fiscais"
      description="Tudo que foi emitido no mês, pago ou não."
      breadcrumb={
        <Breadcrumb
          items={[{ label: 'RivoCode', href: '#' }, { label: 'Notas fiscais' }]}
        />
      }
      actions={
        <>
          <Button variant="secondary">
            <Download size={16} aria-hidden="true" />
            Exportar
          </Button>
          <Button>
            <Plus size={16} aria-hidden="true" />
            Nova nota
          </Button>
        </>
      }
    />
  )
}

/** Só o título */
export function TitleOnly() {
  return <PageHeader className="w-full" title="Ajustes" />
}
