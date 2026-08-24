---
category: Estrutura
---

# ScrollArea

Área de rolagem com barra própria.

Serve para quando a barra do sistema atrapalha o desenho: no Windows ela ocupa
largura e empurra o conteúdo, e a diferença entre plataformas aparece na tela.
**Para rolagem comum de página, `overflow-y-auto` continua sendo mais barato.**

```tsx
<ScrollArea className="h-48">
  {notas.map((nota) => (
    <p key={nota.id}>{nota.descricao}</p>
  ))}
</ScrollArea>
```

`horizontal` liga a barra de lado também, para tabela larga e fila de cartoes.
