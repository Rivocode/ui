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

Ainda não portado — e falta menos do que parece. O `react-hook-form` roda no React Native sem adaptação, e o `useZodForm` é o mesmo Zod. O que não atravessou foi o `FormField` daqui, que liga o `Field` ao controle e põe rótulo, descrição e erro no lugar certo. Até lá, `Controller` na mão em volta do `Field` nativo, passando o `error` do `formState.errors` — o `Field` nativo já sabe que o erro vence a descrição.
