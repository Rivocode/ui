---
category: Estrutura
---

# Spoiler

Mostra o começo de um texto longo e esconde o resto atrás de um "Ler mais". A
descrição de um produto, o termo de uso, a nota interna de um cliente, a
resposta longa de um chamado.

```tsx
<Spoiler maxHeight={96}>
  <p>O plano Empresa emite nota fiscal de serviço em mais de 1.200 prefeituras…</p>
  <p>Boletos e cobranças por Pix saem da mesma tela…</p>
</Spoiler>
```

## Pela altura, e só quando estoura

O corte é por **altura**, em pixels (`maxHeight`, 120 sem a prop), e não por
número de caracteres: o que cabe depende da largura da tela, e a peça mede o
conteúdo de verdade, de novo a cada vez que ele muda de tamanho.

Conteúdo que cabe na altura não ganha botão, nem corte, nem degradê. Por isso
dá para usar o mesmo `Spoiler` em toda linha de uma lista, com texto curto e
longo misturados.

## O corte

Recolhido, as duas últimas linhas visíveis somem num degradê. É uma máscara, e
não uma camada pintada por cima: ela funciona sobre `bg`, `surface`, cartão ou
imagem, sem saber a cor do fundo. O degradê mede duas alturas de linha (`2lh`),
então acompanha o corpo do texto, e a linha que o corte pega pela metade nunca
aparece com a borda seca.

Ao abrir, a caixa cresce até a altura inteira com a duração `base` e a curva
da casa, e sem movimento quando o sistema pede para reduzir.

## O botão

"Ler mais" recolhido, "Ler menos" aberto, e `aria-expanded` diz o estado para
quem ouve. `aria-controls` aponta para a caixa. `labels` troca os dois textos:

```tsx
<Spoiler labels={{ more: 'Ver o termo inteiro', less: 'Recolher o termo' }}>
  <p>Ao aceitar, você autoriza a emissão de documentos fiscais…</p>
</Spoiler>
```

Controlado, `open` e `onOpenChange` andam juntos; sem controlar,
`defaultOpen` decide como nasce. São os mesmos nomes do `Collapsible` e do
`AccordionItem`: abrir e fechar se chama `open` em toda a biblioteca.

## O que fica escondido não some

O corte é só visual. O leitor de tela lê o texto inteiro, recolhido ou não, e o
link que estiver abaixo do corte continua na ordem do Tab. Quando o foco entra
num elemento abaixo do corte ou dentro do degradê, o `Spoiler` abre sozinho,
volta o texto para o começo e traz o elemento focado para a vista, para ninguém
focar o que não vê.

## Partes

`classNames` alcança cada nó pelo nome: `content` (a caixa que corta) e
`trigger` (o botão). O `className` vai na raiz, e é lá que o corpo e o tom do
texto entram.

## Quando não usar

- **Uma linha ou poucas, cortadas com reticência, sem abrir** é `Text` com
  `truncate` ou `lineClamp`. O `Spoiler` é para quem vai querer ler o resto ali
  mesmo.
- **Um bloco inteiro que nasce fechado, com título próprio** ("Ver os detalhes
  do cálculo") é `Collapsible`. O `Spoiler` mostra o começo do conteúdo; o
  `Collapsible` esconde tudo atrás do título.
- **Várias seções que se fecham entre si** é `Accordion`.
- **Texto que não cabe e que a pessoa precisa ler inteiro para decidir**, como
  um contrato antes do aceite, vai aberto numa `ScrollArea` ou num `Dialog`. O
  "Ler mais" convida a pular.

## No React Native

Traduz, com os mesmos `maxHeight`, `open`, `defaultOpen`, `onOpenChange` e `labels`, e o mesmo botão que só aparece quando o conteúdo estoura. O botão diz o estado por `accessibilityState.expanded`.

**Recolhido, o leitor de tela ouve que o texto está cortado.** O `overflow` esconde só da vista, e o TalkBack e o VoiceOver leem o bloco inteiro. Então o conteúdo recolhido vira um elemento só para o leitor, com a dica "Texto cortado. Toque em Ler mais para ver o resto."; aberto, a dica sai. Link dentro do bloco recolhido não recebe foco próprio até abrir.

**O degradê é pintado, e não máscara.** O React Native não tem máscara sem dependência nova, então os últimos 40 pontos recebem faixas na cor do fundo, com opacidade crescente. A cor sai de `fadeOver` (`bg`, `surface` ou `surface-raised`, `bg` sem a prop): ponha o fundo em que o bloco pousa, senão o degradê aparece como uma faixa.

O `className` vai na raiz, e as partes vestem pelo mesmo `classNames` do web: `content` (a caixa que corta) e `trigger` (o botão).
