import { Breadcrumb, Button, PageHeader } from '@rivocode/ui'
import { Download, Plus } from 'lucide-react'

/*
 * The examples render as `h2`: the component's page already has its own
 * `h1`, and two level-1 headings would drop whoever navigates by heading into
 * an example.
 */

/** Default */
export function Default() {
  return (
    <PageHeader
      className="w-full"
      title="Notas fiscais"
      titleAs="h2"
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

/** Title only */
export function TitleOnly() {
  return <PageHeader className="w-full" title="Ajustes" titleAs="h2" />
}
