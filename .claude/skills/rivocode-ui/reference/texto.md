# The interface text

The right piece with the wrong text is a wrong screen. This file says **what to
write inside** the components, and it is the part of the work no guard
measures: `tsc`, contrast, `check:classes` and the tests all pass on a message
that helps nobody.

## Contents

- The three sentences every screen writes
- The button says what will happen
- The button pair never repeats the same word with two meanings
- The error message names who failed and what to do
- The empty state is a door, not a notice
- Label, hint and placeholder
- Form: person, tense and length
- The text the piece writes by itself lives in `labels`

## The three sentences every screen writes

Every listing, every chart and every form writes these three, and they are what
the person reads on the worst days:

| Moment | Who writes it | What the sentence needs to have |
|---|---|---|
| It failed | `errorTitle` + `errorMessage` | what failed, who failed, and what to do now |
| There is nothing | `empty` (title + description) | why it is empty, and the way to stop being empty |
| No way back | `AlertDialog` title + description | the effect, who is notified, and that it cannot be undone |

## The button says what will happen

The label is a **verb with its object**, not a category. The person decides by
looking at the button, and "Confirmar" does not say what they are confirming.

| Instead of | Write |
|---|---|
| Confirmar | Emitir nota |
| Salvar | Salvar rascunho |
| OK | Entendi |
| Enviar | Enviar para a prefeitura |
| Sim | Cancelar nota |

When the action cannot be undone, the verb carries that: "Cancelar nota" and
not "Continuar".

## The button pair never repeats the same word with two meanings

It is the most expensive text defect there is, and it shows up exactly where it
hurts: in the box that confirms an irreversible action.

```tsx
<AlertDialogTitle>Cancelar a nota 4813?</AlertDialogTitle>
<AlertDialogDescription>
  A prefeitura recebe o cancelamento e o cliente é avisado. Não dá para desfazer.
</AlertDialogDescription>
<AlertDialogFooter>
  <AlertDialogClose render={<Button variant="secondary" />}>Manter nota</AlertDialogClose>
  <AlertDialogClose render={<Button variant="danger" />}>Cancelar nota</AlertDialogClose>
</AlertDialogFooter>
```

The escape button says **"Manter nota"** (keep the invoice). If it said
"Cancelar", the word would mean two opposite things inside the same box -
aborting the operation and cancelling the invoice - and the person would have
to guess which, on an action that notifies the city hall and cannot be undone.

The rule comes from that: **the escape names the state that remains**, not the
giving up. "Manter nota", "Continuar editando", "Ficar aqui". Never "Cancelar"
next to an action that is also called cancel.

In `Popconfirm`, and in the native package's `AlertDialog`, the pair is written
in `labels`, with the same keys in both:
`labels={{ confirm: "Cancelar nota", cancel: "Manter nota" }}`.

The title is a **question that names the object**: "Cancelar a nota 4813?", and
not "Tem certeza?". A number in the title is what lets someone find out they
clicked the wrong row.

## The error message names who failed and what to do

Two sentences, and each one has a job. It is the pattern the whole catalog
already uses, and it is not negotiated away by haste:

```tsx
<DataTable
  isError={query.isError}
  errorTitle="Não foi possível carregar as notas"
  errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
  onRetry={query.refetch}
  labels={{ retry: "Tentar de novo" }}
/>
```

- **`errorTitle`** says what failed, naming the object: "as notas", "o
  faturamento", "a agenda". Never "Erro" or "Algo deu errado".
- **`errorMessage`** says **who** failed and **what to do**: "A prefeitura não
  respondeu", "A consulta expirou", followed by "Tente de novo em alguns
  minutos". Who failed is what decides whether the person waits, fixes or calls
  someone.
- **`onRetry`** exists when retrying solves it. An error with no way out does
  not get a button, it gets the path: whom to look for, or where to look.

Never write an error code, a `stack` or an endpoint name on the screen. That is
for the log.

