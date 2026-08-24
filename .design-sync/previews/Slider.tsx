import { Slider } from '@rivocode/ui'

export function ComRotulo() {
  return (
    <div className="w-72">
      <Slider defaultValue={25} max={50} label="Desconto" showValue thumbLabel="Desconto" />
    </div>
  )
}

export function Faixa() {
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
