import { Steps, type Passo } from '@rivocode/ui'

const PASSOS: Passo[] = [
  { id: 'cliente', title: 'Cliente', description: 'Quem recebe' },
  { id: 'servico', title: 'Servico', description: 'O que foi feito' },
  { id: 'revisao', title: 'Revisao', description: 'Conferir e emitir' },
]

export function NoMeio() {
  return (
    <div className="w-[32rem]">
      <Steps steps={PASSOS} current={1} onStepClick={() => {}} />
    </div>
  )
}
