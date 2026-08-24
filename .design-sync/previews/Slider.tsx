import { Slider } from '@rivocode/ui'

/** Com rótulo */
export function WithLabel() {
  return (
    <div className="w-72">
      <Slider defaultValue={25} max={50} label="Desconto" showValue thumbLabel="Desconto" />
    </div>
  )
}

/** Faixa */
export function Range() {
  return (
    <div className="w-72">
        <Slider
        defaultValue={[20, 60]}
        label="Faixa de valor"
        showValue
        thumbLabel={['Valor minimo', 'Valor maximo']}
      />
    </div>
  )
}
