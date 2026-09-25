---
category: Tipografia
---

# Highlight

Marca, dentro de um texto, o trecho que a pessoa buscou. É o que faz a lista de
resultados dizer **por que** cada linha apareceu: quem digitou "sao" vê o "São"
de "Clínica São Lucas" pintado.

```tsx
const [query, setQuery] = useState('')
const found = customers.filter((name) => matchesSearch(name, query))

<SearchInput aria-label="Buscar cliente" value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
{found.map((name) => (
  <Highlight key={name} query={query}>{name}</Highlight>
))}
```

O texto entra como filho, e tem que ser `string`: o destaque é calculado sobre
ele. `query` é o termo, ou uma lista de termos.

## Sem acento importar

Caixa e acento não importam, nos dois sentidos: "sao" acha "São", "JOÃO" acha
"joao", e "acao" acha "Ação". O que sai pintado é sempre o texto **original**,
com o acento que ele tinha. Acento escrito em duas partes (a letra e o sinal
separados, como sai de alguns bancos) fica dentro do destaque, e não solto
depois dele.

`matchesSearch(texto, termo)` é a mesma regra, para filtrar a lista antes de
destacar: o que o filtro acha é o que o `Highlight` pinta.

## Vários termos

Com uma lista, cada termo é destacado onde aparecer. Dois termos que se
encostam ou se sobrepõem viram um trecho só, e termo vazio ou só de espaço é
ignorado: `query=""` devolve o texto inteiro, sem marca nenhuma.

```tsx
<Highlight query={['nota', 'cancelada']}>
  A nota fiscal 1042 foi cancelada dentro do prazo.
</Highlight>
```

## A cor

Cada trecho sai num `<mark>` com o fundo cheio `warning`, a tinta
`warning-fg` e peso semibold. São dois pares medidos em `src/lib/contrast.ts`,
nos dois temas: o fundo contra os três fundos da casa (`bg`, `surface` e
`surface-raised`) passa dos 3:1, então o trecho se destaca pela cor e não só
pelo peso; e a tinta sobre o fundo passa dos 4,5:1. O fundo sutil
`warning-subtle` foi descartado por isso: ele media 1,14:1 contra o fundo no
claro e 1,27:1 no escuro, e o destaque vivia só do negrito. A tinta do trecho
não segue o parágrafo em volta, nem quando ele é `fg-muted`.

O `<mark>` não é anunciado pela maioria dos leitores de tela, e não precisa:
quem ouve já sabe o que buscou.

## Partes

O `className` vai no `<span>` de fora. `classNames.mark` alcança cada trecho
achado.

## Quando não usar

- **Texto com ênfase que não vem de busca** é `<strong>` dentro do `Text`. O
  `Highlight` diz "foi isto que você procurou", e usado como ênfase ele engana.
- **Cortar texto longo** é `Text` com `truncate` ou `lineClamp`, e mostrar
  mais sob demanda é `Spoiler`. O `Highlight` não mexe no tamanho do texto.
- **Marcar o item atual de uma lista** é o `aria-selected` da própria lista
  (`Select`, `Combobox`, `Command`). O destaque de busca é outra coisa, e pinta
  por cima do selecionado.

## No React Native

Traduz, sobre o `Text` do pacote, com o mesmo `query` e a mesma regra sem acento. Cada trecho achado é um `Text` aninhado com o mesmo fundo cheio `warning`, a tinta `warning-fg` e o peso semibold, e o de fora aceita todas as props do `Text` (`size`, `tone`, `weight`, `lineClamp`).

No lugar do `classNames.mark` do web, a classe de cada trecho vai em `markClassName`. O `matchesSearch` também sai do pacote nativo, para o filtro e o destaque usarem a mesma regra.
