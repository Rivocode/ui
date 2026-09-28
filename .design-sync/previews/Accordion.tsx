import { Accordion, AccordionItem } from '@rivocode/ui'

/** Perguntas */
export function Questions() {
  return (
    <div className="w-96">
      <Accordion defaultValue={['como-emitir']}>
        <AccordionItem value="como-emitir" title="Como emito uma nota?">
          Pelo botão Emitir nota, no topo da listagem. O rascunho fica salvo se você sair no meio.
        </AccordionItem>
        <AccordionItem value="cancelar" title="Dá para cancelar depois?">
          Dá, enquanto a prefeitura não fechar o mês. Depois disso, só com nota de substituição.
        </AccordionItem>
        <AccordionItem value="email" title="Quem recebe o e-mail?">
          O endereço do cliente cadastrado, com cópia para o financeiro.
        </AccordionItem>
      </Accordion>
    </div>
  )
}
