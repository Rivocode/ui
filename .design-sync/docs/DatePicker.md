---
category: Formulário
---

# DatePicker

Campo de data: da para digitar e da para escolher no calendário.

Digitar vem primeiro de propósito. Quem preenche formulário o dia inteiro digita
`03032026` mais rápido do que navega três meses para trás.

Texto pela metade não vira data, e ao sair do campo o que não virou data volta
para a última valida. `31/02` não vira 3 de marco.

Com `confirm`, o clique no dia vira rascunho e só o Aplicar escreve o valor. No
celular o painel vira folha de baixo, pelo `CalendarPanel`.

## Data e texto

O valor é um `Date`, e não texto. As três funções que fazem a ponte saem pelo
pacote, porque a tela que mostra data fora de um campo precisa das mesmas
regras:

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

Traduz: o `@rivocode/ui-native` exporta `DatePicker` - abre a folha com o mês; guarda ISO e exibe `dd/mm/aaaa`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
