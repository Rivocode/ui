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

## No React Native

Não porta, por decisão - rolagem é da plataforma: `ScrollView` e `FlatList`, com a barra que o sistema desenha. Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de cada uma.
