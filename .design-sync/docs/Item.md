---
category: Estrutura
---

# Item

A linha de lista: alguma coisa a esquerda, texto no meio, ação a direita.

Existe porque metade de qualquer tela e isso, e sem uma peça com nome cada
projeto reinventa com div solta e respiro próprio. Não e componente de dado, e de
arranjo.

Compõe com `ItemMedia` à esquerda, `ItemContent` no meio (com `ItemTitle` e
`ItemDescription` dentro) e `ItemActions` à direita. As três colunas existem
para uma só encolher: o miolo corta o texto com reticências, e a mídia e as
ações ficam do tamanho que têm.

Com `interactive` ganha foco e passagem; use junto com `render` de link ou botão,
porque cor de passagem em div não vira alvo de teclado.

## No React Native

Traduz, e não concorre com o `DataList`: ele resolve os quatro finais de uma consulta e devolve cada linha ao `renderItem` sem opinião sobre o que há dentro dela. O `Item` é esse dentro, e serve igualmente à lista de duas escolhas numa folha, que consulta nenhuma tem. A composição do web (`ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`) vira quatro props, pela mesma regra do `PageHeader`: os lugares são sempre os mesmos, e prop nenhuma deixa trocar a ordem das colunas sem querer. Com `onPress` a linha inteira vira alvo, com 44px de altura mínima, mas quando há `actions`, o alvo passa a ser só a área de texto, senão o `Pressable` acessível por cima engoliria o botão da direita como parada do leitor de tela. Dentro de um `DataList` com `onRowPress`, não passe `onPress`: um `Pressable` dentro do outro segura o toque no de dentro, e a linha responderia aqui e nunca lá.
