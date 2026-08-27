---
category: Formulário
---

# RadioGroup

Agrupa os `Radio` e cuida da escolha única e da navegação por setas. Passe
`aria-label` ou aponte para um título com `aria-labelledby`: sem isso o grupo
existe para o mouse e não para o leitor de tela.

## No React Native

Traduz com `items` na raiz: não há `Radio` solto para compor, e tudo é controlado.

**O `label` é o `aria-label` do web com outro nome.** A página de lá já cobrava: sem nome, o grupo existe para o dedo e não para o leitor de tela. Aqui não havia como cobrar, e o buraco era pior do que faltar a prop: o `forValue` do subcaminho de formulário já entregava `accessibilityLabel`, mas o tipo é fechado e espalhamento em JSX não confere propriedade excedente, então o nome era **descartado em silêncio com o TypeScript verde**.

Ele não desenha nada: o texto visível é do `Field`, como no `Select` e no `Combobox`. Dentro de um `FormField`, repita ali o mesmo texto do `label` dele.
