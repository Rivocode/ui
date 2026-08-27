---
category: Formulário
---

# Radio

O circulo, sem rótulo. O texto fica num `<label>` que envolve os dois, igual ao
Checkbox, para o clique no texto também marcar.

Use quando as opções cabem na tela e comparar entre elas importa. Passando de
umas cinco, o `Select` gasta menos espaço.

## O rótulo

Passe o texto como filho e o círculo sai dentro de um `<label>`:

```tsx
<RadioGroup defaultValue="pix">
  <Radio value="pix">Pix</Radio>
  <Radio value="boleto">Boleto</Radio>
</RadioGroup>
```

Sem filho, sai só o círculo, para quando o rótulo tiver estrutura própria.

## Partes

`classNames` veste cada parte pelo nome: `circle` é o círculo de fora,
`indicator` é a marca de dentro e `label` é o `<label>` que embrulha os dois.
`labelClassName` é o nome antigo de `classNames.label`, e continua valendo.

```tsx
<Radio value="pix" classNames={{ circle: 'size-5', indicator: 'size-2.5' }}>
  Pix
</Radio>
```

O respiro entre o círculo e o texto é o mesmo do `Checkbox` e do `Switch`, que
aparecem na mesma lista de formulário. E é menor do que o que separa uma opção
da seguinte, senão o rótulo ficaria mais perto da opção de baixo do que do
próprio círculo.

## Desabilitado

Desabilitado se pinta com token, e não com opacidade: o fundo passa a
`surface-raised` e a marca vai para `fg-disabled`. É a mesma receita do
`Checkbox`, borda inclusive. Ela não muda com o estado. Opacidade rebaixaria
tudo de uma vez, e a guarda de contraste do repositório não mede opacidade: o
par aprovado no arquivo de tema poderia reprovar na tela sem nada acusar.
