import { NotificationCenter, type NotificationItem } from '@rivocode/ui'
import { FileCheck2, ShieldAlert, UserPlus } from 'lucide-react'
import { useState } from 'react'

const MINUTE = 60_000

const FIRST_PAGE: NotificationItem[] = [
  {
    id: '1',
    title: 'Nota 1042 autorizada',
    description: 'A prefeitura aceitou a nota da Padaria Aurora.',
    time: Date.now() - 5 * MINUTE,
    read: false,
    tone: 'success',
    icon: <FileCheck2 />,
  },
  {
    id: '2',
    title: 'Certificado digital vence em 5 dias',
    description: 'Renove antes de 29/09 para não parar a emissão.',
    time: Date.now() - 3 * 60 * MINUTE,
    read: false,
    tone: 'warning',
    icon: <ShieldAlert />,
  },
  {
    id: '3',
    title: 'Ana Beatriz entrou na equipe',
    time: Date.now() - 2 * 24 * 60 * MINUTE,
    read: true,
    icon: <UserPlus />,
  },
]

const OLDER: NotificationItem[] = [
  {
    id: '4',
    title: 'Relatório de agosto pronto',
    time: Date.now() - 20 * 24 * 60 * MINUTE,
    read: true,
  },
]

/** Sininho com a lista */
export function Center() {
  const [items, setItems] = useState(FIRST_PAGE)
  const [loadingMore, setLoadingMore] = useState(false)
  const hasMore = items.length < FIRST_PAGE.length + OLDER.length

  function markRead(id: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)))
  }

  function loadMore() {
    setLoadingMore(true)
    setTimeout(() => {
      setItems((current) => [...current, ...OLDER])
      setLoadingMore(false)
    }, 800)
  }

  return (
    <NotificationCenter
      items={items}
      onMarkRead={markRead}
      onMarkAllRead={() => setItems((current) => current.map((item) => ({ ...item, read: true })))}
      onItemClick={(item) => console.log('abrir', item.id)}
      hasMore={hasMore}
      onLoadMore={loadMore}
      isLoadingMore={loadingMore}
    />
  )
}

/** Vazio e carregando */
export function States() {
  return (
    <div className="flex items-center gap-4">
      <NotificationCenter items={[]} labels={{ trigger: 'Notificações (vazio)' }} />
      <NotificationCenter items={[]} isLoading labels={{ trigger: 'Notificações (carregando)' }} />
    </div>
  )
}
