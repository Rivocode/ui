---
category: Formulario
---

# Form

O `<form>` e o contexto do React Hook Form numa peca so, para o `FormField`
achar o `control` sozinho. Vive em `@rivocode/ui/form`.

Vai com `noValidate`: quem valida e o schema, e o balao nativo do navegador
apareceria em ingles, fora do tema e antes da nossa mensagem.

O `onSubmit` recebe os valores ja validados e convertidos. Use com o
`useZodForm`, que liga o resolver e separa o tipo de entrada do de saida.
