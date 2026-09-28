import { Switch } from '@rivocode/ui'

/** Estados */
export function States() {
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
        Integração com a prefeitura
      </label>
    </div>
  )
}

/** Com rótulo */
export function WithText() {
  return (
    <div className="space-y-4">
      <Switch defaultChecked>Enviar o XML junto com o PDF</Switch>
      <Switch>Avisar por e-mail quando a nota for paga</Switch>
    </div>
  )
}
