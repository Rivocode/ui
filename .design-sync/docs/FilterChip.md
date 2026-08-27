---
category: Estrutura
---

# FilterChip

Um filtro aplicado: o campo, o valor e o xis que o tira.

```tsx
<FilterChip label="Cliente" value="Clínica São Lucas" onRemove={tirar} />
```

O `label` sai em peso normal e o `value` em peso médio. É essa a hierarquia da
ficha, e é só ela: "Cliente" é a pergunta, e quem se lê de relance é a
resposta. Sem `value` a ficha vira o campo sozinho, que serve para filtro
booleano — "Vencidas", "Com anexo".

## Sem cor de estado, de propósito

Ela é prima do `Badge` e nasce do mesmo desenho — a mesma pílula, a mesma
borda, as mesmas duas alturas de `size` —, mas **não tem `tone`**. Um filtro
não é um estado: uma fileira de seis fichas coloridas vira um semáforo onde
nenhuma cor significa nada, e a regra da casa é usar o tom pelo significado e
nunca pela cor que se quer. Quem precisa de cor está descrevendo situação, e
para isso existe o `Badge`.

## O nome do xis

`labels.remove` recebe o texto já montado e devolve o que o leitor de tela
ouve. O padrão é "Remover filtro Cliente: Clínica São Lucas" quando o valor é
texto, e "Remover filtro Cliente" quando não é — de um `ReactNode` não há como
ler o texto de volta. É o mesmo `labels.remove` do `TagsInput` e do
`ComboboxChip`, e existe pela mesma razão: sem ele uma fileira se anuncia
"Remover, Remover, Remover".

```tsx
<FilterChip
  label="Emissão"
  value="01/08 a 31/08"
  labels={{ remove: (filtro) => `Tirar o filtro ${filtro}` }}
  onRemove={tirar}
/>
```

O xis desenha 12px, e a área que o dedo alcança é esticada por
pseudo-elemento até os 24px da WCAG 2.5.8 — a mesma saída da ficha do
`Combobox` e do `TagsInput`, que não engorda a pílula.

## Sem `onRemove` não há xis

É assim que se mostra filtro que a aplicação trava: a filial da pessoa, o
tenant, o período que o fechamento fixou. Ele aparece porque explica o
resultado, e não some porque sair dele não é escolha de quem lê.

## O valor que não cabe

O valor corta com reticências em 10rem e leva o texto inteiro no `title`. É o
que impede um nome de razão social de esticar a ficha até o dobro da tela num
aparelho de 390px, onde ela quase sempre mora dentro de uma `FilterBar` que
rola na horizontal.

## As partes

`classNames` veste `label`, `value` e `remove`.

## Quando não usar

Para dizer em que situação uma linha está — "Paga", "Vencida", "Rascunho" —,
use `Badge`: ele descreve o dado, não some por vontade de quem lê e não tem
xis. A `FilterChip` descreve um **recorte da lista**, e tirá-la muda o que se
vê.

Dentro de um campo que produz os próprios valores, a ficha certa é a do
`TagsInput` ou a do `Combobox` com `multiple`: lá ela é o valor do campo e vive
dentro da moldura dele, com o anel de foco do campo em volta. A `FilterChip`
vive fora de campo nenhum.

E para um filtro que liga e desliga no mesmo lugar, use `Toggle` ou
`ToggleGroup`: a ficha é o resumo de uma escolha feita em outro lugar, e não o
lugar de fazê-la.

## No React Native

Traduz, com o mesmo vocabulário do web: rótulo, valor e o botão de tirar, sem `tone` — filtro não é situação, e seis fichas coloridas viram semáforo onde nada significa nada.

**O alvo cresce sem a ficha engordar.** A raiz é uma faixa de 44pt e a pílula pintada é um filho absoluto dentro dela, então ela continua com 28pt como no web. O xis herda os 44 verticais da faixa e ganha `hitSlop` horizontal.

A faixa foi esticada em vez de dar `hitSlop` vertical por uma razão de plataforma: **no Android o toque fora dos limites do pai não é entregue**. Com a pílula de 28pt como pai do botão, a folga acima e abaixo seria descartada justamente no aparelho onde mais falta alvo. Consequência declarada: `size` muda só a pílula desenhada, nunca a altura da faixa — o dedo não encolhe junto com a ficha.
