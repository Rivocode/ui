---
category: Feedback
---

# NotificationCenter

O sininho do cabeçalho: diz quantas notificações a pessoa ainda não leu e abre
a lista delas. Na mesa a lista é um painel ancorado ao sino; no celular, uma
folha que sobe de baixo, como a do `DatePicker`.

```tsx
<NotificationCenter
  items={notificacoes}
  onMarkRead={(id) => marcarComoLida(id)}
  onMarkAllRead={marcarTodas}
  onItemClick={(item) => navegar(item)}
/>
```

**A peça não busca nada.** A lista entra por `items`, e o que a pessoa faz sai
por callback: marcar uma, marcar todas, abrir uma, trocar o filtro, pedir a
próxima página. Quem guarda o `read` e quem fala com o servidor é a aplicação.

## Cada notificação

| Campo         | O que faz                                                            |
| ------------- | -------------------------------------------------------------------- |
| `id`          | identifica nos callbacks                                             |
| `title`       | o que aconteceu; em negrito enquanto não foi lida                    |
| `description` | o detalhe, em até duas linhas                                        |
| `time`        | quando; sai como `RelativeTime`, "há 5 minutos", com a data no `title` |
| `read`        | já foi lida                                                          |
| `href`        | para onde leva; com ele, a linha vira link                           |
| `icon`        | o símbolo à esquerda; sem ele, o sino                                |
| `tone`        | pinta o símbolo no texto do estado: `info`, `success`, `warning`, `danger` |

A não lida tem três sinais, e nenhum deles é só cor: o ponto, o negrito e, para
o leitor de tela, "Não lida:" antes do título.

## O contador

O número do sino é o `Indicator` da casa, e ele some quando não há nada para
ler: uma pastilha com zero chama atenção para dizer que não há nada. Acima de
`max` (99) sai "99+".

O nome do botão diz a contagem por extenso, "3 notificações não lidas", e vira
só "Notificações" quando zera. Uma região viva educada repete a frase quando o
número muda, e quem usa leitor de tela fica sabendo que chegou coisa nova sem
precisar voltar ao sino.

`unreadCount` vence a conta dos itens carregados: é para quando o servidor sabe
que há 140 não lidas e a página só trouxe 20.

## Ler, marcar e filtrar

- **Abrir uma notificação conta como ler.** O clique chama `onItemClick` e,
  se ela não estava lida, `onMarkRead` junto, e fecha o painel.
- `onMarkRead` liga o botão de marcar em cada não lida, sem abrir.
- `onMarkAllRead` liga o "Marcar todas como lidas" no topo, que fica
  desabilitado quando não há o que marcar. Texto longo nele quebra a linha, e
  não vaza do painel com a tela ampliada.
- **Marcar não derruba o foco.** O botão de marcar some quando a notificação
  vira lida, e o foco vai para o link ou o botão da mesma linha; sem eles, para
  o próximo "Marcar como lida"; sem nenhum, para o filtro. O "Marcar todas"
  desabilita com o foco nele, e o foco vai para o filtro. Quem navega pelo
  teclado continua dentro do painel, e não volta ao começo da página.
- O filtro "Todas" e "Não lidas" filtra `items` sozinho. `filter` e
  `onFilterChange` controlam, para quem prefere buscar as não lidas no servidor.

## Os finais da consulta

- **Carregando** (`isLoading`): a lista vira marca de lugar, com `aria-busy`, e
  o leitor ouve "Carregando…". O vazio não aparece enquanto o dado não chegou.
- **Vazio**: um `EmptyState` que diz "Nenhuma notificação", ou "Tudo lido"
  quando o filtro de não lidas esvaziou.
- **Mais páginas**: `hasMore` com `onLoadMore` liga o "Carregar mais" no fim;
  `isLoadingMore` faz o botão girar e recusar o segundo clique.

```tsx
<NotificationCenter
  items={query.data?.items ?? []}
  isLoading={query.isLoading}
  unreadCount={query.data?.unread}
  hasMore={query.hasNextPage}
  onLoadMore={query.fetchNextPage}
  isLoadingMore={query.isFetchingNextPage}
  onMarkRead={marcar.mutate}
/>
```

## Partes

`classNames` alcança cada nó pelo nome: `trigger` (o sino), `panel` (o painel
ou a folha), `header`, `filters`, `list`, `item`, `footer` e `empty`.

## Textos

`labels` troca todos os textos: `title`, `trigger`, `unreadCount` (a função que
diz a contagem), `unreadItem`, `markRead`, `markAllRead`, `filter`, `all`,
`unread`, os dois vazios (`emptyTitle`, `emptyDescription`, `emptyUnreadTitle`,
`emptyUnreadDescription`) e `loadMore`.

## Quando não usar

- **Aviso que precisa ser visto agora** é `Toast`. O `Toast` passa na frente
  da tela; a notificação espera no sino até a pessoa ir buscar.
- **Aviso que fica na tela até o motivo acabar** é `Alert`, junto do trecho
  de que fala, ou `Banner`, no topo da página. O que está no sino some da
  vista assim que o painel fecha.
- **Só o número em cima de um ícone** é `Indicator`. Se não há lista para
  abrir, o sininho promete o que não tem.
- **O histórico de um registro** (quem emitiu, quem cancelou a nota) é
  `Timeline`. A notificação é da pessoa; a linha do tempo é da coisa.

## No React Native

Traduz, com a lista numa `Sheet` que sobe de baixo, que é o que o web já faz no celular. `items`, `unreadCount`, `onMarkRead`, `onMarkAllRead`, o filtro, `hasMore`, `onLoadMore`, `isLoadingMore`, `isLoading` e `labels` têm o mesmo nome e o mesmo sentido, e os textos saem da mesma fonte.

**`open` é controlado**, com `onOpenChange`, como em todo o pacote nativo. **O sino entra por `icon`**, porque o pacote não traz ícone, e a forma que pinta na cor do botão é a função: `icon={({ color, size }) => <Bell color={color} size={size} />}`.

**A linha não é link.** No celular quem navega é o router, então a notificação não tem `href`: `onItemPress` recebe o item e decide para onde ir. Abrir continua contando como ler, e a folha fecha.

A contagem é o nome do botão ("3 notificações não lidas"), e quando ela muda o leitor de tela ouve a frase nova pelo anúncio do sistema.

```tsx
<NotificationCenter
  items={notificacoes}
  open={aberto}
  onOpenChange={setAberto}
  icon={sino}
  onItemPress={abrir}
  onMarkRead={marcar}
/>
```
