import { Toggle, ToggleGroup } from '@rivocode/ui'

export function ModoDeExibicao() {
  return (
    <ToggleGroup defaultValue={['lista']}>
      <Toggle value="lista">Lista</Toggle>
      <Toggle value="grade">Grade</Toggle>
      <Toggle value="calendario">Calendario</Toggle>
    </ToggleGroup>
  )
}
