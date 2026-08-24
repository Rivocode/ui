A mesma tela serve a dois usos que não combinam. Uma página de cadastro, que
alguém preenche uma vez, quer respiro. Uma tela de operação, onde a pessoa passa
o dia inteiro, quer caber mais linha na altura visível.

Em vez de dois catálogos, a biblioteca tem uma chave:

```tsx
<RivoProvider density="comfortable">  {/* padrão */}
<RivoProvider density="compact">      {/* tela de operação */}
```

## O que muda

A densidade escreve tokens de altura e de espaçamento interno que **todo**
controle lê. Botão, campo, item de menu, linha de tabela, item de lista, nenhum deles carrega altura própria em pixel.

| Token                 | Confortável | Compacto |
| --------------------- | ----------- | -------- |
| `--rc-control-sm`     | 2rem        | 1.75rem  |
| `--rc-control-md`     | 2.5rem      | 2.25rem  |
| `--rc-control-lg`     | 3rem        | 2.75rem  |
| `--rc-item-y`         | 0.5rem      | 0.375rem |

Por isso a troca alcança o catálogo inteiro de uma vez, e por isso um componente
novo entra já obedecendo: ele pede `h-[var(--rc-control-md)]`, não `h-10`.

## O que não muda

**Tamanho de fonte e alvo de toque.** Compacto encolhe a moldura, não a letra.
Um controle que fica pequeno demais para o dedo deixa de ser dens, passa a ser
inacessível, e isso não é uma preferência de tela.

## Misturar, quando faz sentido

Densidade é herdada, e um `RivoProvider` interno pode discordar do de fora:

```tsx
<RivoProvider density="comfortable">
  <FormularioDeCadastro />

  {/* a tabela de apoio, ao lado, cabe mais linha */}
  <RivoProvider scope="local" density="compact">
    <TabelaDeApoio />
  </RivoProvider>
</RivoProvider>
```

Use com parcimônia: duas alturas na mesma tela precisam de uma fronteira visual
clara, senão parece defeito.

## Onde ela costuma valer

- Listagem com muitas linhas, onde rolar é o custo
- Painel lateral de filtros
- Tela que a pessoa usa o dia inteiro e já conhece de cor

E onde não vale: primeira tela, cadastro, formulário longo, qualquer coisa que
alguém usa uma vez e precisa ler com calma.
