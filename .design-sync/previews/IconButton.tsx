import { IconButton } from '@rivocode/ui'
import { Download, Pencil, RefreshCw, Trash2 } from 'lucide-react'

/** Variantes */
export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton label="Nova nota">
        <Pencil />
      </IconButton>
      <IconButton variant="secondary" label="Baixar PDF">
        <Download />
      </IconButton>
      <IconButton variant="outline" label="Atualizar lista">
        <RefreshCw />
      </IconButton>
      <IconButton variant="ghost" label="Editar nota">
        <Pencil />
      </IconButton>
      <IconButton variant="danger" label="Excluir nota">
        <Trash2 />
      </IconButton>
    </div>
  )
}

/** Tamanhos */
export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton size="sm" variant="secondary" label="Baixar PDF">
        <Download />
      </IconButton>
      <IconButton size="md" variant="secondary" label="Baixar PDF">
        <Download />
      </IconButton>
      <IconButton size="lg" variant="secondary" label="Baixar PDF">
        <Download />
      </IconButton>
      <IconButton shape="pill" variant="secondary" label="Baixar PDF">
        <Download />
      </IconButton>
    </div>
  )
}

/** Com dica */
export function WithTooltip() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton variant="ghost" label="Editar nota" tooltip>
        <Pencil />
      </IconButton>
      <IconButton variant="ghost" label="Excluir nota" tooltip tooltipSide="bottom">
        <Trash2 />
      </IconButton>
    </div>
  )
}

/** Estados */
export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton variant="secondary" label="Sincronizando notas" loading>
        <RefreshCw />
      </IconButton>
      <IconButton variant="secondary" label="Baixar PDF" disabled>
        <Download />
      </IconButton>
    </div>
  )
}

/** Como link */
export function AsLink() {
  return (
    <IconButton variant="ghost" label="Baixar o XML da nota" render={<a href="/notas/4813.xml" />}>
      <Download />
    </IconButton>
  )
}
