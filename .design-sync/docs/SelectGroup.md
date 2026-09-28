---
category: Forms
---

# SelectGroup

A family inside the list, with `SelectGroupLabel` as its header.

Transaction types split into incoming and outgoing, states by region, a chart
of accounts by group: a long list that has real families reads in parts, and
not top to bottom.

The design is `ComboboxGroup`'s, and not `MenuGroup`'s with `label`: both are
form pieces that list options, and whoever swaps one for the other on finding
out the list grew should not have to rewrite the tree.

```tsx
<SelectContent>
  <SelectGroup>
    <SelectGroupLabel>Saída</SelectGroupLabel>
    <SelectItem value="5102">Venda de mercadoria</SelectItem>
    <SelectItem value="5915">Remessa para conserto</SelectItem>
  </SelectGroup>

  <SelectSeparator />

  <SelectGroup>
    <SelectGroupLabel>Entrada</SelectGroupLabel>
    <SelectItem value="1202">Devolução de venda</SelectItem>
  </SelectGroup>
</SelectContent>
```

The root's `items` is still the **whole, flat** list: it is through it that
the trigger translates the stored value into the label the person read. The
group arranges the open list, not what the trigger shows.

`SelectGroupLabel` lives inside the group because it is the group that points
`aria-labelledby` at it. A heading written alongside names nothing, and no type
complains.

## When not to use

When grouping is an attempt to tame a list that got too big, the remedy is a
different one: `Combobox`, which brings search. Scrolling through a hundred and
twenty cities arranged by region is still scrolling through a hundred and
twenty cities, and the header only adds height to the way.

A two-item group does not pay for the header it charges. Without real families,
the flat list says the same thing in fewer lines.
