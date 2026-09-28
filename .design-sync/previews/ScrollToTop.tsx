import { ScrollToTop } from '@rivocode/ui'
import { useState } from 'react'

const INVOICES = Array.from({ length: 40 }, (_, index) => ({
  number: 4800 + index,
  customer: ['Padaria Aurora', 'Clínica São Lucas', 'Mercado Tambaú', 'Transportes Cabo Branco'][
    index % 4
  ],
}))

/** Numa lista que rola por dentro */
export function InsideBox() {
  const [box, setBox] = useState<HTMLDivElement | null>(null)

  return (
    <div className="relative">
      <div
        ref={setBox}
        tabIndex={0}
        aria-label="Notas emitidas"
        className="h-72 overflow-y-auto rounded-md border border-border bg-surface"
      >
        <ul className="divide-y divide-border">
          {INVOICES.map((invoice) => (
            <li key={invoice.number} className="flex justify-between px-4 py-3 text-sm">
              <span className="font-mono text-fg">NF {invoice.number}</span>
              <span className="text-fg-muted">{invoice.customer}</span>
            </li>
          ))}
        </ul>
      </div>
      <ScrollToTop
        target={box}
        threshold={120}
        strategy="absolute"
        position={{ bottom: 16, right: 16 }}
        tooltip
      />
    </div>
  )
}
