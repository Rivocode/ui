---
category: Feedback
---

# Kbd

A tecla de um atalho, desenhada como tecla.

```tsx
<Kbd keys="mod+k" />
<Kbd>Esc</Kbd>
```

`mod` é a razão de a peça existir. Ele sai como `⌘` no Mac e `Ctrl` no resto,
lendo a plataforma uma vez. A alternativa é cada tela decidir sozinha, e metade
delas escreve Ctrl para todo mundo: quem usa Mac vê o símbolo errado e conclui
que o atalho não existe.

Também conhece `shift`, `alt`, `enter`, `esc`, `tab` e as setas, e devolve o
símbolo curto onde a plataforma usa símbolo.

## Acessibilidade

Um atalho vira uma tecla por parte, com as teclas escondidas do leitor de tela e
a combinação inteira no rótulo do grupo. Sem isso o leitor soletra "comando" e
"K" como dois textos soltos, e quem ouve não monta a combinação.

## Quando não usar

Para nome de arquivo, comando de terminal ou trecho de código, use `code`. A
sombra de tecla promete "aperte isto", e prometer errado custa mais do que não
prometer nada.

## No React Native

Não porta. A peça desenha uma tecla, e o celular não tem teclado físico para a tecla representar — `⌘K` numa tela de toque promete um gesto que não existe. O que no web é atalho, no celular é um botão visível.
