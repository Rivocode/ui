---
category: Forms
---

# Questionnaire

A form that asks **one question at a time**. It keeps the answers, says which
question the person is on, validates before moving on and takes care of going
back, skipping and submitting. It serves the AI agent that needs a
clarification before acting, onboarding, the short survey, triage and initial
setup.

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

## One question at a time

Each `QuestionnaireItem` is a `<fieldset>`, and `QuestionnaireTitle` is its
`<legend>`: the screen reader announces the question along with each option.
Only the open question shows; the others stay hidden and `inert`, out of Tab
and out of reading. The switch slides toward the direction of travel, with the
curve and duration of the motion tokens, and with no slide when the system asks
to reduce motion.

The order is the order in which the items appear in the tree. `defaultItem`
opens on another question; `item` and `onItemChange` control the open question
by `name`, for whoever wants to keep the step in the URL.

`QuestionnaireProgress` writes "Pergunta 2 de 5" and the `Progress` bar with the
same value. On moving forward, focus goes to the first control of the new
question.

## Required and optional

- **`required`** does not let you move on without an answer, and "Pular"
  disappears.
- **Without `required`**, the question counts in two ways: answered, or skipped
  on purpose through "Pular". Moving on with neither also shows an error,
  because in a survey skipping by mistake and skipping by choice are different
  things. The title gets the "Opcional" mark.

When validation fails, the item's `QuestionnaireError` says why (without it in
the tree, the sentence comes out on its own at the end of the item), the item
is described by it, and focus goes to the first control. On submit, validation
runs through every question and goes back to the first one that failed.

Each item's `onStatusChange` reports when it changes between `unanswered`,
`answered` and `skipped`. `disabled` shows the question without letting it be
answered: it stays out of validation and out of the answers.

## The answers

The options are native `<input>`s, and the item's `name` is their `name`:
without `multiple` they are radios, with `multiple` they are checkboxes.
`QuestionnaireInput` also carries the item's `name`. That is why the form is a
real form, and `onSubmit` receives the same answer in two shapes:

```tsx
<Questionnaire
  onSubmit={(answers, data) => {
    answers.regime // "simples"
    answers.envio // ["email", "Correio"]
    data.getAll('envio') // the same, through FormData
  }}
/>
```

A skipped question is **absent** from both, and not an empty text. Skipping
also clears whatever was already checked in it, and the clearing goes through
each control's `onChange`: a controlled `QuestionnaireInput` receives the empty
text as if the person had deleted it, and the state of whoever controls it
follows the screen.

On the server, the open question already comes out in the HTML: `item`,
`defaultItem` or, with neither, the first in page order, with its buttons.

Alone in the item, `QuestionnaireInput` is the free answer, and its name is the
question's title. Next to options it is the "other" answer, and the spoken name
is "Outra resposta": in a single-choice question, typing in it unchecks the
option, and checking an option clears the text; with `multiple`, the text
joins the list along with the checked ones.

## The keyboard

Each option has a shortcut: **A**, **B**, **C**, or **1**, **2**, **3** with
`shortcuts="numbers"`. The letter shows on the option itself and goes into the
input's `aria-keyshortcuts`. The shortcut works with focus inside the
questionnaire and **stops while typing** in a field: typing "abc" in the free
field checks nothing. `shortcuts={false}` turns it off.

**Ctrl+Enter** (or **⌘+Enter**) validates and moves on, and on the last
question submits. In the free field, Enter does the same.

## With an AI agent

It is how the agent asks for clarification without leaving the conversation:
`ToolCall` shows what it wants, and the questionnaire collects the answer. When
the person submits, the call becomes `done` with the answers as output.

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

`shortcuts="numbers"` goes well with the prompt field next to it: letters are
what the person types in the conversation, and the shortcut only works with
focus in the questionnaire.

## The texts

They all come out in Portuguese and all are swapped through `labels`:
`progress` (receives the position and the total), `previous`, `skip`, `next`,
`submit`, `required`, `unanswered`, `other` and `optional`. The buttons also
accept a child, which applies only to that button.

## Parts

- `QuestionnaireProgress`: the text and the bar; accepts the `Progress`
  `classNames` (`label`, `value`, `track`, `indicator`).
- `QuestionnaireItem`, `QuestionnaireTitle`, `QuestionnaireDescription`: the
  question.
- `QuestionnaireChoices`, `QuestionnaireChoice`: the options. The option's
  `classNames` reaches `control` (the whole row), `key`, `label`,
  `description` and `indicator`.
- `QuestionnaireInput`: the free answer, or the "other" one.
- `QuestionnaireError`: the error sentence, wherever you choose.
- `QuestionnaireFooter` with `QuestionnairePrevious`, `QuestionnaireSkip`,
  `QuestionnaireNext` and `QuestionnaireSubmit`: the buttons are the house
  `Button`. "Voltar" hugs the left, "Próxima" disappears on the last question
  and "Enviar" only exists there.

## When not to use

- **All the questions fit on one screen**: use `Form`, with one `FormField` per
  question. Hiding four short questions behind four clicks trades a glance for
  a sequence, and whoever wants to review before submitting sees nothing.
- **Long steps, each with several fields**: use `Steps` with `useWizard`. The
  questionnaire is one question per screen; a sign-up where each step has an
  address, a phone and a document is a wizard, and the `Steps` ruler shows the
  steps by name.
- **A single choice, inside another screen**: `RadioGroup` or `CheckboxGroup`.
  A one-question questionnaire is an option group with "1 of 1" progress.
- **Confirming an agent action**: `ToolCall` in `approval` already has Approve
  and Decline. The questionnaire is for when the answer does not fit in a yes
  or no.

## In React Native

Translates, one question at a time and with the same states: a required one does not advance without an answer, an optional one counts by answering or by skipping, and submitting goes back to the first question that failed. The validation rule and the texts live in a single file, shared by both packages, and `labels` replaces the same names.

The API is the touch one: everything is controlled (`item` and `onItemChange`, `value` and `onValueChange`), and the questions come through `items`, each with `type` `single`, `multiple` or `text`, and `other` for the other-answer field. There is no letter shortcut, because there is no physical keyboard; the question change and the error go out through the system screen reader's announcement, and the new question enters with the motion tokens.
