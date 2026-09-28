import { Badge, Button, Card, CardContent, Input, RivoProvider } from '@rivocode/ui'
import { useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
 * The theme lab
 *
 * The same tree, both themes, plus the tokens read from the browser instead of
 * copied into a table. A hand-typed swatch list drifts from the CSS at the
 * first tweak; this one cannot, because it asks the element for the value.
 * ------------------------------------------------------------------------- */

const ROLES: Array<{ token: string; role: string }> = [
  { token: '--rc-bg', role: 'page background' },
  { token: '--rc-surface', role: 'card, panel, field' },
  { token: '--rc-surface-raised', role: 'what stands out from the rest' },
  { token: '--rc-fg', role: 'main text' },
  { token: '--rc-fg-muted', role: 'supporting text' },
  { token: '--rc-fg-subtle', role: 'label, caption' },
  { token: '--rc-accent', role: 'brand fill' },
  { token: '--rc-accent-fg', role: 'text on the accent' },
  { token: '--rc-accent-text', role: 'accent readable on the background' },
  { token: '--rc-border', role: 'line' },
  { token: '--rc-success', role: 'it worked' },
  { token: '--rc-warning', role: 'attention' },
  { token: '--rc-danger', role: 'error, destructive' },
]

const THEMES = [
  { value: 'rivocode-dark', label: 'Dark' },
  { value: 'rivocode-light', label: 'Light' },
] as const

type Theme = (typeof THEMES)[number]['value']

export function ThemePlayground() {
  const [theme, setTheme] = useState<Theme>('rivocode-dark')
  const stage = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const node = stage.current
    if (!node) return

    // Read after paint: the theme attribute has to be on the element before
    // the computed value means anything.
    const frame = requestAnimationFrame(() => {
      const computed = getComputedStyle(node)
      const read: Record<string, string> = {}
      for (const { token } of ROLES) read[token] = computed.getPropertyValue(token).trim()
      setValues(read)
    })

    return () => cancelAnimationFrame(frame)
  }, [theme])

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl text-fg">See it in both themes</h2>
      <p className="mt-2 text-fg-muted">
        The same pieces, and the tokens read from the browser, not a table copied by hand.
      </p>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
          {THEMES.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={theme === option.value ? 'secondary' : 'ghost'}
              onClick={() => setTheme(option.value)}
              aria-pressed={theme === option.value}
            >
              {option.label}
            </Button>
          ))}
          <code className="ml-auto font-mono text-xs text-fg-subtle">theme="{theme}"</code>
        </div>

        <RivoProvider scope="local" theme={theme}>
          <div ref={stage} className="space-y-6 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button>Emitir nota</Button>
              <Button variant="outline">Cancelar</Button>
              <Button variant="danger">Excluir</Button>
              <Badge tone="success">Paga</Badge>
              <Badge tone="warning">Vence em 3 dias</Badge>
            </div>

            <Card>
              <CardContent className="space-y-3">
                <p className="text-fg">A surface, with text and a field inside.</p>
                <p className="text-sm text-fg-muted">
                  Supporting text uses another text role, and stays readable in both themes.
                </p>
                <Input placeholder="Buscar cliente" />
              </CardContent>
            </Card>

            <div className="grid gap-2 sm:grid-cols-2">
              {ROLES.map(({ token, role }) => (
                <div key={token} className="flex items-center gap-3">
                  <span
                    className="size-8 shrink-0 rounded-md border border-border"
                    style={{ background: `var(${token})` }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <code className="block truncate font-mono text-xs text-fg">{token}</code>
                    <span className="block truncate text-xs text-fg-subtle">
                      {role}
                      {values[token] ? ` · ${values[token]}` : ''}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </RivoProvider>
      </div>
    </section>
  )
}
