---
category: IA
---

# Message

Uma mensagem de conversa com um assistente: quem fala, o conteúdo, as ações de
copiar e tentar de novo, e o indicador de que o texto ainda está chegando. Vive
em `@rivocode/ui/ai`.

```tsx
import { Message } from '@rivocode/ui/ai'

<Message role="user">Quanto faturei em agosto?</Message>
<Message role="assistant" copyValue={answer} onRetry={retry}>
  {answer}
</Message>
```

## O papel decide o desenho

- `user` é o balão à direita, no fundo do acento.
- `assistant` é o texto corrido à esquerda, sem balão: é onde mora a resposta
  longa, a lista e a tabela, e balão aperta tudo isso.
- `system` é a linha discreta no centro, para "Conversa iniciada às 14h02" e
  para o aviso de que o contexto mudou.

Cada mensagem sai como um `article` com o nome de quem fala ("Você",
"Assistente", "Sistema"), e o leitor de tela anda de uma para a outra por aí.
`author` troca o nome, para o assistente que tem nome próprio.

`avatar` recebe o `Avatar` da casa e fica do lado de quem fala. Em `system` ele
não sai.

## O conteúdo é seu

`children` é o que aparece, e a peça não interpreta nada: quem usa renderiza o
markdown com a biblioteca que já tem, e passa o resultado. Isso é de propósito.
Markdown de modelo traz tabela, código e link, e cada produto decide o que
aceita.

```tsx
<Message role="assistant" copyValue={raw}>
  {renderMarkdown(raw)}
</Message>
```

## Chegando

`streaming` diz que o texto ainda está chegando. Três coisas mudam:

- os três pontos aparecem depois do texto (ou sozinhos, antes do primeiro
  pedaço), e param de pulsar quando o sistema pede menos movimento;
- a mensagem anuncia `aria-busy`, e o leitor de tela espera ela terminar em
  vez de ler cada pedaço que chega;
- as ações somem: copiar meia resposta e pedir outra enquanto a primeira nem
  terminou são os dois toques que ninguém quer.

## Ações e erro

`copyValue` liga o botão de copiar, com o texto que vai para a área de
transferência. Passe o texto cru (o markdown, e não o que ele desenha), porque
é isso que a pessoa cola em outro lugar. `onRetry` liga o "Tentar de novo".
`actions` recebe os botões próprios, depois dos dois: gostei, não gostei,
salvar.

`error` é a resposta que falhou. A frase sai embaixo do conteúdo, com ícone e
no tom de perigo, e as ações aparecem mesmo sem conteúdo nenhum.

```tsx
<Message
  role="assistant"
  error="A resposta foi interrompida. Tente de novo."
  onRetry={retry}
>
  {partial}
</Message>
```

## Partes

`classNames` alcança `avatar`, `bubble` (o balão do `user`, e a coluna do
`assistant`), `content`, `indicator`, `error` e `actions`.

## Quando não usar

- **Conteúdo que não é turno de conversa** é `Card`. Um resumo gerado por IA
  numa tela de painel é um cartão com um `AILabel`, e não uma mensagem: não há
  quem pergunte nem a quem responder.
- **Linha de lista com ícone, texto e ação** é `Item`. Um histórico de
  conversas antigas, com o título de cada uma, é lista de `Item`; a `Message` é
  o que aparece depois que a pessoa abre uma delas.
- **Comentário de pessoa para pessoa**, com data e autor, é `Timeline`. A
  `Message` pressupõe dois lados alternando, e o alinhamento por papel perde o
  sentido num fio de cinco pessoas.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/ai`, com o mesmo `role`, o mesmo alinhamento, o mesmo `author`, `avatar`, `streaming`, `onRetry`, `actions` e `error`. Em `streaming` a mensagem anuncia `busy` e esconde as ações, como no web.

**Copiar é seu.** O web copia sozinho pelo `copyValue`; aqui a peça tem `onCopy`, porque a área de transferência do celular é o `expo-clipboard`, peer que mora em `@rivocode/ui-native/clipboard` e que o caminho de IA não pode cobrar de quem não copia nada. Texto solto em `children` vira `Text` no corpo da casa; nó entra como veio, para quem renderiza markdown.

As partes vestem pelo mesmo `classNames` do web: `avatar`, `bubble`, `content`, `indicator`, `error` e `actions`. `content` veste o `Text` que embrulha o texto solto; nó que chega pronto entra como veio.
