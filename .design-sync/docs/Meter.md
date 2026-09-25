---
category: Feedback
---

# Meter

Medida de quanto de uma capacidade esta em uso: espaço, cota, limite.

```tsx
<Meter value={72} max={100} label="Espaco de arquivos" showValue />
```

`showValue` mostra o valor ao lado do rótulo, e `format` diz como ele é escrito:
o nome de um formatador da casa (`percent`, `currencyShort`, `compact`) ou uma
função sua. Sem rótulo visível, passe `aria-label`.

## Movimento

A barra enche do zero na montagem (`animate-fill`, `--rc-duration-slow`), o mesmo do `Progress`, e depois anda pela largura quando o valor muda. Com "reduzir movimento", nasce no valor.

## Quando não usar

Para tarefa que anda e termina (enviar um arquivo, gerar um relatório), use
`Progress`. **Parece a mesma barra e não é.** O progresso caminha para um fim; a
medida fica parada mostrando um estado que pode subir e descer.

Trocar um pelo outro faz o leitor de tela anunciar "carregando" para algo que
não carrega, e quem ouve fica esperando o fim de uma operação que não existe.

## No React Native

Portado. O texto do valor sai de `format`, com os mesmos nomes de formatador do web (`percent`, `currencyShort`, `integer`...) ou uma função, e vale na tela e no anúncio. Só daqui há o `valueLabel`, para a medida que já chega escrita, e ele ganha do `format` quando os dois vêm. O papel de acessibilidade muda, e por uma razão: o React Native não tem equivalente de `meter`, então a peça se anuncia como texto com valor, e nunca como `progressbar`, que é justamente o erro que ela existe para evitar.

As partes vestem pelo mesmo `classNames` do web: `label`, `value`, `track` e `indicator`.
