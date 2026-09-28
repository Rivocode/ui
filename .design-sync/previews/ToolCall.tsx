import { ToolCall } from '@rivocode/ui/ai'
import { useState } from 'react'

/** Os estados */
export function States() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ToolCall name="buscar_notas" title="Consultando as notas de agosto" status="pending" />
      <ToolCall name="buscar_notas" title="Consultando as notas de agosto" status="running" />
      <ToolCall
        name="buscar_notas"
        title="Consultando as notas de agosto"
        status="done"
        input={{ mes: 8, ano: 2026, situacao: 'aberta' }}
        output={{ total: 3, valor: 5330 }}
      />
      <ToolCall
        name="consultar_prefeitura"
        title="Conferindo o código de serviço"
        status="error"
        input={{ codigo: '01.07' }}
        error="A prefeitura de João Pessoa não respondeu em 30 segundos."
      />
    </div>
  )
}

/** Aguardando aprovação */
export function AwaitingApproval() {
  const [status, setStatus] = useState<'approval' | 'running' | 'error'>('approval')

  return (
    <div className="w-full max-w-xl">
      <ToolCall
        name="emitir_nota"
        title="Emitir a nota da Clínica São Lucas"
        status={status}
        input={{ cliente: 'Clínica São Lucas', servico: '01.07', valor: 3400 }}
        error={status === 'error' ? 'Emissão recusada por você.' : undefined}
        onApprove={() => setStatus('running')}
        onReject={() => setStatus('error')}
      />
    </div>
  )
}
