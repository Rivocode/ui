---
category: Formulário
---

# CalendarPanel

A casca do calendário: painel ancorado na mesa, folha de baixo no celular.

O `DatePicker` e o `DateRangePicker` já a usam por dentro. Ela sai exportada
para o seletor de data que a sua tela inventa (o filtro de período de um
relatório, o calendário de agendamento) continuar trocando de formato do mesmo
jeito que os da casa.

A troca é de formato e não de conteúdo. Calendário ancorado num campo perto do
rodapé do celular abre para fora da tela ou por cima do teclado, e a pessoa
precisa rolar a página com o painel aberto. A folha resolve isso sem mexer em
nada do que vai dentro.

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

`open`, `onOpenChange` e `title` são obrigatórios, e os três pelo mesmo motivo.
A abertura é controlada porque quem confirma com um rodapé precisa fechar o
painel no momento certo, e não no clique. O `title` é o nome que o leitor de
tela anuncia no celular, onde o painel vira folha e perde o campo ao lado que
dava o contexto.
