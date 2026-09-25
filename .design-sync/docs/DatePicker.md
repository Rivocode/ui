---
category: Formulário
---

# DatePicker

Campo de data: da para digitar e da para escolher no calendário.

Digitar vem primeiro de propósito. Quem preenche formulário o dia inteiro digita
`03032026` mais rápido do que navega três meses para trás.

Texto pela metade não vira data, e ao sair do campo o que não virou data volta
para a última valida. `31/02` não vira 3 de marco.

Com `confirm`, o clique no dia vira rascunho e só o Aplicar escreve o valor. Ele
nasce desligado aqui e ligado no `DateRangePicker`, e a diferença é de propósito:
data única se escolhe num clique só, e período pede dois, o que faria um filtro
sem rodapé recarregar duas vezes. No celular o painel vira folha de baixo, pelo
`CalendarPanel`.

## Valor

`value` e `defaultValue` aceitam `Date` ou texto `aaaa-mm-dd`, e o
`onValueChange` responde no formato que recebeu. Em texto, a chamada é a mesma
do `@rivocode/ui-native`:

```tsx
const [vencimento, setVencimento] = useState<string | null>(null)

<DatePicker
  value={vencimento}
  onValueChange={setVencimento}
  min="2026-09-01"
  max="2026-12-31"
/>
```

Em texto, o campo que esvazia responde `""`, como o `TimeField`. Com `Date`,
responde `undefined`, que é o que a peça sempre fez. Para começar vazio sem
controlar o estado, `defaultValue=""` escolhe o formato de texto.

O texto é lido como dia do calendário, e não como instante: `"2026-09-25"` é
25 de setembro em qualquer fuso. O `new Date("2026-09-25")` do JavaScript lê
meia-noite em UTC, que em Brasília ainda é dia 24, e é por isso que a peça
nunca passa o texto por ele.

`min` e `max` são inclusivos. Valem para o calendário, que desabilita os dias de
fora e para a navegação no mês de cada ponta, e para o que se digita: data fora
da janela não chega ao `onValueChange`, e ao sair do campo o texto volta para a
última data válida. `disabledDays` fica para o dia bloqueado avulso, como
feriado.

## Data e texto

As três funções que fazem a ponte com o `Date` saem pelo pacote, porque a tela
que mostra data fora de um campo precisa das mesmas regras:

| Função | O que faz |
|---|---|
| `formatDate(data)` | `Date` para `dd/mm/aaaa`, e string vazia quando não há data |
| `parseDate(texto)` | `dd/mm/aaaa` para `Date`, e `undefined` para o que não é data |
| `applyDateMask(texto)` | A máscara enquanto se digita: põe as barras e para em oito dígitos |

`parseDate` devolve `undefined` para data que não existe. `31/02/2026` não vira
3 de março, que é o que o `new Date` faria sozinho e é a origem de metade dos
vencimentos errados de um sistema de nota fiscal.

Tudo aqui trabalha na data local do navegador de propósito: a pessoa escolheu
"3 de março" no calendário da tela dela, e não um instante em UTC.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `DatePicker` - abre a folha com o mês; guarda ISO `aaaa-mm-dd`, que o web também aceita, e exibe `dd/mm/aaaa`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
