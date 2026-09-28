import { Checkbox, CheckboxGroup } from '@rivocode/ui'

const METHODS = ['pix', 'boleto', 'cartao']

/** Formas aceitas */
export function AcceptedMethods() {
  return (
    <CheckboxGroup defaultValue={['pix', 'boleto']} aria-label="Formas aceitas">
      <Checkbox name="forma" value="pix">
        Pix
      </Checkbox>
      <Checkbox name="forma" value="boleto">
        Boleto
      </Checkbox>
      <Checkbox name="forma" value="cartao">
        Cartão
      </Checkbox>
    </CheckboxGroup>
  )
}

/** Com a caixa de todas */
export function WithSelectAll() {
  return (
    <CheckboxGroup allValues={METHODS} defaultValue={['pix']} aria-label="Formas aceitas">
      <Checkbox parent className="mb-1">
        Todas
      </Checkbox>

      <Checkbox name="forma" value="pix">
        Pix
      </Checkbox>
      <Checkbox name="forma" value="boleto">
        Boleto
      </Checkbox>
      <Checkbox name="forma" value="cartao">
        Cartão
      </Checkbox>
    </CheckboxGroup>
  )
}
