import { Breadcrumb, Button, PageHeader } from '@rivocode/ui'
import { Download, Plus } from 'lucide-react'

/*
 * Os exemplos saem em `h2`: a página da peça já tem o `h1` dela, e dois
 * títulos de nível 1 fariam quem navega por título cair num exemplo.
 */

/** Padrão */
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

/** Só o título */
export function TitleOnly() {
  return <PageHeader className="w-full" title="Ajustes" titleAs="h2" />
}
