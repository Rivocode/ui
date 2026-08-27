---
category: Sobreposição
---

# Sheet

Folha que desliza da borda da tela, com gesto de arrastar.

Compõe com `SheetTrigger`, `SheetContent`, `SheetTitle`, `SheetDescription`,
`SheetHandle` e `SheetClose`.

`side` decide de onde ela entra, e o gesto de fechar segue o lado. E a peça de
navegação no celular e o painel de ações onde o polegar alcança. O tipo é
`SheetSide`, e são três lados: `bottom` (o padrão), `left` e `right`. Não há
`top`, porque folha que desce do alto disputa com a barra de status do celular e
com todo cabeçalho fixo.

A tarja de fundo clareia junto com o dedo: puxar pela metade mostra metade do que
esta atrás.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Sheet` - só o comportamento de baixo, que já era o modo estreito do web. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
