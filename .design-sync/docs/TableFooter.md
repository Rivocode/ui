---
category: Estrutura
---

# TableFooter

O rodapé da tabela, num `<tfoot>` de verdade. É onde mora a linha de totais.

Toda listagem financeira daqui termina em "Total: R$ 248,3K", e até agora essa
linha era uma `<div>` embaixo da tabela. Uma `<div>` não participa do algoritmo
de layout de tabela: ela não conhece a largura de nenhuma coluna, então o total
nunca fica debaixo do valor que ele soma. E, numa tabela com moldura própria,
ela rola embora junto com o conteúdo.

Dentro da tabela as duas coisas se resolvem sozinhas: a célula divide a largura
com a coluna, e o rodapé pode grudar embaixo pelo mesmo mecanismo com que o
`TableHeader` gruda em cima.

```tsx
<Table>
  <TableHeader>…</TableHeader>
  <TableBody>…</TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell className="text-right font-mono">{currencyShort(total)}</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

O peso é proposital: o rodapé é resumo, e resumo não pode se ler como mais uma
linha de dado.

**O dinheiro sai abreviado**, como no resto da casa: `currencyShort`, e não o
valor por extenso. O `currency` fica para onde o centavo é o assunto: o valor
que a pessoa confirma antes de emitir, e o comprovante depois.

Para grudar o rodapé numa tabela que rola por dentro, o `sticky` vai na classe,
com o degrau de empilhamento da família:

```tsx
<TableFooter className="sticky bottom-0 z-[var(--rc-z-sticky)] bg-surface">
```

O fundo não é opcional: sem ele a linha que passa por baixo aparece através do
rodapé.

## Quando não usar

Numa listagem que vem de uma consulta, não monte o `<tfoot>` à mão: o
`DataTable` produz a linha sozinho, a partir do `total` de cada coluna, e ali
ele já sabe quais linhas somar, qual coluna esconder no celular e quando grudar.
