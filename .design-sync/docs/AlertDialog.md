---
category: Sobreposição
---

# AlertDialog

A confirmacao de coisa que não volta atrás: excluir, cancelar nota, sair sem
salvar.

Compõe com `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`,
`AlertDialogDescription`, `AlertDialogFooter` e `AlertDialogClose`.

Não fecha com Esc nem com clique fora, e o foco começa no botão de cancelar.
Quem esta prestes a apagar algo tem que dizer que sim de propósito, e não
esbarrar num clique.

No celular os botões empilham e ocupam a largura toda.

## Quando não usar

Para qualquer outra janela modal — um formulário, um detalhe, uma escolha que
tem desfazer — use `Dialog`. O que este cobra a mais é sair pela porta: sem Esc
e sem clique fora, quem abriu por engano tem que ler os botões para escapar.
Cobrar isso de toda janela treina a pessoa a clicar em confirmar sem ler, que é
exatamente o hábito que ele existe para impedir.
