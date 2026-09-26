# A forma da tarefa

Os outros arquivos decidem a forma da **tela**. Este decide a forma da
**tarefa**: em quantas telas ela cabe, onde a pessoa confirma, o que acontece
quando ela erra, e como ela volta atrás.

É a parte que nenhuma guarda mede. Uma tela pode estar perfeita no contraste, no
token e no teclado, e ainda pedir três confirmações para algo reversível e
nenhuma para o que apaga.

## Conteúdo

- Uma tela ou várias
- Wizard ou formulário único: a checagem
- O wizard bem feito
- Confirmar, desfazer, ou nada
- O que fazer quando dá errado
- Os quatro finais, e o que cada um decide
- Quando a tela some por baixo da pessoa
- O que deixa o produto esperto
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

## Wizard ou formulário único: a checagem

Wizard não é o padrão. O padrão é **um formulário só**, em seções com
`Fieldset` e título, que deixa a pessoa ver o tamanho da tarefa, voltar a
qualquer campo sem navegar e enviar quando quiser. Responda as quatro perguntas
antes de quebrar em passos; wizard só se pelo menos uma for "sim".

1. **Uma resposta muda o que se pergunta depois?** Pessoa física ou jurídica
   troca os campos; o tipo de serviço decide as alíquotas.
2. **A pessoa precisa sair para buscar um dado no meio?** O código do serviço
   na prefeitura, o comprovante no e-mail.
3. **Uma etapa tem custo próprio ao ser confirmada?** Consultar o CNPJ na
   Receita, reservar o horário, gerar o QR.
4. **A tarefa é longa e rara, e a pessoa se perde sem mapa?** Abrir a empresa
   no sistema pela primeira vez, configurar a emissão.

Tudo "não" é formulário único, mesmo com trinta campos. Campo que poucos usam
vai para um `Collapsible` ("Mais opções"), e não para um passo a mais. Perguntas
uma por vez, com ramificação pela resposta (triagem, pesquisa, o agente pedindo
esclarecimento), é o `Questionnaire`, e não o `Steps`.

## O wizard bem feito

- **Um formulário só por baixo dos passos.** Um `useZodForm` com os campos de
  todas as etapas, e cada passo mostra a parte dele. Formulário por passo perde
  o que foi digitado ao voltar.
- **Valida o passo antes de avançar, e só ele.** `next(() => form.trigger([...]))`
  do `useWizard` cobra os campos daquele passo; o "Próximo" fica travado
  enquanto a checagem assíncrona roda, e dois toques andam um passo só.
- **Voltar nunca perde nada**, e os passos já feitos são clicáveis no `Steps`
  pelo `onStepChange`. Pular para a frente não: o passo seguinte depende do
  anterior.
- **O rascunho sobrevive a recarregar a página.** Wizard é tarefa longa, e a
  aba fecha no meio. Guarde os valores com `useLocalStorage` e limpe no envio.
- **A última etapa é revisão**, com cada parte resumida e um "Alterar" que volta
  ao passo dela. O botão final diz o efeito: "Emitir nota", e não "Concluir".
- **Sem confirmação em cima da revisão.** A revisão já é a confirmação.
- **No celular o `Steps` vira "2 de 4" com o nome do passo**, e o
  `WizardFooter` gruda embaixo, com Voltar e o avanço sempre no mesmo lugar.

```tsx
const STEPS = [
  { id: 'cliente', title: 'Cliente' },
  { id: 'servico', title: 'Serviço' },
  { id: 'revisao', title: 'Revisão' },
]
const FIELDS = [['document', 'name'], ['service', 'amount'], []] as const

const [draft, setDraft, clearDraft] = useLocalStorage({ key: 'nova-nota', defaultValue: EMPTY })
const form = useZodForm(schema, { defaultValues: draft })
const wizard = useWizard(STEPS)

useEffect(() => {
  const watching = form.watch((values) => setDraft(values as typeof EMPTY))
  return () => watching.unsubscribe()
}, [form, setDraft])

<Steps steps={STEPS} step={wizard.step} onStepChange={wizard.goTo} />
<WizardFooter>
  {!wizard.isFirst && <Button variant="secondary" onClick={wizard.back}>Voltar</Button>}
  {wizard.isLast ? (
    <Button type="submit">Emitir nota</Button>
  ) : (
    <Button onClick={() => wizard.next(() => form.trigger([...FIELDS[wizard.step]]))}>
      Continuar
    </Button>
  )}
</WizardFooter>
```

O `clearDraft()` vai no sucesso do envio, e não no clique: se o envio falhar, o
rascunho continua lá.

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

## O que deixa o produto esperto

O que separa uma tela correta de uma tela boa de usar é o trabalho que ela
poupa. Antes de entregar, passe por estas oito perguntas.

| Pergunta | O que fazer | Peça |
|---|---|---|
| Dá para preencher sozinho? | CEP que traz o endereço, o valor que vem do serviço escolhido, a data de hoje no vencimento | `PostalCodeField`, `defaultValues` |
| Dá para lembrar? | Filtro, coluna, visão e aba que a pessoa escolheu voltam na próxima visita | `useLocalStorage` |
| O padrão é o mais comum? | O campo já vem com o que 80% escolhe; a exceção é que troca | `defaultValue` |
| Dá para agir sem abrir outra tela? | Editar no lugar, agir em lote, ver o detalhe numa folha | `Editable`, `ActionBar`, `Sheet` |
| Dá para desfazer em vez de confirmar? | Faz na hora e oferece a volta no aviso | `useToast` com `actionProps` |
| Quem usa todo dia tem atalho? | Busca global e as ações mais usadas pelo teclado, com o atalho visível | `Command`, `useHotkeys`, `Kbd` |
| O que é raro está fora do caminho? | Opções avançadas recolhidas, e não misturadas com as de todo dia | `Collapsible` |
| A pessoa sabe que terminou? | Sucesso visível, com o que aconteceu e o próximo passo: "Nota 4816 emitida. Ver PDF" | `useToast`, `Alert` |

Uma tela que responde "não" a quase todas funciona, mas cobra da pessoa o
trabalho que o sistema podia ter feito.

## Erros de fluxo que aparecem sempre

- Confirmação em ação reversível, e nenhuma na que apaga.
- Wizard usado para caber, sem dependência entre as etapas.
- Erro que limpa o formulário.
- `Toast` para o que a pessoa precisa ler com calma.
- Vazio de filtro oferecendo "criar", quando quem filtrou quer o filtro de volta.
- Duas confirmações para a mesma ação, uma na revisão e outra no diálogo.
- Etapa chamada "Passo 2", que não é uma decisão e sim uma rolagem.
- Sucesso silencioso: a ação terminou e nada na tela diz que terminou.
- Wizard para um cadastro que é só comprido, sem nenhuma etapa que dependa da
  anterior.
- Rascunho que some ao recarregar a página no meio de uma tarefa longa.
- Confirmação para excluir o que dava para desfazer.
- Campo que o sistema já sabia preencher, deixado em branco para a pessoa.
