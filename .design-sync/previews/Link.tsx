import { Link, Text } from '@rivocode/ui'
import type { ComponentProps } from 'react'

function RouterLink({ to, ...props }: ComponentProps<'a'> & { to: string }) {
  return <a {...props} href={to} />
}

/** In a sentence */
export function InText() {
  return (
    <Text size="base" tone="muted" className="max-w-96">
      A nota foi autorizada. Veja o <Link href="#">espelho da nota</Link> ou volte para a{' '}
      <Link href="#">lista de emitidas</Link>.
    </Text>
  )
}

/** Leaving the site */
export function External() {
  return (
    <Text size="base" tone="muted">
      A consulta pública fica no{' '}
      <Link href="https://www.gov.br/nfse" external>
        Portal da NFS-e
      </Link>
      .
    </Text>
  )
}

/** Tones and underline on hover */
export function Tones() {
  return (
    <nav aria-label="Rodapé" className="flex gap-4 text-sm">
      <Link href="#" tone="neutral" underline="hover">
        Termos
      </Link>
      <Link href="#" tone="muted" underline="hover">
        Privacidade
      </Link>
      <Link href="#" tone="muted" underline="hover">
        Ajuda
      </Link>
    </nav>
  )
}

/** With the router's link */
export function WithRouter() {
  return (
    <Link render={<RouterLink to="/clientes" />}>Ver todos os clientes</Link>
  )
}
