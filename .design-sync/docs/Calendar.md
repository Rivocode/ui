---
category: Formulário
---

# Calendar

O mes cru, para quem quer o calendário na própria tela.

E a única peça do catalogo com fundacao de fora, a `react-day-picker`, e ela
entra só como motor: nenhuma folha de estilo dela e importada, todo o desenho vem
dos nossos tokens. O locale padrão e `pt-BR`.

Em largura de celular mostra um mes só, mesmo quando pedem mais, e o dia ganha
44px de alvo. Na tela mais estreita que isso, abaixo de uns 360px, o dia encolhe
junto com a tela para as sete colunas caberem sem rolar para o lado: a 320px
cada dia fica com uns 38px, ainda acima dos 24 da WCAG 2.5.8.

## Valor

O dia escolhido entra por `value` e sai por `onValueChange`, como em todo
seletor do catálogo e como no `@rivocode/ui-native`. O valor pode ser `Date` ou
texto `aaaa-mm-dd`, e a peça responde no formato que recebeu: quem passa texto
recebe texto, e a mesma chamada compila nos dois pacotes.

```tsx
const [vencimento, setVencimento] = useState<string | null>(null)

<Calendar
  value={vencimento}
  onValueChange={setVencimento}
  min="2026-09-01"
  max="2026-12-31"
/>
```

O texto é lido como dia do calendário, e não como instante: `"2026-09-25"` é
25 de setembro em qualquer fuso. O `new Date("2026-09-25")` do JavaScript lê
meia-noite em UTC, que em Brasília ainda é dia 24.

`min` e `max` são inclusivos e aceitam os mesmos dois formatos. Os dias de fora
ficam desabilitados, e a navegação para no mês de cada ponta. Tocar de novo no
dia escolhido não desmarca.

Várias datas soltas e intervalo continuam pelo `mode` do `react-day-picker`,
com `selected` e `onSelect`. Para data única, `mode="single"`, `selected` e
`onSelect` seguem funcionando, mas estão marcados como obsoletos, assim como
`startMonth` e `endMonth`: `value` e `min`/`max` dizem o mesmo e portam para o
nativo.

A troca de mês anima: o mês novo entra pelo lado para onde a pessoa andou, em
200ms, e com "reduzir movimento" ligado a troca é instantânea. `animate={false}`
desliga.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Calendar` - mês desenhado à mão; `value`, `onValueChange`, `min` e `max` em ISO `aaaa-mm-dd`, que o web também aceita; exibição `dd/mm/aaaa`; o mês novo entra por fade; `classNames` com os nomes do `DayPicker` do web. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
