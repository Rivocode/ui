---
category: Navegação
---

# TableOfContents

O índice da página: a lista de títulos de um texto longo, com a seção que a
pessoa está lendo marcada enquanto ela rola. É a coluna "Nesta página" de um
guia, de uma política, de um relatório com várias partes.

```tsx
<div className="grid gap-8 lg:grid-cols-[1fr_14rem]">
  <article>…</article>
  <TableOfContents className="sticky top-6 self-start" />
</div>
```

Sem mais nada, a peça lê os `h2` e `h3` do documento, na ordem em que aparecem,
e o `h3` entra aninhado no `h2` que o antecede. O nível sai da tag; qualquer
outro elemento que case com o `selector` entra no nível do `aria-level`, ou no
nível 2 sem ele.

## A seção marcada

Uma linha imaginária a 30% do alto da janela decide qual seção está sendo
lida: a marcada é a do último título que já passou dela. Um
`IntersectionObserver` avisa quando um título cruza a faixa de cima, e a
rolagem mede de novo no máximo uma vez por quadro. Antes do primeiro título,
nenhuma linha fica marcada: a introdução não é seção.

**No fim da rolagem, a última seção visível fica marcada**, mesmo que o título
dela nunca chegue à linha: a última seção de uma página curta não sobe até os
30%, e sem isso ela nunca seria marcada.

A linha marcada leva `aria-current="location"`, que o leitor de tela anuncia
como "local atual", e o risco da cor de destaque na borda. `onActiveChange`
recebe o `id` a cada troca, para quem quer mostrar a seção em outro lugar.

## O clique

O clique rola até o título e **leva o foco para ele**, como um link de âncora
faz: o próximo Tab parte dali, e não do índice. O título ganha
`tabindex="-1"` só enquanto tem o foco, e o perde ao sair. A rolagem é suave,
e **vira salto** quando o sistema pede para reduzir movimento.

Depois do clique, a marcação fica presa na linha clicada até a pessoa rolar
por conta própria (roda do mouse, toque, tecla ou barra de rolagem). Sem isso,
a rolagem suave passaria piscando por todas as seções do caminho, e o salto do
movimento reduzido marcaria a seção de cima quando o título clicado não
consegue subir até a linha.

O `href` continua lá, então Ctrl+clique, clique do meio e "copiar endereço do
link" funcionam como em qualquer link. `updateHash` escreve o `#id` na barra de
endereço com `history.replaceState`, sem empilhar histórico; ele vem desligado
porque router com `#` no caminho brigaria com ele. `onItemClick` roda antes de
tudo, e `event.preventDefault()` ali devolve o link ao navegador.

## Cabeçalho fixo

Com um cabeçalho que gruda no topo, passe a altura dele em `offset`, em
pixels: o título para logo abaixo dele ao clicar, e só conta como visível
abaixo dele. Para o link que chega de fora (`/guia#impostos` colado numa
conversa), quem desconta o cabeçalho é o CSS, e não a peça:

```css
html {
  scroll-padding-top: 4rem;
}
```

## Onde ler

`container` limita a leitura a um elemento, e é o que um exemplo dentro de uma
página maior precisa. Título que chega depois (seção carregada sob demanda,
exemplo que monta tarde) entra sozinho no índice: a peça observa o
`container` e lê de novo quando ele muda. Título sem `id` ganha um, tirado do
texto sem acento: "Nota de crédito" vira `#nota-de-credito`, e o repetido vira
`#nota-de-credito-2`.

`root` é a caixa que rola, quando não é a janela. É nela que a faixa é medida e
é ela que rola no clique.

```tsx
const [caixa, setCaixa] = useState<HTMLDivElement | null>(null)

<div ref={setCaixa} className="h-96 overflow-y-auto">…</div>
<TableOfContents container={caixa} root={caixa} selector="h3, h4" />
```

`items` dispensa a leitura: a lista vem pronta, com `id`, `label` e `level`, e
serve quando o texto do índice é mais curto que o título, ou quando os títulos
moram num componente que não deixa ler.

## Nome e título

O índice sai num `<nav>` com nome, "Nesta página" por padrão, e esse nome
aparece também como título visível acima da lista. `label` troca os dois.
`hideLabel` tira o título da tela e deixa o nome para o leitor de tela. Uma
página sem título nenhum não desenha o índice: navegação vazia é uma região
anunciada que não leva a lugar nenhum.

## Partes

`classNames` alcança cada nó pelo nome: `label` (o título visível), `list` (a
lista de fora, que desenha o trilho), `item` (cada `<li>`) e `link` (cada
linha clicável).

## Quando não usar

- **Navegar entre páginas da aplicação** é `Sidebar`. O índice anda dentro de
  uma página só; a barra lateral troca de rota.
- **A trilha de onde a página mora** é `Breadcrumb`. Ela olha para cima, até a
  raiz do site; o índice olha para dentro do texto.
- **Conteúdo que a pessoa escolhe ver, um de cada vez** é `Tabs`. Com abas, o
  que não está aberto não está na página; com o índice, tudo está e a pessoa
  pula.
- **Etapas de um processo** são `Steps`. O índice não tem ordem obrigatória nem
  etapa concluída.

## No React Native

Não porta, por decisão. O índice da página é idioma de mesa: ele mora numa coluna ao lado do texto, e no celular não há coluna ao lado. Texto longo numa tela de app se divide antes de chegar ao índice: cada seção vira uma tela do router aberta a partir de uma lista, ou uma aba do `Tabs`, e o título da tela diz onde a pessoa está.

O leitor de tela também já tem o próprio índice: o rotor do VoiceOver e os controles de leitura do TalkBack pulam de título em título em qualquer `Text` com `accessibilityRole="header"`, que é o que o `Heading` do pacote nativo escreve.
