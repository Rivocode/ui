---
category: Sobreposição
---

# AlertDialogContent

O painel da confirmação, com a tarja e o portal por dentro.

**Não fecha com Esc nem com clique fora**, e é a única diferença que importa em
relação ao `DialogContent`. O foco começa no botão que cancela: quem abriu por
engano sai apertando Enter, e sair é o que ele deve conseguir fazer sem ler.

No celular os botões empilham e ocupam a largura toda, com o que confirma no
alto da pilha e o que cancela rente ao polegar.

A tarja é irmã do painel dentro do portal, então nem `className` nem variante de
descendente alcançam ela. Para vestir a tarja, use `classNames` com a parte
`backdrop`:

```tsx
<AlertDialogContent classNames={{ backdrop: "backdrop-blur-md" }}>
```
