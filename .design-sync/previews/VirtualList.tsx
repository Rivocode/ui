import {
  Badge,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  VirtualList,
  type VirtualListHandle,
} from '@rivocode/ui'
import { useRef } from 'react'

type Event = {
  id: string
  at: string
  level: 'info' | 'erro'
  message: string
}

const EVENTS: Event[] = Array.from({ length: 4000 }, (_, index) => ({
  id: String(index),
  at: new Date(Date.UTC(2026, 7, 26, 0, 0, index)).toISOString().slice(11, 19),
  level: index % 37 === 0 ? 'erro' : 'info',
  message: `Nota ${9000 + index} enviada para a prefeitura`,
}))

/** Quatro mil itens */
export function Long() {
  return (
    <VirtualList
      items={EVENTS}
      itemKey={(event) => event.id}
      maxHeight={360}
      label="Log de envio de notas"
      renderItem={(event) => (
        <Item className="px-3">
          <ItemContent>
            <ItemTitle>{event.message}</ItemTitle>
            <ItemDescription>{event.at}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Badge tone={event.level === 'erro' ? 'danger' : 'neutral'}>{event.level}</Badge>
          </ItemActions>
        </Item>
      )}
    />
  )
}

type Note = {
  id: string
  customer: string
  reason: string
}

const REASONS = [
  'Rejeitada pela prefeitura por divergência no código de serviço informado na emissão.',
  'Aguardando retorno.',
  'Cancelada a pedido do cliente depois de duas tentativas de reenvio no mesmo dia.',
  'Emitida.',
]

const NOTES: Note[] = Array.from({ length: 2000 }, (_, index) => ({
  id: String(index),
  customer: `Cliente ${index + 1}`,
  reason: REASONS[index % REASONS.length]!,
}))

/** Texto que quebra em duas linhas */
export function Measured() {
  return (
    <VirtualList
      items={NOTES}
      itemKey={(note) => note.id}
      maxHeight={360}
      itemHeight={64}
      label="Notas com pendência"
      renderItem={(note) => (
        <div className="flex flex-col gap-1 border-b border-border px-3 py-3">
          <p className="text-base text-fg">{note.customer}</p>
          <p className="text-sm text-fg-muted">{note.reason}</p>
        </div>
      )}
    />
  )
}

/** Altura cravada, sem medir */
export function FixedHeight() {
  return (
    <VirtualList
      items={EVENTS}
      itemKey={(event) => event.id}
      maxHeight={360}
      itemHeight={36}
      measure={false}
      label="Log em altura fixa"
      renderItem={(event) => (
        <div className="flex h-full items-center gap-3 px-3 font-mono text-sm text-fg-muted">
          <span>{event.at}</span>
          <span className="truncate text-fg">{event.message}</span>
        </div>
      )}
    />
  )
}

/** Com respiro entre os itens */
export function Spaced() {
  return (
    <VirtualList
      items={EVENTS}
      itemKey={(event) => event.id}
      maxHeight={360}
      itemHeight={72}
      gap={8}
      className="border-none bg-transparent"
      classNames={{ item: 'px-1' }}
      label="Log em cartões"
      renderItem={(event) => (
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>{event.message}</ItemTitle>
            <ItemDescription>{event.at}</ItemDescription>
          </ItemContent>
        </Item>
      )}
    />
  )
}

/** Ir até um item que não está na tela */
export function ScrollToItem() {
  const list = useRef<VirtualListHandle>(null)

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => list.current?.scrollToIndex(0)}>
          Primeiro
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => list.current?.scrollToIndex(EVENTS.length - 1, { align: 'end' })}
        >
          Último
        </Button>
      </div>
      <VirtualList
        ref={list}
        items={EVENTS}
        itemKey={(event) => event.id}
        maxHeight={320}
        label="Log de envio de notas"
        renderItem={(event, index) => (
          <div className="flex items-center gap-3 px-3 py-2 text-base">
            <span className="w-14 shrink-0 font-mono text-sm text-fg-subtle">{index + 1}</span>
            <span className="truncate text-fg">{event.message}</span>
          </div>
        )}
      />
    </div>
  )
}

/** Carregando */
export function Loading() {
  return (
    <VirtualList<Event>
      items={undefined}
      itemKey={(event) => event.id}
      maxHeight={240}
      skeletonItems={4}
      itemHeight={56}
      renderItem={(event) => <p>{event.message}</p>}
    />
  )
}

/** Erro */
export function Error() {
  return (
    <VirtualList<Event>
      items={undefined}
      isError
      onRetry={() => {}}
      errorTitle="Não foi possível carregar o log"
      errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
      itemKey={(event) => event.id}
      maxHeight={240}
      renderItem={(event) => <p>{event.message}</p>}
    />
  )
}

/** Vazio */
export function Empty() {
  return (
    <VirtualList<Event>
      items={[]}
      itemKey={(event) => event.id}
      maxHeight={240}
      renderItem={(event) => <p>{event.message}</p>}
      empty={{
        title: 'Nenhum evento por aqui',
        description: 'Quando a primeira nota for enviada, o envio dela aparece nesta lista.',
        action: <Button size="sm">Emitir nota</Button>,
      }}
    />
  )
}
