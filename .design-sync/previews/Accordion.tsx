import { Accordion, AccordionItem } from '@rivocode/ui'

export function Perguntas() {
  return (
    <div className="w-96">
      <Accordion defaultValue={['como-emitir']}>
        <AccordionItem value="como-emitir" title="Como emito uma nota?">
          Pelo botao Emitir nota, no topo da listagem. O rascunho fica salvo se voce sair no meio.
        </AccordionItem>
        <AccordionItem value="cancelar" title="Da para cancelar depois?">
          Da, enquanto a prefeitura nao fechar o mes. Depois disso, so com nota de substituicao.
        </AccordionItem>
        <AccordionItem value="email" title="Quem recebe o email?">
          O endereco do cliente cadastrado, com copia para o financeiro.
        </AccordionItem>
      </Accordion>
    </div>
  )
}
