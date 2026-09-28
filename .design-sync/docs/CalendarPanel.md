---
category: Forms
---

# CalendarPanel

The calendar's shell: a panel anchored on desktop, a bottom sheet on a phone.

`DatePicker` and `DateRangePicker` already use it inside. It is exported so
the date picker your screen invents (a report's period filter, a scheduling
calendar) keeps switching format the same way the house ones do.

The switch is of format, not of content. A calendar anchored to a field near
the bottom of a phone screen opens off the screen or on top of the keyboard,
and the person has to scroll the page with the panel open. The sheet solves
that without touching anything that goes inside.

```tsx
const [aberto, setAberto] = useState(false)

<CalendarPanel
  open={aberto}
  onOpenChange={setAberto}
  title="Período do relatório"
  trigger={<Button variant="secondary">Escolher período</Button>}
  footer={<Button onClick={aplicar}>Aplicar</Button>}
>
  <Calendar mode="range" selected={faixa} onSelect={setFaixa} />
</CalendarPanel>
```

`open`, `onOpenChange` and `title` are required, all three for the same
reason. Opening is controlled because whoever confirms with a footer needs to
close the panel at the right moment, not on the click. The `title` is the name
the screen reader announces on a phone, where the panel becomes a sheet and
loses the field beside it that gave the context.
