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

Ainda não portado. Até lá, `Progress` — sabendo o que se paga por isso: o `Progress` nativo anuncia `progressbar`, e o leitor de tela lê "carregando" para uma medida que não carrega. Espaço em disco a 80% vira uma tarefa que nunca termina. Se a medida é o assunto da tela, escreva o número em texto ao lado da barra: o texto é verdadeiro nos dois mundos.
