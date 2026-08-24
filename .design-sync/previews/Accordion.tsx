import { Accordion, AccordionItem } from '@rivocode/ui'

/** Perguntas */
export function Questions() {
  return (
    <div className="w-96">
      <Accordion defaultValue={['como-emitir']}>
        <AccordionItem value="como-emitir" title="Como emito uma nota?">
          Pelo botão Emitir nota, no topo da listagem. O rascunho fica salvo se você sair no meio.
        </AccordionItem>
        <AccordionItem value="cancelar" title="Da para cancelar depois?">
          Da, enquanto a prefeitura não fechar o mês. Depois disso, so com nota de substituição.
        </AccordionItem>
        <AccordionItem value="email" title="Quem recebe o email?">
          O endereço do cliente cadastrado, com cópia para o financeiro.
        </AccordionItem>
      </Accordion>
    </div>
  )
}
