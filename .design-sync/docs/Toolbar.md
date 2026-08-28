---
category: Ações
---

# Toolbar

Barra de ferramentas: os controles ficam numa parada de tabulacao só, e as
setas andam entre eles.

E isso que a diferencia de uma `div` com botões: **dez botões soltos sao dez
paradas de Tab** entre o campo anterior e o proximo. Numa barra, e uma.

```tsx
<Toolbar>
  <ToolbarButton render={<Toggle />}>Negrito</ToolbarButton>
  <ToolbarButton render={<Toggle />}>Italico</ToolbarButton>
  <ToolbarSeparator />
  <ToolbarButton render={<Button variant="ghost" />}>Limpar formato</ToolbarButton>
</Toolbar>
```

Use `ToolbarButton` com `render` para vestir `Button`, `Toggle` ou `Select` sem
perder essa navegação.

## As partes

`ToolbarGroup` junta botões que fazem parte do mesmo assunto (alinhar à
esquerda, ao centro, à direita), e o `ToolbarSeparator` separa um grupo do
outro. Para o leitor de tela, o grupo é o que diz que as três opções são uma
escolha só.

## No React Native

Não porta, por decisão - superfície de edição de mesa: uma parada de tabulação e navegação por seta, que o toque não tem. Não é fila: não vai existir. A [tabela de paridade](/react-native) diz o porquê de cada uma.
