import { Toggle, ToggleGroup } from '@rivocode/ui'

/** Display mode */
export function ViewMode() {
  return (
    <ToggleGroup defaultValue={['lista']}>
      <Toggle value="lista">Lista</Toggle>
      <Toggle value="grade">Grade</Toggle>
      <Toggle value="calendario">Calendário</Toggle>
    </ToggleGroup>
  )
}
