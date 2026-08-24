---
category: Formulário
---

# Checkbox

Caixa de marcar.

`indeterminate` e o estado misto: alguns itens marcados, nem todos. E o que a
caixa de "selecionar todas" mostra quando parte da lista esta selecionada.

Sem rótulo visível ao lado, passe `aria-label`.

## O rótulo

Passe o texto como filho e a caixa sai dentro de um `<label>`, então clicar no
texto também marca:

```tsx
<Checkbox defaultChecked>ISS retido na fonte</Checkbox>
```

Sem filho, sai só a caixa, e o arranjo fica com quem monta a tela. Use assim
quando o rótulo tiver estrutura própria: um título com descrição embaixo, um
link no meio da frase. Nesse caso, o `<label>` em volta é seu, e é ele que faz
o clique no texto valer.
