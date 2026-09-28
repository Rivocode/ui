---
category: Sobreposição
---

# SheetContent

O painel, com a tarja de fundo e o portal por dentro.

Monta em portal no container do `RivoProvider`, então o tema vale ali dentro.
Não recebe `side`: o lado mora na raiz, porque o gesto de fechar tem que
concordar com a direção de onde a folha entrou.

A tarja é irmã do painel dentro do portal, então nem `className` nem variante de
descendente alcançam ela. Para vestir as duas, use `classNames` com as partes
`backdrop` e `viewport`.
