---
category: Formulário
---

# DateRangePicker

Periodo, para filtro de relatório e de listagem.

Aqui não ha digitacao, e essa é a diferença de propósito para o `DatePicker`:
mascara de intervalo pede duas datas num campo só, e o custo de acertar teclado,
colagem e ordem invertida não se paga.

O rodape com Aplicar vem ligado por padrão, porque filtro de periodo quase sempre
recarrega listagem, e sem confirm ele recarregaria duas vezes.

`startMonth`, `endMonth`, `showOutsideDays` e `locale` atravessam para o
calendário, as mesmas quatro do `DatePicker`. Só o `locale` chegava aqui, e por
isso um filtro de período não conseguia limitar a escolha aos exercícios
abertos, que é justamente para o que as duas primeiras existem.

## O segundo período estende, e não recomeça

Com um intervalo inteiro na tela, o próximo dia clicado **mexe numa das pontas
do que já existe**, em vez de começar de novo. A regra é de posição, e não de
ordem: dia antes do começo puxa o começo para trás, e qualquer dia depois dele
vira o novo fim — inclusive um dia que está no meio da faixa, que assim
encurta o período em vez de abrir um período novo a partir dali. É a única
regra que não joga trabalho fora: o calendário não tem como saber qual das duas
pontas a pessoa quis mexer, e adivinhar errado apagaria uma data que ela acabou
de escolher.

Para trocar de período em vez de esticar o atual há duas portas, e é bom saber
das duas antes de precisar. `Limpar` zera a escolha **e fecha o painel** — e
ele não limpa só o rascunho: confirma o vazio, chamando `onValueChange` com
`undefined` sem esperar pelo `Aplicar`, então um filtro ligado nele recarrega
vazio e reabrir o painel é um clique a mais. A outra porta não fecha nada:
clicar exatamente sobre uma das duas pontas transforma o intervalo num período
de um dia só ali, e o clique seguinte já estende a partir desse dia.

Com `confirm={false}` não há rodapé, e portanto não há `Limpar`: aí a ponta é o
único caminho.

## No React Native

Traduz, com um desenho só: **um mês, numa folha de baixo, com a faixa pintada na própria grade**. Os dois meses lado a lado do web não cabem (390px partidos ao meio dão 27px de célula, e o alvo de toque mínimo é 44), e dois `DatePicker` em sequência, que era o que esta tabela mandava fazer até agora, perdem justamente o que faz a peça existir: as duas pontas na mesma grade, com os dias do meio pintados. **A validação de fim-antes-do-começo deixou de ser sua**: tocar 20 e depois 5 devolve 5 a 20, porque a peça ordena as duas pontas em vez de descartar o primeiro toque, e o `Aplicar` fica desligado enquanto falta a segunda. Por isso o tipo mudou: o `DateRange` daqui tem `from` e `to` **obrigatórios**, os dois como ISO `aaaa-mm-dd`, e o vazio é `null`. O intervalo pela metade, que no web sai no `onValueChange` entre os dois cliques para o resumo do filtro acompanhar, não sai daqui: sob uma folha não há tela atrás para acompanhar nada: quem quiser acompanhar lê o resumo que a própria folha escreve acima do mês. Sem `confirm`: a folha sempre confirma, porque o toque fora dela é o gesto de desistir e não pode valer como aplicar.
