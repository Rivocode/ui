import { Toggle, ToggleGroup } from '@rivocode/ui'

/** Modo de exibição */
export function ViewMode() {
  return (
    <ToggleGroup defaultValue={['lista']}>
      <Toggle value="lista">Lista</Toggle>
      <Toggle value="grade">Grade</Toggle>
      <Toggle value="calendario">Calendário</Toggle>
    </ToggleGroup>
  )
}
