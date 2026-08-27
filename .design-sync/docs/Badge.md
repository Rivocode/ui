---
category: Feedback
---

# Badge

Selo de estado, sempre em pilula, sempre curto.

`tone`: `neutral`, `accent`, `success`, `warning`, `danger`, `info`. Use o tom
pelo significado, nunca pela cor que você quer.

E a única peça em pilula por padrão: selo em canto reto parece etiqueta de
sistema antigo, e botão em pilula dentro de formulário parece brinquedo.

## No React Native

Traduz nos tons e na pílula, e **sem o `size` do web**. Lá o `sm` existe para o selo caber numa linha de `DataTable`, que é de mesa e encolhe com a densidade; aqui não há linha que encolha: o `RivoProvider` nativo já declara que `comfortable` é a única altura, porque alvo de toque não diminui, e um segundo tamanho seria a única peça do pacote oferecendo o compacto que o pacote decidiu não ter.

E a prop custaria mais do que paga. Para casar com o web ela precisaria nascer em `md`, o que aumentaria todo selo já publicado; nascer no tamanho de hoje faria `size="md"` desenhar coisas diferentes nos dois pacotes, que é pior do que não ter a prop. O selo nativo é `text-xs`, fixo.
