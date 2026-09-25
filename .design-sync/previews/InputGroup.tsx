import { Input, InputAction, InputGroup, InputPrefix, InputSuffix, MaskedInput } from '@rivocode/ui'

/** Encostos */
export function Edges() {
  return (
    <div className="flex w-80 flex-col gap-3">
      <InputGroup>
        <InputPrefix>R$</InputPrefix>
        <MaskedInput aria-label="Valor" mask="moeda" defaultValue="248000" />
      </InputGroup>

      <InputGroup>
        <Input aria-label="Subdomínio" placeholder="minha-empresa" />
        <InputSuffix>.rivocode.com</InputSuffix>
      </InputGroup>

      <InputGroup>
        <Input aria-label="Buscar nota ou cliente" placeholder="Buscar nota ou cliente" />
        <InputAction aria-label="Buscar">Ir</InputAction>
      </InputGroup>
    </div>
  )
}
