import { InputAction, InputGroup, InputPrefix, InputSuffix, MaskedInput } from '@rivocode/ui'

/** Encostos */
export function Edges() {
  return (
    <div className="flex w-80 flex-col gap-3">
      <InputGroup>
        <InputPrefix>R$</InputPrefix>
        <MaskedInput mask="moeda" defaultValue="248000" />
      </InputGroup>

      <InputGroup>
        <MaskedInput mask="" placeholder="minha-empresa" />
        <InputSuffix>.rivocode.com</InputSuffix>
      </InputGroup>

      <InputGroup>
        <MaskedInput mask="" placeholder="Buscar nota ou cliente" />
        <InputAction aria-label="Buscar">Ir</InputAction>
      </InputGroup>
    </div>
  )
}
