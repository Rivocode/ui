import { Radio, RadioGroup } from '@rivocode/ui'

/** Forma de pagamento */
export function PaymentMethod() {
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
        Cartão, indisponível para esta nota
      </label>
    </RadioGroup>
  )
}

/** Com rótulo */
export function WithText() {
  return (
    <RadioGroup defaultValue="service">
      <Radio value="service">Prestação de serviço</Radio>
      <Radio value="product">Venda de produto</Radio>
      <Radio value="rent">Locação</Radio>
    </RadioGroup>
  )
}
