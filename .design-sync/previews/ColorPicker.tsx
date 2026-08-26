import { ColorPicker } from '@rivocode/ui'
import { useState } from 'react'

/*
 * As cores daqui sao a paleta da casa escrita a mao, e e isto que um construtor
 * de tema faz: ele conhece a marca do cliente e entrega os tons dela. Dentro de
 * `src/` nao poderia - la a guarda de cor literal vale, porque componente que
 * sabe a cor de alguem deixa de ser white-label.
 */
const BRAND = [
  { value: '#d4f34a', label: 'Lima' },
  { value: '#3ddc97', label: 'Teal' },
  { value: '#f2b21c', label: 'Âmbar' },
  { value: '#6aa9ff', label: 'Azul' },
  { value: '#b78cff', label: 'Violeta' },
  { value: '#ff8ac4', label: 'Rosa' },
  { value: '#ff6b6b', label: 'Vermelho' },
  { value: '#8b9199', label: 'Cinza' },
]

/** Com nome em cada amostra */
export function Named() {
  const [brand, setBrand] = useState('#3ddc97')
  return (
    <div className="w-72">
      <ColorPicker
        label="Cor da marca"
        value={brand}
        onValueChange={setBrand}
        swatches={BRAND}
        columns={4}
      />
    </div>
  )
}

/** Leque padrão */
export function Wheel() {
  const [brand, setBrand] = useState('')
  return (
    <div className="w-fit">
      <ColorPicker label="Cor de destaque" value={brand} onValueChange={setBrand} />
    </div>
  )
}

/** Só a grade */
export function SwatchesOnly() {
  const [brand, setBrand] = useState('#d4f34a')
  return (
    <ColorPicker
      swatchesLabel="Cor da etiqueta"
      value={brand}
      onValueChange={setBrand}
      swatches={BRAND}
      columns={8}
      hideInput
    />
  )
}

/** Desabilitado */
export function Disabled() {
  return (
    <div className="w-72">
      <ColorPicker label="Cor da marca" value="#d4f34a" swatches={BRAND} columns={4} disabled />
    </div>
  )
}
