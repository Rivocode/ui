---
category: Formulário
---

# CheckboxGroup

Grupo de caixas de marcar que compartilham um valor em lista.

Ganha o que caixas soltas não tem: com `allValues`, a caixa de "todos" marca e
desmarca o grupo inteiro e mostra o estado misto sozinha, sem ninguém contar
filho na mao.

```tsx
<CheckboxGroup defaultValue={['pix', 'boleto']}>
  <Checkbox name="pix">Pix</Checkbox>
  <Checkbox name="boleto">Boleto</Checkbox>
  <Checkbox name="cartao">Cartao</Checkbox>
</CheckboxGroup>
```

Para o "selecionar todas", passe `allValues` com a lista inteira e use uma
`Checkbox` sem `name` como mestra, ela le o grupo e se resolve.
