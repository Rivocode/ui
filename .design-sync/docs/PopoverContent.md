---
category: Sobreposição
---

# PopoverContent

O painel, em portal no contêiner do `RivoProvider`.

`side`, `align` e `sideOffset` moram aqui de propósito: quem escreve a tela
decide o lado junto com o conteúdo, e não na raiz, longe do que vai dentro. O
painel vira sozinho quando não cabe do lado pedido.

São as mesmas três props, com o mesmo significado e a mesma folga padrão de
6px, no `MenuContent`, no `SelectContent`, no `ComboboxContent` e no
`TooltipContent`: o que flutua nesta biblioteca também se posiciona igual.
