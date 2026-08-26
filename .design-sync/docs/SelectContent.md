---
category: Formulário
---

# SelectContent

A lista flutuante do select.

Nasce com a largura do gatilho e rola sozinha quando não cabe na tela. O portal
usa o contêiner do `RivoProvider`, então o tema vale dentro dela.

`side`, `align` e `sideOffset` posicionam o painel, como nas outras peças que
flutuam. **Pedir qualquer um dos três troca o modo de posicionamento**: por
padrão a lista se sobrepõe ao gatilho para alinhar o item escolhido com o texto
dele, e nesse modo não há lado nem folga a respeitar. Quem não pede nada
continua com o alinhamento pelo item.

```tsx
<SelectContent side="top" align="start">
  <SelectItem value="abertas">Abertas</SelectItem>
</SelectContent>
```
