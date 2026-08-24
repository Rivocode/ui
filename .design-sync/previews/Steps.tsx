import { Steps, type Passo } from '@rivocode/ui'

const PASSOS: Passo[] = [
  { id: 'cliente', title: 'Cliente', description: 'Quem recebe' },
  { id: 'servico', title: 'Serviço', description: 'O que foi feito' },
  { id: 'revisao', title: 'Revisão', description: 'Conferir e emitir' },
]

/** No meio */
export function InTheMiddle() {
  return (
    <div className="w-[32rem]">
      <Steps steps={PASSOS} current={1} onStepClick={() => {}} />
    </div>
  )
}
