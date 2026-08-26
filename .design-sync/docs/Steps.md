---
category: Navegação
---

# Steps

A regua de passos de um formulário longo. Anda junto com o `useWizard()`.

No celular vira uma linha de texto com barra de progresso: quatro bolinhas com
rótulo em 390px viram quatro palavras cortadas, e o que importa ali e saber
quanto falta.

Só da para voltar, nunca pular para frente. Passo adiante costuma depender do
que o anterior validou, e um clique que atravessa isso leva a pessoa a uma tela
que ela não sabe preencher.

## O estado, e o rodapé

`useWizard(steps)` conta e valida a passagem, e não desenha nada. Devolve um
`WizardState`: o índice `step`, o `current` da lista, os avisos `isFirst` e
`isLast`, e `next`, `back` e `goTo`.

O `next` aceita uma checagem que pode ser assíncrona. Devolva `false` e o passo
não anda — é por aqui que entra o `trigger` do React Hook Form, sem o assistente
precisar conhecer o React Hook Form:

```tsx
const steps: Step[] = [
  { id: 'client', title: 'Cliente' },
  { id: 'items', title: 'Itens' },
  { id: 'review', title: 'Conferir' },
]

const wizard = useWizard(steps)

<Steps steps={steps} current={wizard.step} onStepClick={wizard.goTo} />

<WizardFooter>
  <Button variant="ghost" onClick={wizard.back} disabled={wizard.isFirst}>
    Voltar
  </Button>
  <Button onClick={() => wizard.next(() => form.trigger())}>
    {wizard.isLast ? 'Emitir' : 'Continuar'}
  </Button>
</WizardFooter>
```

`WizardFooter` põe voltar de um lado e avançar do outro, e no celular empilha na
ordem invertida com os dois ocupando a largura toda — o botão que continua fica
embaixo, onde o polegar está.

## Quando não usar

Para o que já aconteceu com alguma coisa — a trilha de uma nota, o histórico de
uma alteração — use `Timeline`. Esta régua é de assistente: olha para a frente,
sabe quantos passos faltam e existe para conduzir alguém até o fim de um
formulário. A linha do tempo olha para trás, e ninguém avança nela.

Dois ou três campos não pedem assistente. Quebrar em passos um formulário que
cabe numa tela troca a rolagem por cliques, e esconde de quem preenche o
tamanho do que ele aceitou fazer.

## No React Native

Ainda não portado — a régua de passos e o `useWizard()` não atravessaram. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
