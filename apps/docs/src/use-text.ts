/* ---------------------------------------------------------------------------
 * Texto que chega depois
 *
 * A prosa das pecas e dos guias deixou o chunk de entrada (ver o `catalog.ts`),
 * entao toda pagina que a mostra passa por aqui. `null` e "ainda carregando", e
 * string vazia e "nao ha o que mostrar" - a pagina precisa distinguir os dois
 * para nao piscar o vazio antes do texto.
 * ------------------------------------------------------------------------- */

import { useEffect, useState } from 'react'

export function useText(load: (() => Promise<string>) | undefined) {
  const [text, setText] = useState<string | null>(load ? null : '')

  useEffect(() => {
    if (!load) {
      setText('')
      return
    }

    let alive = true
    setText(null)
    load().then(
      (loaded) => alive && setText(loaded),
      // Falha de rede num chunk de texto some a prosa, e nao a pagina.
      () => alive && setText(''),
    )

    return () => {
      alive = false
    }
  }, [load])

  return text
}
