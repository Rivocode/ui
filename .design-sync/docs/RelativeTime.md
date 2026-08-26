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

Traduz com relógio e tudo — receber o texto pronto teria sido mais barato de escrever e teria devolvido o problema para a tela, que é de onde ele veio. O passo acompanha a unidade, como no web: trinta segundos enquanto conta minuto, uma hora quando já conta dia, e nunca um segundo. A hora anda de cinco em cinco minutos, e não de um em um: a diferença entre "há 1 hora" e "há 2 horas" não vale um timer por minuto vezes as linhas montadas. Duas coisas são só daqui. O texto se refaz ao voltar do fundo, porque enquanto o app dorme o timer do JS não corre e a tela reabriria dizendo "há 2 minutos" três horas depois. E o texto é sempre numérico: o `Intl.RelativeTimeFormat` não existe no Hermes, o plural vai escrito à mão, e onde o web diz "ontem" o nativo diz "há 1 dia". O `cutoff` e o `now` são os mesmos, e a data que ele mostra sai no formato do `formatDate`. O que não atravessa é o instante exato: no web ele mora no `title` do `<time>`, e no toque não há `title` nem onde pousar o ponteiro — quando a data exata importa, ela precisa estar escrita na tela.
