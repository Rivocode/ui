---
category: Overlays
---

# PreviewCard

The card that appears when hovering over a link: who the customer is, what
that invoice is, the summary of the term.

**It is not a `Tooltip`.** The tooltip explains a button in a few words and
disappears on leave; the card shows content that can be read calmly, and that
is why it waits before opening and takes its time to close, so the pointer can
reach it.

Nothing that exists only here is reachable by touch, so the card can never be
the only path to a piece of information.

```tsx
<PreviewCard>
  <PreviewCardTrigger render={<a href="/clientes/4813" />}>Clinica Sao Lucas</PreviewCardTrigger>
  <PreviewCardContent>
    <p className="font-medium text-fg">Clinica Sao Lucas</p>
    <p className="text-sm text-fg-muted">12.345.678/0001-99, cliente desde 2023.</p>
  </PreviewCardContent>
</PreviewCard>
```

## In React Native

Does not port, by decision - it appears on resting the pointer, and there is no resting on touch. It is not queued: it will not exist. The [parity table](/react-native) gives the reason for each one.
