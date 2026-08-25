---
category: Formulário
---

# SearchInput

O campo de busca com a lupa no lugar: o arranjo que toda listagem montava na
mão com `position: absolute`.

Sai como `<input type="search">`, então o leitor de tela anuncia "busca" e o
Esc limpa — o campo não controlado sozinho, o controlado pelo `onClear`.

`shortcut` mostra o atalho num `Kbd` dentro do campo (`"mod+k"` sai ⌘K no Mac
e Ctrl K no resto). Só o desenho: registrar o atalho é trabalho de quem monta
a tela, porque é ela que sabe o que mais escuta teclado.

Combina com o `filter` do `DataTable`: o campo fica onde a tela pedir e a
tabela só recebe o texto.
