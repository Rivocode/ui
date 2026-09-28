---
category: Feedback
---

# CookieConsent

The cookie consent notice, in the LGPD mold: a panel pinned to the bottom of
the screen, with the text, the privacy policy link and three ways out,
"Aceitar todos", "Recusar não essenciais" and "Personalizar", which opens the
categories one by one.

```tsx
const [choice, setChoice] = useState(() => readChoice())

<CookieConsent
  open={choice === null}
  policyHref="/privacidade"
  onDecision={(next) => {
    saveChoice(next)
    setChoice(next)
  }}
/>
```

**The component writes no cookie at all.** It shows the notice and returns the
choice through `onDecision`; storing the choice, loading only the accepted
scripts and closing the notice is the caller's job. `open` is controlled: open
it when there is no stored choice, or when the person asks to review theirs
through a "Preferências de cookies" link in the footer.

## The choice

`onDecision` receives `{ action, categories }`. `action` says which button
decided (`acceptAll`, `rejectOptional` or `save`), and `categories` carries one
key per category, with `true` for what was accepted:

```tsx
{ action: 'rejectOptional', categories: { necessary: true, analytics: false, marketing: false } }
```

The required category always comes back `true`, with any of the three
buttons. Also store the date and the version of the policy the person saw: if
the policy changes, the date is what says the choice needs to be asked again.

## Rejecting is as easy as accepting

"Aceitar todos" and "Recusar não essenciais" render side by side, with the
same size, the same variant and the same weight. Neither one is the highlighted
button. That is what the ANPD cookie guide asks for, and it is the difference
between consent and an interface trick: rejecting cannot cost one more click
nor require opening "Personalizar".

In "Personalizar", only the required ones start on. A switch that comes already
on is not a choice, and the LGPD asks for active consent. For whoever reopens
the notice, `defaultValue` takes the stored choice and the switches start the
way the person left them.

## Categories

Without `categories`, the notice brings three, in `defaultCookieCategories`:
**Necessários** (required, always on and with no switch to turn it off),
**Análise** and **Marketing**. Replace them with your product's, each with what
it does in one sentence:

```tsx
<CookieConsent
  open={open}
  policyHref="/privacidade"
  onDecision={decide}
  categories={[
    { id: 'necessary', label: 'Necessários', description: 'Sessão, segurança e esta escolha.', required: true },
    { id: 'analytics', label: 'Análise', description: 'Quais telas são usadas, sem identificar você.' },
    { id: 'support', label: 'Chat de suporte', description: 'O balão de conversa no canto da tela.' },
  ]}
/>
```

## Focus and keyboard

On opening, focus goes to the notice, and the screen reader reads the title
and the text. **It does not trap the page**: it is a non-modal dialog
(`aria-modal="false"`), with no dimmed backdrop and no focus trap, and whoever
wants to read the page before deciding keeps reading. Tab leaves the notice for
the page normally.

**Esc does not dismiss.** Closing without choosing would leave the person not
knowing what was decided for them, and the notice would come back on the next
page. What closes it is the choice. When the notice closes with focus inside
it, focus returns to where it was before it opened.

It comes in rising with the enter curve of the motion tokens and leaves with
the exit one, and stacks at `--rc-z-overlay`: above the content and a stuck
bar, and below dialogs and toasts.

## Parts

`classNames` reaches each node by name: `panel`, `title`, `description`,
`policy`, `categories`, `category` and `actions`. `className` dresses the
fixed outer strip.

## When not to use

- **A page notice without a choice** (maintenance, overdue invoice) is
  `Banner`. `CookieConsent` exists to collect a decision, and `Banner` only
  informs.
- **A cookie wall**, which blocks the page until the person accepts, is not
  this notice and is not `AlertDialog`: making access conditional on accepting
  goes against the free consent the LGPD asks for. If the product does not work
  without the necessary cookies, they are necessary, and need no acceptance.
- **Confirming that the choice was saved** is `Toast`, if something needs to be
  said. Most of the time the notice disappearing already says it.

## In React Native

Does not port, by decision. An app has no browser cookie to ask permission for: tracking consent on the phone is the platform's own prompt, App Tracking Transparency on iOS, requested through `expo-tracking-transparency`, and the data declaration in the store on Android. A panel drawn by the library on top of that would be a second request for the same thing.

If the app opens web pages in a `WebView`, the notice is the page's, which runs the web `@rivocode/ui`.
