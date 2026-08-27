---
category: Sobreposição
---

# Popconfirm

A confirmação que nasce colada no botão que a disparou: excluir uma linha sem
escurecer a tela inteira.

O caso é o botão de lixeira dentro de uma lista. A pergunta aparece a poucos
pixels da linha que ela ameaça, então o painel não precisa repetir o contexto
que a tela toda já mostra: quem lê "Excluir a nota 4813?" ao lado da nota 4813
não perdeu de vista de onde veio, e a lista continua atrás, legível.

Monta-se com uma peça só: `trigger` é o elemento que abre e a âncora do painel,
`title` é a pergunta, `description` é o que se perde, e `onConfirm` é a ação.
`side`, `align` e `sideOffset` são os mesmos dos outros painéis flutuantes da
casa. Numa coluna de ações encostada na borda direita, `align="end"` evita que
o painel empurre a largura.

## Sair sem fazer nada é fácil de propósito

`Esc`, o botão de cancelar e o clique fora fecham o painel, e os três chamam
`onCancel`. Isso é o oposto do `AlertDialog`, e a razão é que aqui o gesto
distraído leva ao resultado seguro: **fechar não apaga nada**. O que exige
intenção é o contrário: executar, que só acontece no botão vermelho, com o
verbo escrito nele. Prender a pessoa num painel de 20rem para ela ler dois
botões cobra atenção onde não há risco, e é assim que se treina alguém a clicar
em "Confirmar" sem ler.

O foco fica preso enquanto o painel está aberto, e começa no botão de cancelar.
A página continua rolando: o painel acompanha a âncora, e travar a rolagem de
uma tela inteira por causa de uma pergunta de duas linhas é o peso do modal
voltando pela janela.

Quando a confirmação apaga a própria linha que a abriu, o gatilho desaparece
com ela e o foco não tem para onde voltar. É o que `finalFocus` resolve: aponte
o cabeçalho da tabela, ou o que sobrar na tela.

## A rede demora, e o botão tem que dizer isso

`onConfirm` pode devolver uma promessa. Enquanto ela não termina, o painel fica
aberto, o botão entra em espera e se anuncia ocupado, o cancelar trava, e nem
`Esc` nem o clique fora fecham: um clique vira uma chamada, e não duas linhas
apagadas. Se a promessa rejeitar, tudo volta ao estado anterior com o texto
ainda na tela, e a pessoa decide se tenta de novo.

Para quem já guarda esse estado fora da peça (numa store, num `useMutation`),
existe `loading`, que soma com a espera da promessa.

## No celular ela vira folha de baixo

Abaixo de 640px o painel ancorado não é ancorável: 20rem pendurados num botão
de lixeira encostado na borda de uma tela de 390px viram um painel torto, sem
lugar para onde fugir. Nessa largura a peça troca a casca por uma folha de
baixo, com os botões na largura toda e na altura de toque, a mesma decisão que
o `Dialog` e o `CalendarPanel` já tomam. O conteúdo e as ações são os mesmos; o
que muda é a casca.

## As partes

`classNames` veste `title`, `description`, `footer`, `confirm` e `cancel`, e o
`className` veste o painel, seja ele o flutuante ou a folha. Sem esses nomes só
resta `[&_button]` na sua tela, que amarra o seu layout à árvore interna da
peça.

`tone` escolhe entre os dois desenhos: `danger`, o padrão, traz o ícone de
aviso e o botão vermelho de executar; `neutral` serve ao que se desfaz (o
arquivar, o remover da seleção) porque gastar o vermelho no reversível o
apaga onde ele importa.

## Quando não usar

Para o que é irreversível e de escopo largo, use `AlertDialog`. A linha entre
os dois é a **largura do estrago**: uma linha de tabela, um anexo, um item de
lista (coisas que a pessoa vê de onde clicou e que valem uma frase) pedem
este painel; cancelar uma nota fiscal na prefeitura, apagar uma conta,
descartar um formulário inteiro pedem o modal, que escurece o resto, não fecha
no clique fora e obriga a leitura antes de qualquer saída.

O segundo teste é o tamanho do texto: se a confirmação precisa de mais de duas
linhas, de uma lista do que será perdido ou de um campo para digitar o nome do
que se apaga, ela não cabe num painel ancorado e nunca coube. É `AlertDialog`.

E se não há pergunta nenhuma a fazer, não use nenhum dos dois: uma ação que se
desfaz sozinha pede o `Toast` com "Desfazer", que não custa um clique a mais em
cada vez que a pessoa acerta.

## No React Native

Vira `AlertDialog`. Painel ancorado não é idioma de toque: uma pergunta de 20rem presa a um botão de lixeira encostado na borda direita a 390px sai da tela ou tapa a linha que se vai apagar. O próprio web já reconhece isso: abaixo de 640px o `Popconfirm` deixa de ser painel e vira folha de baixo, que é exatamente o que o nativo tem.

**Uma diferença de contrato, e ela é deliberada:** no web dispensar CANCELA (`Esc`, clique fora e o botão, os três chamam `onCancel`), porque ali o gesto distraído leva ao resultado seguro. O `AlertDialog` nativo não fecha ao tocar fora, como o do web também não. Então a saída no celular é o botão de cancelar, escrito e visível: sem Escape não há saída invisível, e é a mesma regra que o `Editable` segue.

A ação em curso porta: quem devolve promessa em `onAction` ganha o mesmo botão em espera e a mesma trava contra o segundo toque.
