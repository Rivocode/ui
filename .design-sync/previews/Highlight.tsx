import { Highlight, SearchInput, matchesSearch } from '@rivocode/ui'
import { useState } from 'react'

const CUSTOMERS = [
  'Clínica São Lucas',
  'Padaria Aurora',
  'Transportes Cabo Branco',
  'Escola Pequeno Príncipe',
  'Mercado São João',
  'Açaí da Praça',
]

/** A busca que marca o que achou */
export function Search() {
  const [query, setQuery] = useState('sao')
  const found = CUSTOMERS.filter((name) => matchesSearch(name, query))

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <SearchInput
        aria-label="Buscar cliente"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onClear={() => setQuery('')}
      />
      <ul className="flex flex-col gap-1 text-base text-fg">
        {found.map((name) => (
          <li key={name}>
            <Highlight query={query}>{name}</Highlight>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Vários termos num parágrafo */
export function ManyTerms() {
  return (
    <p className="max-w-prose text-base text-fg-muted">
      <Highlight query={['nota', 'cancelada']}>
        A nota fiscal 1042 foi cancelada dentro do prazo. A nota 1043 segue válida, e o XML
        de cancelamento da primeira já está no painel.
      </Highlight>
    </p>
  )
}
