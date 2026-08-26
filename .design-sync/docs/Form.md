---
category: Formulário
---

# Form

O `<form>` e o contexto do React Hook Form numa peça só, para o `FormField`
achar o `control` sozinho. Vive em `@rivocode/ui/form`.

Vai com `noValidate`: quem valida e o schema, e o balao nativo do navegador
apareceria em ingles, fora do tema e antes da nossa mensagem.

O `onSubmit` recebe os valores já validados e convertidos. Use com o
`useZodForm`, que liga o resolver e separa o tipo de entrada do de saída.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/form` — o mesmo arranjo do web, e pela mesma razão: o `react-hook-form` é peer opcional. O `useZodForm` é idêntico, linha por linha, porque não há navegador nele.

**O que muda é quem dispara o envio.** No React Native não existe `<form>`, não existe `type="submit"` e não existe Enter que envie: nada é implícito. Então o `Form` entrega o envio a quem desenha o botão — `children` pode ser uma função que recebe `{ submit, isSubmitting }` —, e continua aceitando JSX comum para quando o botão mora fora, numa barra fixa no rodapé da tela.

**E muda a ponte com o controle.** No web o `Field` da Base UI liga rótulo, ajuda e erro a qualquer controle que esteja dentro, pelo contexto; aqui não há contexto nenhum — o `Field` nativo desenha um `Text` em cima e outro embaixo, e o controle do meio não fica sabendo de nada. Por isso o campo que o `FormField` entrega leva duas coisas a mais, `accessibilityLabel` e `invalid`, e os adaptadores as põem no controle: sem isso, um `TextInput` sob um rótulo fica **sem nome nenhum** para o leitor de tela. O `label` do `FormField` é obrigatório aqui pela mesma razão.

Os adaptadores são quatro. `forValue`, `forChecked` e `forDate` têm o nome e o trabalho do web — o `forDate` agora converte o vazio para `null` e fala ISO, que é o que o `DatePicker` e o `DateRangePicker` nativos pedem. O quarto é só daqui: `forText`, para `Input` e `Textarea`, porque o `TextInput` chama `onChangeText` com a string crua e não com um evento — espalhar o campo nele guardaria no formulário um objeto de evento que não existe. Ele leva o `ref` junto, e aí o `form.setFocus()` funciona de verdade: `TextInput` tem `focus()`.
