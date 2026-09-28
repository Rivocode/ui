import { TableOfContents } from '@rivocode/ui'
import { useState } from 'react'

const SECTIONS = [
  {
    id: 'guia-emissao',
    title: 'Emissão',
    children: [
      { id: 'guia-dados-do-tomador', title: 'Dados do tomador' },
      { id: 'guia-impostos', title: 'Impostos e retenções' },
    ],
  },
  {
    id: 'guia-envio',
    title: 'Envio ao cliente',
    children: [{ id: 'guia-email', title: 'Por e-mail' }],
  },
  { id: 'guia-cancelamento', title: 'Cancelamento', children: [] },
]

const FILLER =
  'A nota sai com o código de serviço da prefeitura, o valor e as retenções que o contrato ' +
  'prevê. Confira o tomador antes de emitir: depois de autorizada, a correção é uma carta ' +
  'e não uma edição.'

function Article({ onBox }: { onBox: (node: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={onBox}
      tabIndex={0}
      aria-label="Guia de emissão"
      className="h-72 overflow-y-auto rounded-md border border-border bg-surface p-4"
    >
      {SECTIONS.map((section) => (
        <section key={section.id} className="mb-6">
          <h4 id={section.id} className="mb-2 font-display text-lg text-fg">
            {section.title}
          </h4>
          <p className="text-sm text-fg-muted">{FILLER}</p>
          {section.children.map((child) => (
            <div key={child.id} className="mt-4">
              <h5 id={child.id} className="mb-1 text-sm font-medium text-fg">
                {child.title}
              </h5>
              <p className="text-sm text-fg-muted">{FILLER}</p>
              <p className="mt-2 text-sm text-fg-muted">{FILLER}</p>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

/** Lendo os títulos da página */
export function ReadsHeadings() {
  const [box, setBox] = useState<HTMLDivElement | null>(null)

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_12rem]">
      <Article onBox={setBox} />
      <TableOfContents container={box} root={box} selector="h4, h5" />
    </div>
  )
}

/** Lista pronta, sem título visível */
export function ReadyList() {
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_12rem]">
      <Article onBox={setBox} />
      <div className="flex flex-col gap-3">
        <TableOfContents
          root={box}
          hideLabel
          label="Seções do guia"
          onActiveChange={setActive}
          items={SECTIONS.map((section) => ({ id: section.id, label: section.title, level: 1 }))}
        />
        <p className="text-xs text-fg-subtle">Seção atual: {active ?? 'nenhuma'}</p>
      </div>
    </div>
  )
}
