---
category: Sobreposição
---

# Dialog

Janela modal, para decisão que não pode continuar em segundo plano.

Compõe com `DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogDescription`,
`DialogFooter` e `DialogClose`.

Renderiza em portal dentro do container do `RivoProvider`, que carrega o tema.
Sem o Provider ele lanca erro, e não renderiza sem estilo.

## Quando não usar

Para confirmar o que não volta atrás — excluir, cancelar uma nota, sair sem
salvar — use `AlertDialog`. Este aqui fecha com Esc e com clique fora, e é isso
que o separa do outro: uma janela que se dispensa por engano não serve para uma
pergunta cuja resposta errada não tem desfazer.

Para o painel que abre no celular, prefira o `Sheet`: modal centralizado numa
tela estreita cobre quase tudo e briga com o teclado. E para o que só acrescenta
contexto ao lado de um botão — uma explicação, um formulário de duas linhas — o
`Popover` custa menos: o modal tranca o resto da página, e trancar a página para
mostrar um texto é cobrar caro por pouco.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Dialog` — `open`, `onOpenChange` e `title` como props; sem `DialogTrigger`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
