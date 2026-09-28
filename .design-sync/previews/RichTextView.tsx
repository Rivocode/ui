import { Text } from '@rivocode/ui'
import { RichTextView } from '@rivocode/ui/editor'

const SAVED =
  '<h2>Consultoria de agosto</h2>' +
  '<p>Revisão do fechamento com <strong>ISS retido</strong>, conferência das notas de ' +
  'entrada e ajuste da alíquota em <code>aliquota_iss</code>.</p>' +
  '<h3>Entregas</h3>' +
  '<ol><li><p>Relatório de apuração</p></li><li><p>Planilha de conciliação</p></li></ol>' +
  '<blockquote><p>Pagamento por Pix em até 5 dias úteis.</p></blockquote>' +
  '<p>Detalhes em <a href="https://rivocode.com.br">rivocode.com.br</a>.</p>'

/** What the editor saved */
export function Saved() {
  return <RichTextView value={SAVED} className="max-w-prose" />
}

const HOSTILE =
  '<p style="color:red" onclick="alert(1)">Texto colado de fora, com ' +
  '<a href="javascript:alert(2)">um link que não abre</a>.</p><script>alert(3)</script>'

/** Outside HTML, without what is not text */
export function Hostile() {
  return <RichTextView value={HOSTILE} className="max-w-prose" />
}

/** Empty */
export function Empty() {
  return <RichTextView value="<p></p>" empty={<Text tone="muted">Sem descrição.</Text>} />
}
