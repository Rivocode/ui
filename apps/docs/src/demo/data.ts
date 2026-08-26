/* ---------------------------------------------------------------------------
 * Os dados da demonstracao
 *
 * Inventados, mas com a forma da coisa real: nomes brasileiros, valores que
 * cabem na moeda, datas dentro de um mes. Demonstracao cheia de "Lorem ipsum" e
 * "Item 1" le como maquete, e maquete nao responde a pergunta com que a pessoa
 * chegou, que e se isto se sustenta numa tela de verdade.
 * ------------------------------------------------------------------------- */

export type Status = 'paid' | 'open' | 'overdue' | 'draft'

export type Invoice = {
  id: string
  number: string
  customer: string
  document: string
  issuedAt: string
  dueAt: string
  amount: number
  status: Status
}

export const STATUS_LABEL: Record<Status, string> = {
  paid: 'Paga',
  open: 'Aberta',
  overdue: 'Vencida',
  draft: 'Rascunho',
}

export const STATUS_TONE = {
  paid: 'success',
  open: 'info',
  overdue: 'danger',
  draft: 'neutral',
} as const

const CUSTOMERS: Array<[string, string]> = [
  ['Prefeitura de João Pessoa', '08.778.326/0001-56'],
  ['Clínica São Lucas', '12.345.678/0001-90'],
  ['Transportes Cabo Branco', '23.456.789/0001-01'],
  ['Supermercado Tambaú', '34.567.890/0001-12'],
  ['Construtora Manaíra', '45.678.901/0001-23'],
  ['Colégio Sagrado Coração', '56.789.012/0001-34'],
  ['Farmácias Bessa', '67.890.123/0001-45'],
  ['Auto Peças Cruz das Armas', '78.901.234/0001-56'],
  ['Hotel Ponta do Seixas', '89.012.345/0001-67'],
  ['Padaria Jaguaribe', '90.123.456/0001-78'],
  ['Laboratório Epitácio', '01.234.567/0001-89'],
  ['Óticas Bancários', '11.222.333/0001-44'],
]

const STATUSES: Status[] = ['paid', 'paid', 'open', 'overdue', 'paid', 'open', 'draft', 'paid']

/**
 * Deterministico, e de proposito nao aleatorio: a mesma tela a cada recarga faz
 * de um defeito da demonstracao um defeito que da para apontar, e nao um que se
 * mexeu de lugar.
 */
export const INVOICES: Invoice[] = Array.from({ length: 48 }, (_, index) => {
  const [customer, document] = CUSTOMERS[index % CUSTOMERS.length]
  const day = ((index * 3) % 27) + 1
  const amount = 480 + ((index * 1373) % 24_000) + (index % 7) * 111

  return {
    id: String(4801 + index),
    number: String(4801 + index),
    customer,
    document,
    issuedAt: `${String(day).padStart(2, '0')}/08/2026`,
    dueAt: `${String(((day + 12) % 28) + 1).padStart(2, '0')}/09/2026`,
    amount,
    status: STATUSES[index % STATUSES.length],
  }
})

export const MONTHLY = [
  { month: 'Mar', billed: 128_400, received: 119_200 },
  { month: 'Abr', billed: 154_800, received: 141_500 },
  { month: 'Mai', billed: 142_300, received: 138_900 },
  { month: 'Jun', billed: 188_600, received: 170_400 },
  { month: 'Jul', billed: 205_100, received: 191_800 },
  { month: 'Ago', billed: 246_700, received: 198_300 },
]

export const BY_KIND = [
  { kind: 'Serviço', total: 148_200 },
  { kind: 'Produto', total: 62_400 },
  { kind: 'Locação', total: 24_600 },
  { kind: 'Frete', total: 11_500 },
]

export const total = (status?: Status) =>
  INVOICES.filter((invoice) => !status || invoice.status === status).reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  )

/** Os cinco que mais faturaram no mês, já somados e ordenados. */
export const TOP_CUSTOMERS = [
  { name: 'Prefeitura de João Pessoa', total: 48_200 },
  { name: 'Construtora Manaíra', total: 36_900 },
  { name: 'Supermercado Tambaú', total: 28_400 },
  { name: 'Clínica São Lucas', total: 21_700 },
  { name: 'Hotel Ponta do Seixas', total: 17_300 },
]
