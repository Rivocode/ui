---
category: Formulário
---

# FormField

Uma linha de formulário inteira: rótulo, controle, ajuda e erro, ligados entre
si. Vive em `@rivocode/ui/form`.

O controle vem por funcao, e não por clonagem do filho, porque cada controle do
catalogo recebe valor de um jeito e adivinhar qual falha na tela, não no tipo:

```tsx
<FormField name="email" label="E-mail">
  {(campo) => <Input {...campo} />}
</FormField>
```

Para `Input` e `Textarea`, espalhar o campo basta. Para `Select`, `Checkbox` e
`DatePicker`, os adaptadores fazem a ponte.

Ele não inventa `id` nenhum: quem liga o rótulo ao controle e o `Field` da Base
UI, pelo contexto.
