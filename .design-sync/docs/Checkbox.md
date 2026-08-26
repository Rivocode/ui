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

## Desabilitado

Desabilitado se pinta com token, e não com opacidade: o fundo passa a
`surface-raised` e o visto vai para `fg-disabled`. Vale marcada, desmarcada e no
estado misto — antes o `indeterminate` vencia o desabilitado, e a caixa de
selecionar-todas saía pintada de acento cheio.

A borda não muda com o estado, de propósito. `border-strong` é a fronteira de
controle nos 3:1 da WCAG 1.4.11, e `border` diz de si mesmo que separa área e
não identifica controle: medida, ela dá 1,3:1 contra o próprio preenchimento nos
dois temas, e a caixa travada sumiria em vez de parecer travada.

## Quando não usar

Para o ajuste que vale na hora — notificação que liga, modo escuro, recurso que
a conta passa a ter — use `Switch`. A caixa promete um Salvar depois; a chave
promete que já valeu. Uma caixa de marcar numa tela de preferências sem botão
de salvar deixa a pessoa esperando por um botão que não existe.

Para escolher uma opção entre várias que se excluem, é `RadioGroup`: caixa que
desmarca a irmã ao ser marcada é um rádio malfeito.

## No React Native

Traduz, com um porém que morde na primeira linha: no nativo o `Checkbox` é **sempre controlado**. `checked` e `onCheckedChange` são obrigatórios, não há `defaultChecked` e não há `indeterminate` — a caixa de selecionar-todas do web não tem terceiro estado lá. Copiar `<Checkbox defaultChecked>ISS retido</Checkbox>` do web não compila.
