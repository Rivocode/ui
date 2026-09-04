# A forma da tarefa

Os outros arquivos decidem a forma da **tela**. Este decide a forma da
**tarefa**: em quantas telas ela cabe, onde a pessoa confirma, o que acontece
quando ela erra, e como ela volta atrás.

É a parte que nenhuma guarda mede. Uma tela pode estar perfeita no contraste, no
token e no teclado, e ainda pedir três confirmações para algo reversível e
nenhuma para o que apaga.

## Conteúdo

- Uma tela ou várias
- Confirmar, desfazer, ou nada
- O que fazer quando dá errado
- Os quatro finais, e o que cada um decide
- Quando a tela some por baixo da pessoa
- Erros de fluxo que aparecem sempre

## Uma tela ou várias

A pergunta não é quantos campos existem, é **quantas decisões independentes** a
pessoa toma.

| Forma | Quando | Peça |
|---|---|---|
| Um formulário só | os campos se respondem juntos, e a pessoa já sabe tudo | `Card` com `Field` |
| Passos | há decisão que muda os campos seguintes, ou a pessoa precisa buscar dado no meio | `Steps` + `WizardFooter` |
| Folha lateral | a tarefa é acessória e o contexto de trás importa | `Sheet` |
| Diálogo | uma decisão, curta, que não pode ser dispensada por engano | `Dialog` |

**Passos não são para caber.** Quebrar quinze campos em três telas de cinco não
diminui o trabalho, só esconde o tamanho dele e tira a visão do conjunto. Quebre
quando a etapa 2 **depende** da 1.

Quando houver passos, cada um tem que ser **nomeável por substantivo**:
"Cliente", "Serviço", "Revisão". Passo que só se chama "Passo 2" não era um
passo, era uma rolagem.

**A última etapa é sempre revisão**, com o que foi decidido e um caminho de
volta para cada parte. É onde a pessoa confere antes do que não tem volta.

## Confirmar, desfazer, ou nada

Esta é a decisão que mais gente erra, e ela tem uma regra só: **o custo de
desfazer decide.**

| A ação | O que ela ganha |
|---|---|
| Reversível e barata (marcar, arquivar, reordenar) | **nada.** Faz e pronto |
| Reversível mas confusa de reverter (excluir rascunho, remover linha) | **desfazer**, num `Toast`, com prazo |
| Sem volta e de efeito externo (emitir, cancelar nota, apagar de vez) | **confirmar**, com `AlertDialog` |

**Desfazer ganha de confirmar sempre que for possível.** Confirmação cobra de
todo mundo, toda vez, para proteger o engano de vez em quando — e a pessoa
aprende a clicar sem ler, que é exatamente o estado que a confirmação existia
para evitar. Desfazer só cobra de quem errou.

Confirmação só se justifica quando **desfazer não existe**: a prefeitura já
recebeu, o e-mail já saiu, o registro já foi embora.

Quando confirmar for a resposta certa:

- `AlertDialog` para o que não se dispensa clicando fora;
- `Popconfirm` para o que é local e pequeno, ancorado no próprio gatilho;
- o título nomeia o objeto, a descrição diz o efeito e quem é avisado, e o botão
  de escape nomeia o estado que fica. `texto.md` tem a forma exata.

**Nunca confirme duas vezes a mesma coisa.** Se a revisão do wizard já mostrou o
que vai acontecer, o diálogo em cima dela é ruído.

## O que fazer quando dá errado

- **Preserve o que a pessoa digitou.** Erro que devolve o formulário vazio custa
  o trabalho inteiro de novo, e é o motivo mais comum de abandono. O rascunho
  volta preenchido, sempre.
- **O erro aparece perto da causa.** Erro de campo no campo; erro da operação no
  topo do formulário ou num `Alert`; erro de carregamento no lugar do conteúdo
  que não veio.
- **Erro que se resolve repetindo ganha `onRetry`.** O que não se resolve
  repetindo ganha o caminho: quem procurar, ou o que corrigir.
- **Valide na saída do campo, não a cada tecla.** Cobrar o CNPJ completo no
  terceiro dígito é acusar quem ainda está digitando.
- **`Toast` não serve para erro que exige ação.** Ele some. O que precisa
  continuar visível é `Alert`.

## Os quatro finais, e o que cada um decide

Toda consulta tem quatro, e cada um é uma decisão de fluxo, não só uma tela:

| Final | A decisão |
|---|---|
| carregando | esqueleto na forma do conteúdo que vem, com a largura da coluna, para a tela não pular quando os dados chegarem |
| erro | o que a pessoa faz agora, e se repetir resolve |
| vazio | é a primeira vez dela, ou o filtro não achou? São textos e ações diferentes |
| dados | o caminho feliz |

Entregar só o quarto é entregar metade da tela, e a metade que falta é a que
aparece no pior dia.

## Quando a tela some por baixo da pessoa

- **Não mova o que ela vai clicar.** Conteúdo que chega depois entra abaixo do
  ponto de leitura, ou reserva o espaço desde o começo.
- **Ação que demora fica presa ao botão**, com `loading` e o botão desabilitado
  — nunca uma tarja que cobre a tela e tira a referência do que estava fazendo.
- **Confirmação não muda de lugar.** O botão que confirma fica sempre no mesmo
  canto do rodapé, em todos os diálogos do produto.
- **Fechar uma folha ou um diálogo devolve o foco ao gatilho**, senão o teclado
  recomeça do topo da página. As peças da casa já fazem isso; layout escrito à
  mão não.

## Erros de fluxo que aparecem sempre

- Confirmação em ação reversível, e nenhuma na que apaga.
- Wizard usado para caber, sem dependência entre as etapas.
- Erro que limpa o formulário.
- `Toast` para o que a pessoa precisa ler com calma.
- Vazio de filtro oferecendo "criar", quando quem filtrou quer o filtro de volta.
- Duas confirmações para a mesma ação, uma na revisão e outra no diálogo.
- Etapa chamada "Passo 2", que não é uma decisão e sim uma rolagem.
- Sucesso silencioso: a ação terminou e nada na tela diz que terminou.
