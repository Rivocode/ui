---
category: Formulário
---

# Questionnaire

Um formulário que faz **uma pergunta por vez**. Guarda as respostas, diz em
que pergunta a pessoa está, valida antes de avançar e cuida do voltar, do
pular e do enviar. Serve para o agente de IA que precisa de um esclarecimento
antes de agir, para o onboarding, para a pesquisa curta, para a triagem e para
a configuração inicial.

```tsx
<Questionnaire aria-label="Configurar a emissão" onSubmit={(answers) => save(answers)}>
  <QuestionnaireProgress />

  <QuestionnaireItem name="regime" required>
    <QuestionnaireTitle>Qual é o regime tributário da empresa?</QuestionnaireTitle>
    <QuestionnaireDescription>Está no cartão do CNPJ.</QuestionnaireDescription>
    <QuestionnaireChoices>
      <QuestionnaireChoice value="simples">Simples Nacional</QuestionnaireChoice>
      <QuestionnaireChoice value="presumido">Lucro Presumido</QuestionnaireChoice>
    </QuestionnaireChoices>
    <QuestionnaireError />
  </QuestionnaireItem>

  <QuestionnaireItem name="envio" multiple>
    <QuestionnaireTitle>Por onde a nota chega ao cliente?</QuestionnaireTitle>
    <QuestionnaireChoices>
      <QuestionnaireChoice value="email">E-mail</QuestionnaireChoice>
      <QuestionnaireChoice value="whatsapp">WhatsApp</QuestionnaireChoice>
    </QuestionnaireChoices>
    <QuestionnaireInput placeholder="Outro canal" />
  </QuestionnaireItem>

  <QuestionnaireFooter>
    <QuestionnairePrevious />
    <QuestionnaireSkip />
    <QuestionnaireNext />
    <QuestionnaireSubmit />
  </QuestionnaireFooter>
</Questionnaire>
```

## Uma pergunta por vez

Cada `QuestionnaireItem` é um `<fieldset>`, e o `QuestionnaireTitle` é a
`<legend>` dele: o leitor de tela anuncia a pergunta junto com cada opção. Só a
pergunta aberta aparece; as outras ficam escondidas e `inert`, fora do Tab e
fora da leitura. A troca desliza para o lado da direção, com a curva e a
duração dos tokens de movimento, e sem deslize quando o sistema pede para
reduzir movimento.

A ordem é a ordem em que os itens aparecem na árvore. `defaultItem` abre em
outra pergunta; `item` e `onItemChange` controlam a pergunta aberta pelo
`name`, para quem quer guardar o passo na URL.

`QuestionnaireProgress` escreve "Pergunta 2 de 5" e a barra do `Progress` com o
mesmo valor. Ao avançar, o foco vai para o primeiro controle da pergunta nova.

## Obrigatória e opcional

- **`required`** não deixa avançar sem resposta, e o "Pular" some.
- **Sem `required`**, a pergunta vale de dois jeitos: com resposta, ou pulada
  de propósito pelo "Pular". Avançar sem nenhum dos dois também mostra erro,
  porque em pesquisa pular por engano e pular por escolha são coisas
  diferentes. O título ganha a marca "Opcional".

Quando a validação falha, o `QuestionnaireError` do item diz o motivo (sem ele
na árvore, a frase sai sozinha no fim do item), o item fica descrito por ela, e
o foco vai para o primeiro controle. No envio, a validação passa por todas as
perguntas e volta para a primeira que falhou.

`onStatusChange` de cada item conta quando ele muda entre `unanswered`,
`answered` e `skipped`. `disabled` mostra a pergunta sem deixar responder: ela
fica fora da validação e das respostas.

## As respostas

As opções são `<input>` nativos, e o `name` do item é o `name` deles: sem
`multiple` são radios, com `multiple` são caixas de marcar. O
`QuestionnaireInput` também leva o `name` do item. Por isso o formulário é um
formulário de verdade, e o `onSubmit` recebe a mesma resposta de duas formas:

```tsx
<Questionnaire
  onSubmit={(answers, data) => {
    answers.regime // "simples"
    answers.envio // ["email", "Correio"]
    data.getAll('envio') // o mesmo, pelo FormData
  }}
/>
```

Pergunta pulada fica **ausente** dos dois, e não com texto vazio. Pular também
limpa o que já estava marcado nela.

Sozinho no item, o `QuestionnaireInput` é a resposta livre, e o nome dele é o
título da pergunta. Ao lado de opções ele é a resposta "outra", e o nome falado
é "Outra resposta": numa pergunta de escolha única, escrever nele desmarca a
opção, e marcar uma opção apaga o texto; com `multiple`, o texto entra na lista
junto com as marcadas.

## O teclado

