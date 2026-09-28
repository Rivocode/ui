The same screen serves two uses that do not match. A sign-up page, which
someone fills in once, wants breathing room. An operations screen, where the
person spends the whole day, wants more rows to fit in the visible height.

Instead of two catalogs, the library has one switch:

```tsx
<RivoProvider density="comfortable">  {/* default */}
<RivoProvider density="compact">      {/* operations screen */}
```

## What changes

Density writes height and inner-spacing tokens that **every** control reads.
Button, field, menu item, table row, list item: none of them carries its own
pixel height.

| Token                 | Comfortable | Compact  |
| --------------------- | ----------- | -------- |
| `--rc-control-sm`     | 2rem        | 1.75rem  |
| `--rc-control-md`     | 2.5rem      | 2.25rem  |
| `--rc-control-lg`     | 3rem        | 2.75rem  |
| `--rc-item-y`         | 0.5rem      | 0.375rem |
| `--rc-gap-sm`         | 8px         | 6px      |
| `--rc-gap-md`         | 12px        | 8px      |
| `--rc-gap-lg`         | 16px        | 12px     |
| `--rc-gap-xl`         | 24px        | 16px     |

That is why the switch reaches the whole catalog at once, and why a new
component already obeys it on arrival: it asks for `h-[var(--rc-control-md)]`,
not `h-10`.

## What does not change

**Font size and touch target.** Compact shrinks the frame, not the letters. A
control that gets too small for a finger stops being dense and becomes
inaccessible, and that is not a screen preference.

## Mixing, when it makes sense

Density is inherited, and an inner `RivoProvider` can disagree with the outer
one:

```tsx
<RivoProvider density="comfortable">
  <SignUpForm />

  {/* the supporting table, alongside, fits more rows */}
  <RivoProvider scope="local" density="compact">
    <SupportingTable />
  </RivoProvider>
</RivoProvider>
```

Use it sparingly: two heights on the same screen need a clear visual boundary,
otherwise it looks like a defect.

## Where it usually pays off

- A listing with many rows, where scrolling is the cost
- A side panel of filters
- A screen the person uses all day and already knows by heart

And where it does not: the first screen, sign-up, a long form, anything someone
uses once and needs to read calmly.
