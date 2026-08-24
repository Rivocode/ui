---
category: Ações
---

# ButtonGroup

Botões que agem sobre a mesma coisa, encostados um no outro.

Serve para ações irmãs: "emitir" com o menu de variantes colado do lado, ou a
troca de visualização entre lista, linhas e grade.

O encaixe é feito por seletor de irmãos, e não pedindo `className` em cada
filho. Qualquer `Button`, link ou gatilho de menu entra no lugar certo sem saber
que está num grupo. As bordas internas viram uma só, senão a divisão entre dois
botões secundários sai com o dobro da espessura das externas.

`orientation="vertical"` empilha, para barra lateral estreita.

## Quando não usar

Não é grupo de escolha. Se o que você quer é marcar uma opção entre várias, o
`ToggleGroup` guarda estado e diz isso no aria; aqui são ações, e cada clique
faz uma coisa diferente.

Botões sem relação entre si também não entram: encostados, eles prometem uma
família que não existe. Para esses, `gap` normal.
