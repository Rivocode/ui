---
category: Estrutura
---

# AspectRatio

Segura a proporção de uma caixa antes do conteúdo dela chegar.

```tsx
<AspectRatio ratio={16 / 9}>
  <img src={capa} alt="" />
</AspectRatio>
```

Serve para o que tem tamanho vindo de fora: imagem de produto, mapa,
incorporação de vídeo. Sem ela a linha inteira pula quando a imagem carrega, e a
pessoa clica no lugar errado porque o botão andou meio segundo depois de ela
mirar.

Imagem, vídeo e iframe dentro dela cobrem a moldura sozinhos. Imagem menor que a
caixa deixaria um vão que parece defeito de carregamento.

## Por que existe, se o CSS já faz

`aspect-ratio` resolve isto sozinho hoje. A peça existe para a proporção virar um
número passado por prop, e não mais uma classe arbitrária escrita em cada tela,
cada uma com um valor ligeiramente diferente.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `AspectRatio` - `ratio` numérico, igual. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
