---
category: Navegação
---

# Tabs

Alterna paineis irmaos na mesma página.

Compõe com `TabList`, `Tab` e `TabPanel`, casando `value` entre aba e painel. O
risco que corre até a aba ativa se posiciona sozinho.

`TabList` tem `variant`, do tipo `TabVariant`. O risco embaixo, que é o padrão,
diz "esta parte da página". A caixinha, `variant="segmented"`, diz "a mesma
coisa, de outro jeito": largura de tela, preview e código, escuro e claro.
Trocar uma pela outra faz o controle prometer o que ele não faz.

## Quando não usar

Não use para navegação entre páginas: aba sugere que o conteúdo está ali do
lado, não em outro endereço. Se o clique troca a URL, é link, e o lugar dele é
a `NavigationMenu` ou a `Sidebar`.

## No React Native

Traduz pela metade, de propósito. O `Tabs` nativo é **só** a caixinha (`variant="segmented"` no web): `items`, `value`, `onValueChange`, sem `TabList`, `Tab` nem `TabPanel`. Aba que troca a seção da página não é peça no celular (é tab bar do router), e insistir numa aba desenhada por cima disso dá duas navegações concorrentes na mesma tela.
