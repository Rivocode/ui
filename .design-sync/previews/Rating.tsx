import { Rating } from '@rivocode/ui'
import { Heart } from 'lucide-react'
import { useState } from 'react'

/** Escolher a nota */
export function Choose() {
  const [value, setValue] = useState(0)

  return (
    <div className="flex flex-col gap-2">
      <p id="nota-atendimento" className="text-sm font-medium text-fg">
        Como foi o atendimento?
      </p>
      <Rating aria-labelledby="nota-atendimento" value={value} onValueChange={setValue} clearable />
      <p className="text-sm text-fg-muted">
        {value === 0 ? 'Nenhuma nota ainda.' : `Nota ${value} de 5. Clique de novo para limpar.`}
      </p>
    </div>
  )
}

/** Meia estrela */
export function Half() {
  const [value, setValue] = useState(3.5)

  return (
    <div className="flex items-center gap-3">
      <Rating allowHalf value={value} onValueChange={setValue} aria-label="Nota do produto" />
      <span className="font-mono text-sm text-fg-muted">
        {value.toLocaleString('pt-BR')}
      </span>
    </div>
  )
}

/** Média, só leitura */
export function Average() {
  return (
    <div className="flex items-center gap-2">
      <Rating readOnly value={4.3} size="sm" />
      <span className="text-sm text-fg">4,3</span>
      <span className="text-sm text-fg-muted">(128 avaliações)</span>
    </div>
  )
}

/** Tamanhos, ícone e desabilitado */
export function Sizes() {
  return (
    <div className="flex flex-col gap-3">
      <Rating size="sm" defaultValue={3} />
      <Rating size="md" defaultValue={3} />
      <Rating size="lg" defaultValue={3} />
      <Rating icon={<Heart />} max={3} defaultValue={2} labels={{ group: 'Gostou?' }} />
      <Rating disabled defaultValue={2} />
    </div>
  )
}
