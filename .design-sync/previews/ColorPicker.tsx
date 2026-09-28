import { ColorPicker } from '@rivocode/ui'
import { useState } from 'react'

/*
 * The colors here are the house palette written by hand, and that is what a
 * theme builder does: it knows the client's brand and hands over its shades.
 * Inside `src/` this would not be allowed - the literal color guard applies
 * there, because a component that knows someone's color stops being
 * white-label.
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

/** With a name on each swatch */
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

/** Default set */
export function Wheel() {
  const [brand, setBrand] = useState('')
  return (
    <div className="w-fit">
      <ColorPicker label="Cor de destaque" value={brand} onValueChange={setBrand} />
    </div>
  )
}

/** Only the grid */
export function SwatchesOnly() {
  const [brand, setBrand] = useState('#d4f34a')
  return (
    <ColorPicker
      labels={{ swatches: "Cor da etiqueta" }}
      value={brand}
      onValueChange={setBrand}
      swatches={BRAND}
      columns={8}
      hideInput
    />
  )
}

/** Disabled */
export function Disabled() {
  return (
    <div className="w-72">
      <ColorPicker label="Cor da marca" value="#d4f34a" swatches={BRAND} columns={4} disabled />
    </div>
  )
}
