---
category: Ações
---

# IconButton

Botão que só tem ícone. É o caminho recomendado para a ação de linha de tabela,
o fechar de painel, o baixar, o editar: tudo o que cabe num quadrado.

```tsx
<IconButton variant="ghost" label="Excluir nota">
  <Trash2 />
</IconButton>
```

**O `label` é obrigatório, e o tipo não deixa esquecer.** Ele vira o nome
acessível do botão, e é a única porta para isso: `aria-label` e
`aria-labelledby` saem do tipo, para o nome não ter dois caminhos que divergem.
Diga a ação, e não o desenho: "Excluir nota", e não "Lixeira". Botão sem nome é
anunciado como "botão", e mais nada.

O ícone sai `aria-hidden`, porque quem nomeia é o `label`, e o tamanho dele vem
da peça: 16px no `sm` e no `md`, 20px no `lg`. Não precisa passar `size` para o
ícone do lucide.

## Variantes e tamanhos

As mesmas cinco variantes do `Button` (`primary`, `secondary`, `outline`,
`ghost`, `destructive`) e a mesma `shape="pill"`, lidas das mesmas classes: o
`IconButton` é um `Button` por dentro, e não uma cópia dele. O que muda é o
tamanho. `sm`, `md` e `lg` são quadrados cujo lado é a altura de controle do
token (`--rc-control-sm`, `-md`, `-lg`), então o botão de ícone encolhe junto
com o campo ao lado no modo compacto e nunca fica mais alto que ele.

## Com dica

`tooltip` mostra o `label` numa dica ao pousar o ponteiro ou focar pelo teclado.
Ligue quando o ícone não for universal. Um lápis se lê sozinho, e uma folha
genérica não diz se abre o PDF ou o XML.

```tsx
<IconButton variant="ghost" label="Ver o XML da nota" tooltip>
  <FileText />
</IconButton>
```

A dica **não entra no nome**: ela repete o `label`, e amarrá-la por
`aria-describedby` faria o leitor de tela dizer a mesma frase duas vezes. Ela é
para quem enxerga e ainda não conhece o ícone. `tooltipSide` escolhe o lado.

## Carregando e desabilitado

`loading` troca o ícone pela espera no mesmo quadrado, trava o clique e anuncia
`aria-busy`, e o nome continua o mesmo: a pessoa que ouve sabe o que está
esperando. `disabled` é o do `Button`, com o fundo, a cor e o contorno de desabilitado.

## Como link

`render={<a href="..." />}` troca o elemento, como no `Button`, e o `label`
continua nomeando o link.

## Quando não usar

Se há espaço para a palavra, use `Button` com texto: o rótulo escrito é mais
claro do que qualquer ícone com dica, e é o único dos dois que funciona no
toque. Ação principal de tela quase nunca é só ícone.

Botão que fica apertado (negrito, alinhamento, modo de exibição) é `Toggle`: o
`IconButton` dispara uma ação e não guarda estado, e o `Toggle` diz
`aria-pressed`.

O `Button` ainda aceita `size="icon"` e `size="iconSm"`, e eles continuam
funcionando. O `IconButton` é o caminho recomendado porque exige o nome, tem o
terceiro tamanho e resolve a espera sem alargar o quadrado.

## No React Native

Traduz, com o nome obrigatório do mesmo jeito: lá ele é `accessibilityLabel`, que é o nome que o React Native já usa, e o tipo recusa o botão sem ele.

**O alvo de toque nunca fica abaixo de 44pt.** `md` é o quadrado de 44 e `lg` o de 48; o `sm` desenha 32 e ganha `hitSlop` de 6 nos quatro lados, que devolve os 44 sem crescer o desenho. As variantes são as do `Button` nativo (`primary`, `secondary`, `ghost`, `outline`, `destructive`), lidas das mesmas classes: só `shape` não atravessa, pelo mesmo motivo de lá.

**Não há `tooltip`.** A dica aparece ao pousar o ponteiro, e no toque não existe pousar. Se o ícone não se lê sozinho, o botão pede texto: use `Button`.

O ícone entra como filho, e a forma que pinta na cor da variante é a função, porque a cor não desce da `View` para o SVG:

```tsx
<IconButton accessibilityLabel="Excluir nota" variant="ghost" onPress={excluir}>
  {({ color, size }) => <Trash2 color={color} size={size} />}
</IconButton>
```
