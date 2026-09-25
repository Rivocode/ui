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

Traduz, e muda de assunto no caminho. No web a peça existe pela **barra**: a do sistema ocupa largura no Windows e desenha diferente em cada plataforma. No celular a barra é do sistema e fica sendo, e o problema de rolagem que dói é outro: **o teclado cobre o campo**. Formulário no fim da tela some debaixo dele, e o botão de enviar fica escondido até alguém fechar o teclado para achá-lo.

Então o `ScrollArea` nativo é a tela de formulário. Por baixo é o `KeyboardAwareScrollView` da `react-native-keyboard-controller`: ao focar um campo, a rolagem anda até ele parar `bottomOffset` pontos acima do teclado (16 por padrão), no mesmo quadro em que o teclado sobe, nos dois sistemas. O toque num item da lista não fecha o teclado (`keyboardShouldPersistTaps="handled"`).

```tsx
<ScrollArea
  contentContainerClassName="gap-4 p-5"
  footer={<Button onPress={emitir}>Emitir nota</Button>}
>
  <Field label="Descrição">…</Field>
</ScrollArea>
```

O `footer` é a ação presa embaixo da rolagem, e ele **sobe junto com o teclado**: o botão de enviar fica sempre à vista. A altura dele entra na conta de onde o campo em foco para, então nenhum campo fica escondido atrás do botão. Com o "reduzir movimento" ligado, o rodapé pula direto para cima do teclado em vez de acompanhá-lo; a rolagem até o campo continua, porque sem ela o campo fica coberto.

Não há `horizontal`: fila de cartões que rola de lado é `ScrollView` puro, e não tem campo para o teclado cobrir. A `react-native-keyboard-controller` é peer do pacote, e o `KeyboardProvider` que ela pede já vem dentro do `RivoProvider`.

O conteúdo que rola se veste pelo `contentContainerClassName`, o nome que a `ScrollView` já dá a ele, e a faixa do `footer` pelo `classNames.footer`.