**A field error is different from a screen error**: the field one says the
accepted format ("Use o formato 00.000.000/0000-00"), and not "Valor inválido".
The person already knew it was invalid; what they do not know is what works.

## The empty state is a door, not a notice

The same component has two different texts, and swapping them is the common
mistake:

| Situation | Title | Description |
|---|---|---|
| There never was anything | "Nenhuma nota" | "Emita a primeira para ela aparecer." |
| The filter found nothing | "Nenhuma nota no período" | change the filter, and say which one |
| The search found nothing | "Nenhum cliente com esse nome" | - |

The first case is the person's first time in the product, and it deserves the
**action** along with it:

```tsx
<EmptyState
  title="Nenhuma nota"
  description="Emita a primeira para ela aparecer."
  action={<Button>Emitir nota</Button>}
/>
```

The second and the third do **not** take a create action: whoever filtered
wants the filter back, not a new record. And the text names the cut that found
nothing - "no período", "com esse nome" -, because that is what the person is
going to change.

The drawing follows the same split: the first case accepts `illustration`, and
the second and third take `icon`. When to use each one, and how to paint
without a literal color, is in
[design.md](design.md#icon-or-illustration-in-the-empty-state).

## Label, hint and placeholder

- **Label** names the field and is always visible. It is not a sentence, it has
  no colon: "CNPJ do cliente", not "Digite o CNPJ do cliente:".
- **Placeholder** is an **example**, never a label. It disappears on typing and
  several screen readers do not announce it: used as a label, the field ends up
  without a name. Use it to show the format: `00.000.000/0000-00`.
- **Hint** explains the consequence, it does not repeat the label. "Ela aparece
  no corpo da nota" works; "Informe a descrição" is worth nothing.
- **An icon's accessible text** says the action, not the drawing:
  `aria-label="Excluir nota"`, never `aria-label="Lixeira"`.

## Form: person, tense and length

- **Speak to the person, in the second person**: "Você ainda não emitiu nenhuma
  nota". The system does not talk about itself: no "Estamos processando".
- **Present tense, and active voice.** "A prefeitura não respondeu", not "Não
  foi possível que a resposta fosse obtida".
- **No blame and no scare.** Do not say the person made a mistake; say what
  works. An exclamation mark belongs in no system message.
- **Short sentence and none of our jargon.** "A consulta expirou", not "timeout
  no gateway".
- **PT-BR on the screen, code in English.** Ecosystem terms are not
  translated: it is "agents", not "agentes".
- **No dash in the screen's prose.** Two short sentences fit better in an alert
  than one long one with an aside.

## The text the piece writes by itself lives in `labels`

The name of a button the piece draws, what the screen reader hears, a fixed
phrase like "da etapa anterior": all of that is swapped through a single
object, `labels`, in both packages and with the same keys. Pass only the keys
that change.

```tsx
<QueryBoundary data={data} isError={isError} onRetry={refetch} labels={{ retry: "Carregar de novo" }}>
  {(invoices) => <InvoiceList invoices={invoices} />}
</QueryBoundary>
```

There is no loose prop ending in `Label` for interface text. What stays a prop
is content: the `label` that names the field, the toast's `title` and
`errorTitle`, the `placeholder`.

Dates have two halves. The month name, the weekday and the time come from
`locale` (a BCP 47 tag, `"en-US"`), in `EventCalendar` and `Gantt`, and the
web's `DatePicker` and `DateRangePicker` receive the calendar's `locale`. The
fixed words around them ("Hoje", "+2 mais", "Dia inteiro", "das 9h às 10h",
"12 a 18") are `labels`. Native has no `locale`: `Calendar`, `DatePicker` and
`DateRangePicker` swap the month names and the initials through
`labels.caption` and `labels.weekdays`.

```tsx
<EventCalendar
  events={events}
  locale="en-US"
  labels={{ today: "Today", week: "Week", events: (count) => `${count} events` }}
/>
```