Cada opção tem um atalho: **A**, **B**, **C**, ou **1**, **2**, **3** com
`shortcuts="numbers"`. A letra aparece na própria opção e vai para o
`aria-keyshortcuts` do input. O atalho vale com o foco dentro do questionário e
**para enquanto se digita** num campo: escrever "abc" no campo livre não marca
nada. `shortcuts={false}` desliga.

**Ctrl+Enter** (ou **⌘+Enter**) valida e avança, e na última pergunta envia.
No campo livre, Enter faz o mesmo.

## Com um agente de IA

É a forma de o agente pedir esclarecimento sem sair da conversa: o `ToolCall`
mostra o que ele quer, e o questionário colhe a resposta. Quando a pessoa
envia, a chamada vira `done` com as respostas de saída.

```tsx
const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null)

<ToolCall
  name="pedir_esclarecimento"
  title="Preciso de duas respostas antes de emitir"
  status={answers ? 'done' : 'approval'}
  output={answers ?? undefined}
/>
{!answers && (
  <Questionnaire shortcuts="numbers" onSubmit={(sent) => setAnswers(sent)}>
    <QuestionnaireItem name="retencao" required>
      <QuestionnaireTitle>A clínica retém o ISS?</QuestionnaireTitle>
      <QuestionnaireChoices>
        <QuestionnaireChoice value="sim">Sim, retém</QuestionnaireChoice>
        <QuestionnaireChoice value="nao">Não retém</QuestionnaireChoice>
      </QuestionnaireChoices>
    </QuestionnaireItem>
    <QuestionnaireFooter>
      <QuestionnaireSubmit>Responder ao agente</QuestionnaireSubmit>
    </QuestionnaireFooter>
  </Questionnaire>
)}
```

`shortcuts="numbers"` combina com o campo de prompt ao lado: letra é o que a
pessoa digita na conversa, e o atalho só vale com o foco no questionário.

## Os textos

Todos saem em português e todos se trocam por `labels`: `progress` (recebe a
posição e o total), `previous`, `skip`, `next`, `submit`, `required`,
`unanswered`, `other` e `optional`. Os botões também aceitam filho, que vale
só para aquele botão.

## Partes

- `QuestionnaireProgress`: o texto e a barra; aceita o `classNames` do
  `Progress` (`label`, `value`, `track`, `indicator`).
- `QuestionnaireItem`, `QuestionnaireTitle`, `QuestionnaireDescription`: a
  pergunta.
- `QuestionnaireChoices`, `QuestionnaireChoice`: as opções. `classNames` da
  opção alcança `control` (a linha inteira), `key`, `label`, `description` e
  `indicator`.
- `QuestionnaireInput`: a resposta livre, ou a "outra".
- `QuestionnaireError`: a frase do erro, no lugar que você escolher.
- `QuestionnaireFooter` com `QuestionnairePrevious`, `QuestionnaireSkip`,
  `QuestionnaireNext` e `QuestionnaireSubmit`: os botões são o `Button` da
  casa. O "Voltar" encosta à esquerda, o "Próxima" some na última pergunta e o
  "Enviar" só existe nela.

## Quando não usar

- **Todas as perguntas cabem numa tela**: use o `Form`, com um `FormField` por
  pergunta. Esconder quatro perguntas curtas atrás de quatro cliques troca uma
  olhada por uma sequência, e quem quer revisar antes de enviar não vê nada.
- **Etapas longas, cada uma com vários campos**: use `Steps` com o
  `useWizard`. O questionário é uma pergunta por tela; um cadastro em que cada
  passo tem endereço, telefone e documento é assistente, e a régua do `Steps`
  mostra os passos pelo nome.
- **Uma escolha só, dentro de outra tela**: `RadioGroup` ou `CheckboxGroup`.
  Um questionário de uma pergunta é um grupo de opções com progresso "1 de 1".
- **Confirmar uma ação do agente**: o `ToolCall` em `approval` já tem Aprovar e
  Recusar. O questionário é para quando a resposta não cabe num sim ou não.

## No React Native

Traduz, uma pergunta por vez e com os mesmos estados: obrigatória não avança sem resposta, opcional vale por resposta ou por pular, e o envio volta para a primeira pergunta que falhou. A regra de validação e os textos moram num arquivo só, compartilhado pelos dois pacotes, e `labels` troca os mesmos nomes.

A API é a do toque: tudo é controlado (`item` e `onItemChange`, `value` e `onValueChange`), e as perguntas vêm por `items`, cada uma com `type` `single`, `multiple` ou `text`, e `other` para o campo de resposta outra. Não há atalho de letra, porque não há teclado físico; a troca de pergunta e o erro saem pelo anúncio do leitor de tela do sistema, e a pergunta nova entra com os tokens de movimento.
