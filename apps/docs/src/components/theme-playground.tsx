import { Badge, Button, Card, CardContent, Input, RivoProvider } from '@rivocode/ui'
import { useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
 * Theme playground
 *
 * Same tree, both themes, plus the tokens read from the browser rather than
 * copied into a table. A swatch list typed by hand drifts from the CSS on the
 * first tweak; this one cannot, because it asks the element for its value.
 * ------------------------------------------------------------------------- */

const ROLES: Array<{ token: string; role: string }> = [
  { token: '--rc-bg', role: 'fundo da página' },
  { token: '--rc-surface', role: 'cartão, painel, campo' },
  { token: '--rc-surface-raised', role: 'o que salta do resto' },
  { token: '--rc-fg', role: 'texto principal' },
  { token: '--rc-fg-muted', role: 'texto de apoio' },
  { token: '--rc-fg-subtle', role: 'rótulo, legenda' },
  { token: '--rc-accent', role: 'preenchimento da marca' },
  { token: '--rc-accent-fg', role: 'texto sobre o acento' },
  { token: '--rc-accent-text', role: 'acento que se lê no fundo' },
  { token: '--rc-border', role: 'linha' },
  { token: '--rc-success', role: 'deu certo' },
  { token: '--rc-warning', role: 'atenção' },
  { token: '--rc-danger', role: 'erro, destrutivo' },
]

const THEMES = [
  { value: 'rivocode-dark', label: 'Escuro' },
  { value: 'rivocode-light', label: 'Claro' },
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
      <h2 className="font-display text-xl text-fg">Ver nos dois temas</h2>
      <p className="mt-2 text-fg-muted">
        As mesmas peças, e os tokens lidos do navegador, não uma tabela copiada à mão.
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
              <Button variant="destructive">Excluir</Button>
              <Badge tone="success">Paga</Badge>
              <Badge tone="warning">Vence em 3 dias</Badge>
            </div>

            <Card>
              <CardContent className="space-y-3">
                <p className="text-fg">Uma superfície, com texto e campo dentro.</p>
                <p className="text-sm text-fg-muted">
                  O apoio usa outro papel de texto, e continua legível nos dois temas.
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
