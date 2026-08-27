---
category: Formulário
---

# CheckboxGroup

Grupo de caixas de marcar que compartilham um valor em lista.

Ganha o que caixas soltas não tem: com `allValues`, a caixa de "todos" marca e
desmarca o grupo inteiro e mostra o estado misto sozinha, sem ninguém contar
filho na mao.

```tsx
<CheckboxGroup defaultValue={['pix', 'boleto']} aria-label="Formas aceitas">
  <Checkbox name="forma" value="pix">Pix</Checkbox>
  <Checkbox name="forma" value="boleto">Boleto</Checkbox>
  <Checkbox name="forma" value="cartao">Cartão</Checkbox>
</CheckboxGroup>
```

O `name` é o mesmo em todas, porque é um campo só; o `value` é o que distingue
uma opção da outra e é o que entra na lista do grupo.

**O rótulo vai como filho**, e nunca num `<span>` ao lado: com filho a caixa sai
dentro de um `<label>` que ela mesma monta, e clicar no texto marca. Um `<label>`
escrito à mão em volta funciona no navegador e desfaz o trabalho da peça, e é
uma das poucas coisas que o contrato lista em "nunca faça".

Para o "selecionar todas", passe `allValues` com a lista inteira e marque a caixa
mestra com `parent`:

```tsx
<CheckboxGroup allValues={['pix', 'boleto', 'cartao']} defaultValue={['pix']}>
  <Checkbox parent>Todas</Checkbox>
  <Checkbox name="forma" value="pix">Pix</Checkbox>
  …
</CheckboxGroup>
```

Sem o `parent` a caixa de cima vira só mais uma opção: ela não lê o grupo, não
mostra o estado misto, e marcar as três não a marca. É o defeito mais fácil de
não notar aqui, porque a tela parece certa até alguém marcar metade da lista.

## No React Native

Traduz com `items` na raiz e `value: string[]`, em vez de um `Checkbox` por filho, e sem o `allValues`/`parent` do web, porque a caixa mestra de estado misto não tem terceiro estado do lado de cá.

**O `label` é o `aria-label` do web com outro nome**, pelo mesmo motivo do `RadioGroup`: a lista de caixas responde uma pergunta, e sem o nome do conjunto cada caixa se apresenta sem dizer qual. Nomear liga junto o papel de lista, porque no React Native não existe papel de `group` e uma `View` sem papel nenhum não carrega nome.
