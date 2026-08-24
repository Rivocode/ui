import { Radio, RadioGroup } from '@rivocode/ui'

export function FormaDePagamento() {
  return (
    <RadioGroup defaultValue="pix">
      <label className="flex items-center gap-3 text-base text-fg">
        <Radio value="pix" />
        Pix
      </label>
      <label className="flex items-center gap-3 text-base text-fg">
        <Radio value="boleto" />
        Boleto
      </label>
      <label className="flex items-center gap-3 text-base text-fg-disabled">
        <Radio value="cartao" disabled />
        Cartao, indisponivel para esta nota
      </label>
    </RadioGroup>
  )
}
