import { Checkbox, CheckboxGroup } from '@rivocode/ui'

export function FormasAceitas() {
  return (
    <CheckboxGroup defaultValue={['pix', 'boleto']} aria-label="Formas aceitas">
      <label className="flex items-center gap-3 text-base text-fg">
        <Checkbox name="forma" value="pix" />
        Pix
      </label>
      <label className="flex items-center gap-3 text-base text-fg">
        <Checkbox name="forma" value="boleto" />
        Boleto
      </label>
      <label className="flex items-center gap-3 text-base text-fg">
        <Checkbox name="forma" value="cartao" />
        Cartao
      </label>
    </CheckboxGroup>
  )
}
