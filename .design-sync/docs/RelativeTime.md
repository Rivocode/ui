---
category: Dados
---

# RelativeTime

"há 2 minutos", "em 3 dias".

Nenhuma biblioteca de fora entrega isto, porque não é problema de código — é
decisão de idioma e de produto: onde cortar entre "agora" e "há 1 minuto",
quando parar de contar e mostrar a data, como o plural se escreve. Deixar isso
para a tela significa cada tela decidir diferente, e log, fila e notificação
são justamente onde o mesmo instante aparece em três telas ao mesmo tempo.

Sai num `<time>` de verdade, com o instante exato no `datetime` e a data por
extenso no `title`: o relativo é resumo, e resumo perde informação que às vezes
é a que importa.

O texto se refaz sozinho num passo que acompanha a unidade — de trinta em
trinta segundos enquanto conta minuto, de hora em hora quando já conta dia. Um
relógio de segundo em segundo para cada linha de uma tabela de mil linhas é o
jeito mais fácil de derrubar a rolagem. Passando `now`, o texto para de se
atualizar: quem fixou o agora não quer relógio.

`cutoff` decide quando o relativo deixa de ajudar. "há 412 dias" não diz nada;
a data diz.

## Quando não usar

Quando a data exata é o dado — vencimento, competência, data de emissão. Ali o
relativo esconde a informação que a pessoa foi buscar; use `formatDate`.

## No React Native

Ainda não portado — o texto é seu, e não há relógio que se atualize sozinho. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
