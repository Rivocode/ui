import { Slider } from '@rivocode/ui'

/** With label */
export function WithLabel() {
  return (
    <div className="w-72">
      <Slider defaultValue={25} max={50} label="Desconto" showValue thumbLabel="Desconto" />
    </div>
  )
}

/** Range */
export function Range() {
  return (
    <div className="w-72">
        <Slider
        defaultValue={[20, 60]}
        label="Faixa de valor"
        showValue
        thumbLabel={['Valor mínimo', 'Valor máximo']}
      />
    </div>
  )
}
