import { Download, MessageCircle, Trash2 } from 'lucide-react'
import { Button } from '@rivocode/ui'

/** Variantes */
export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Salvar alterações</Button>
      <Button variant="secondary">Cancelar</Button>
      <Button variant="outline">Quero um diagnóstico</Button>
      <Button variant="ghost">Ver detalhes</Button>
      <Button variant="destructive">Excluir projeto</Button>
    </div>
  )
}

/** Tamanhos */
export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Pequeno</Button>
      <Button size="md">Médio</Button>
      <Button size="lg">Grande</Button>
      <Button size="cta" shape="pill">
        <MessageCircle size={18} aria-hidden="true" />
        Falar no WhatsApp
      </Button>
    </div>
  )
}

/** Estados */
export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button loading>Emitindo nota</Button>
      <Button disabled>Indisponível</Button>
      <Button size="icon" variant="secondary" aria-label="Baixar">
        <Download size={16} aria-hidden="true" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Excluir">
        <Trash2 size={16} aria-hidden="true" />
      </Button>
    </div>
  )
}

/** Como link */
export function AsLink() {
  return (
    <Button render={<a href="https://rivocode.com" />} size="cta" shape="pill">
      Ver o site da RivoCode
    </Button>
  )
}
