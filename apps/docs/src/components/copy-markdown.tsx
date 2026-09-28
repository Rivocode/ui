import { Clipboard } from '@rivocode/ui'
import { useEffect, useState } from 'react'

/**
 * Copies the page's `.md`, the same one the agent reads at the address next to
 * it.
 *
 * The text is fetched on mount, not on click: Safari only accepts writing to
 * the clipboard inside the gesture, and a `fetch` in the middle of the click
 * already takes the write out of it. Until the text arrives the button stays
 * disabled, because copying nothing and confirming would be a lie.
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
      labels={{ copy: 'Copy as Markdown', copied: 'Markdown copied' }}
    >
      Copy as Markdown
    </Clipboard>
  )
}
