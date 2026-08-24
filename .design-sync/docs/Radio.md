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
