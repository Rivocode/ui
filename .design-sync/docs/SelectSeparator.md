---
category: Formulário
---

# SelectSeparator

A linha entre dois grupos da lista.

Ela sai com `role="presentation"`, e não com o `role="separator"` do
`MenuSeparator`. A diferença não é de aparência: dentro de uma lista de opções,
um nó com papel próprio entra na contagem que o leitor de tela anuncia ("opção 3
de 12"), e a conta passa a não bater com o que se vê.

## Quando não usar

Sem `SelectGroup` em volta, ela separa o quê? Numa lista plana a linha vira
divisão sem critério: quem lê procura o motivo do corte e não acha. Se o motivo
existe, ele tem nome, e o nome é um `SelectGroupLabel`.
