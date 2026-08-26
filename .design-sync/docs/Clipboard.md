---
category: Ações
---

# Clipboard

Copiar um dado para levar a outro lugar.

Chave de acesso, CNPJ, id de rastro, código Pix, número da nota — todo dado que
a pessoa precisa colar em outro sistema quer este botão do lado.

A confirmação é parte da peça, e não enfeite. Copiar é a ação sem resultado
visível: nada muda na tela, então sem confirmação a pessoa clica de novo por
dúvida. E quem não vê o ícone trocar não soube que aconteceu — por isso o
próprio nome acessível do botão muda, e o leitor de tela anuncia "Copiado" onde
antes anunciava "Copiar". A confirmação volta sozinha depois de `timeout`,
senão o botão fica preso num estado que já passou.

Quando a área de transferência não está disponível — sem permissão, ou fora de
contexto seguro — nada é confirmado. Mentir que copiou é pior do que não
confirmar: a pessoa cola o que tinha antes e só descobre no destino.

Os dois nomes entram por `labels`, e cada um tem o próprio padrão: trocar o
verbo não obriga a reescrever a confirmação junto.

```tsx
<Clipboard value="35240612345678000199" labels={{ copy: 'Copiar a chave' }} />
```

## Quando não usar

Para o bloco de código inteiro, `CodeBlock copyable` já traz este botão no
canto, com o próprio conteúdo. Dois botões de copiar na mesma caixa fazem a
pessoa escolher entre coisas que ela acha que são diferentes.

## No React Native

Ainda não portado — precisa do `expo-clipboard`, e dependência é escolha do app. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
