import { Clipboard } from '@rivocode/ui'
import { useEffect, useState } from 'react'

/**
 * Copia o `.md` da pagina, o mesmo que o agent le no endereco ao lado.
 *
 * O texto e buscado ao montar, e nao no clique: o Safari so aceita escrever na
 * area de transferencia dentro do gesto, e um `fetch` no meio do clique ja
 * tira a escrita de dentro dele. Enquanto o texto nao chega o botao fica
 * desabilitado, porque copiar o vazio e confirmar seria mentir.
 */
export function CopyMarkdown({ href }: { href: string }) {
  const [text, setText] = useState('')

  useEffect(() => {
    let alive = true
    setText('')
    fetch(href)
      .then((response) => (response.ok ? response.text() : ''))
      .then((body) => {
        if (alive) setText(body)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [href])

  return (
    <Clipboard
      value={text}
      disabled={!text}
      labels={{ copy: 'Copiar como Markdown', copied: 'Markdown copiado' }}
    >
      Copiar como Markdown
    </Clipboard>
  )
}
