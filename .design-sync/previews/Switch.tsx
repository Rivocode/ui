import { Switch } from '@rivocode/ui'

export function Estados() {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-3 text-base text-fg">
        <Switch defaultChecked />
        Avisar por email quando a nota for paga
      </label>
      <label className="flex items-center gap-3 text-base text-fg">
        <Switch />
        Emitir em nome do cliente
      </label>
      <label className="flex items-center gap-3 text-base text-fg-disabled">
        <Switch disabled defaultChecked />
        Integracao com a prefeitura
      </label>
    </div>
  )
}
