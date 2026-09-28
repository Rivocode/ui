---
category: Feedback
---

# NotificationCenter

The header's little bell: it says how many notifications the person has not
read yet and opens the list of them. On desktop the list is a panel anchored to
the bell; on a phone, a sheet that rises from the bottom, like the one in
`DatePicker`.

```tsx
<NotificationCenter
  items={notificacoes}
  onMarkRead={(id) => marcarComoLida(id)}
  onMarkAllRead={marcarTodas}
  onItemClick={(item) => navegar(item)}
/>
```

**The piece fetches nothing.** The list comes in through `items`, and what the
person does goes out through callbacks: marking one, marking all, opening one,
changing the filter, asking for the next page. The application is what holds
`read` and talks to the server.

## Each notification

| Field         | What it does                                                         |
| ------------- | -------------------------------------------------------------------- |
| `id`          | identifies it in the callbacks                                       |
| `title`       | what happened; in bold while unread                                  |
| `description` | the detail, in up to two lines                                       |
| `time`        | when; renders as `RelativeTime`, "há 5 minutos", with the date in `title` |
| `read`        | has already been read                                                |
| `href`        | where it leads; with it, the row becomes a link                      |
| `icon`        | the symbol on the left; without it, the bell                         |
| `tone`        | paints the symbol in the status text color: `info`, `success`, `warning`, `danger` |

An unread one has three signals, and none of them is color alone: the dot, the
bold and, for the screen reader, "Não lida:" before the title.

## The counter

The bell's number is the house `Indicator`, and it disappears when there is
nothing to read: a pill with zero draws attention to say there is nothing.
Above `max` (99) it shows "99+".

The button's name spells out the count, "3 notificações não lidas", and
becomes just "Notificações" when it reaches zero. A polite live region repeats
the sentence when the number changes, and a screen reader user finds out that
something new arrived without having to go back to the bell.

`unreadCount` beats the count of loaded items: it is for when the server knows
there are 140 unread and the page only brought 20.

## Reading, marking and filtering

- **Opening a notification counts as reading it.** The click calls
  `onItemClick` and, if it was not read, `onMarkRead` along with it, and closes
  the panel.
- `onMarkRead` turns on the mark button on each unread one, without opening it.
- `onMarkAllRead` turns on "Marcar todas como lidas" at the top, which is
  disabled when there is nothing to mark. Long text on it wraps, and does not
  overflow the panel with the screen zoomed in.
- **Marking does not drop focus.** The mark button disappears when the
  notification becomes read, and focus goes to the link or button on the same
  row; without them, to the next "Marcar como lida"; without any, to the
  filter. "Marcar todas" disables with focus on it, and focus goes to the
  filter. A keyboard user stays inside the panel, and does not go back to the
  top of the page.
- The "Todas" and "Não lidas" filter filters `items` on its own. `filter` and
  `onFilterChange` control it, for whoever prefers to fetch the unread ones on
  the server.

## The query's outcomes

- **Loading** (`isLoading`): the list becomes placeholders, with `aria-busy`,
  and the reader hears "Carregando…". The empty state does not appear while the
  data has not arrived.
- **Empty**: an `EmptyState` that says "Nenhuma notificação", or "Tudo lido"
  when the unread filter emptied out.
- **More pages**: `hasMore` with `onLoadMore` turns on "Carregar mais" at the
  end; `isLoadingMore` makes the button spin and refuse a second click.

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

## Parts

`classNames` reaches each node by name: `trigger` (the bell), `panel` (the
panel or the sheet), `header`, `filters`, `list`, `item`, `footer` and `empty`.

## Texts

`labels` swaps all the texts: `title`, `trigger`, `unreadCount` (the function
that states the count), `unreadItem`, `markRead`, `markAllRead`, `filter`,
`all`, `unread`, the two empties (`emptyTitle`, `emptyDescription`,
`emptyUnreadTitle`, `emptyUnreadDescription`) and `loadMore`.

## When not to use

- **A notice that needs to be seen now** is `Toast`. The `Toast` jumps in front
  of the screen; the notification waits in the bell until the person goes
  looking for it.
- **A notice that stays on screen until its cause is gone** is `Alert`, next to
  the part it talks about, or `Banner`, at the top of the page. What is in the
  bell disappears from view as soon as the panel closes.
- **Just the number on top of an icon** is `Indicator`. If there is no list to
  open, the little bell promises what it does not have.
- **The history of a record** (who issued, who cancelled the invoice) is
  `Timeline`. The notification belongs to the person; the timeline belongs to
  the thing.

## In React Native

Translates, with the list in a `Sheet` that rises from the bottom, which is what the web already does on the phone. `items`, `unreadCount`, `onMarkRead`, `onMarkAllRead`, the filter, `hasMore`, `onLoadMore`, `isLoadingMore`, `isLoading` and `labels` have the same name and the same meaning, and the texts come from the same source.

**`open` is controlled**, with `onOpenChange`, as in the whole native package. **The bell comes in through `icon`**, because the package ships no icons, and the form that paints in the button's color is the function: `icon={({ color, size }) => <Bell color={color} size={size} />}`.

**The row is not a link.** On the phone the router is what navigates, so the notification has no `href`: `onItemPress` receives the item and decides where to go. Opening still counts as reading, and the sheet closes.

The count is the button's name ("3 notificações não lidas"), and when it changes the screen reader hears the new sentence through the system announcement.

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

The parts are styled through the same `classNames` as the web: `trigger`, `panel`, `header`, `filters`, `list`, `item` and `empty`. `className` stays on the bell button, the same node as `trigger`. `footer` does not exist here: "Carregar mais" sits directly in the sheet, with no strip of its own.
