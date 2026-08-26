---
category: Feedback
---

# Meter

Medida de quanto de uma capacidade esta em uso: espaço, cota, limite.

```tsx
<Meter value={72} max={100} label="Espaco de arquivos" showValue />
```

`showValue` mostra o valor ao lado do rótulo, e `format` diz como ele é escrito:
o nome de um formatador da casa — `percent`, `currencyShort`, `compact` — ou uma
função sua. Sem rótulo visível, passe `aria-label`.

## Quando não usar

Para tarefa que anda e termina — enviar um arquivo, gerar um relatório — use
`Progress`. **Parece a mesma barra e não é.** O progresso caminha para um fim; a
medida fica parada mostrando um estado que pode subir e descer.

Trocar um pelo outro faz o leitor de tela anunciar "carregando" para algo que
não carrega, e quem ouve fica esperando o fim de uma operação que não existe.

## No React Native

Portado. A diferença é o texto do valor: no web ele sai de `format`, e no nativo vai pronto em `valueLabel` — trazer a tabela de formatadores custaria o `Intl` num bundle de celular. O papel de acessibilidade também muda, e por uma razão: o React Native não tem equivalente de `meter`, então a peça se anuncia como texto com valor, e nunca como `progressbar` — que é justamente o erro que ela existe para evitar.
