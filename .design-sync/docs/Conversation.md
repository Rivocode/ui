---
category: IA
---

# Conversation

A lista rolável de mensagens de uma conversa com um assistente. Gruda no fim
enquanto o texto chega, para de grudar quando a pessoa rola para cima para
reler, e oferece o botão "Ir para o fim" para voltar. Vive em
`@rivocode/ui/ai`.

```tsx
import { Conversation, Message, PromptInput } from '@rivocode/ui/ai'

<div className="flex h-[32rem] flex-col gap-3">
  <Conversation className="flex-1">
    {messages.map((message) => (
      <Message key={message.id} role={message.role} streaming={message.streaming}>
        {message.text}
      </Message>
    ))}
  </Conversation>
  <PromptInput onSubmit={send} />
</div>
```

**A altura é sua, por classe.** A conversa rola dentro do espaço que o pai
der; sem altura definida ela cresce com as mensagens e empurra a página, que é
o contrário de uma conversa.

## Grudar no fim, e soltar

Enquanto a pessoa está no fim, toda mudança de tamanho (mensagem nova, pedaço
de texto novo, imagem que carregou) rola até o fim. Quando ela rola para cima,
a conversa solta: o texto continua chegando embaixo e a leitura dela não pula.
Aparece então o botão "Ir para o fim", que volta, gruda de novo e some.

A volta é suave, e vira salto quando o sistema pede menos movimento.
`scrollLabel` troca o texto do botão.

## Para o leitor de tela

A área é uma região `role="log"` com `aria-live="polite"` e o nome "Conversa"
(ou o que `label` disser): mensagem nova é anunciada quando o leitor termina a
frase, e não no meio dela. Junto com o `aria-busy` da `Message` em
`streaming`, a resposta é lida inteira no fim, e não pedaço por pedaço.

A área recebe foco pelo teclado, para rolar com as setas.

## Vazia

`empty` desenha o `EmptyState` da casa quando não há mensagem nenhuma. As
`suggestions` viram botões, e o toque entrega o texto ao `onSuggestion`. Sem
`onSuggestion`, as sugestões não aparecem: botão que não faz nada é pior que
nenhum.

```tsx
<Conversation
  empty={{
    title: 'Pergunte sobre as suas notas',
    description: 'O assistente lê as notas emitidas nesta conta, e nada além delas.',
    suggestions: ['Quanto faturei em agosto?', 'Quais notas vencem esta semana?'],
  }}
  onSuggestion={send}
/>
```

## Partes

`classNames` alcança `viewport` (a área que rola), `content` (a coluna das
mensagens), `empty`, `suggestions` e `scrollButton`.

## Quando não usar

- **Lista longa de linhas iguais** é `VirtualList`. A `Conversation` desenha
  todas as mensagens, porque uma conversa tem dezenas e não milhares, e o que
  ela resolve é o grudar no fim. Um registro de dez mil eventos pede a lista
  virtualizada.
- **Histórico de acontecimentos em ordem** é `Timeline`. A `Timeline` olha para
  trás e não recebe nada novo enquanto a pessoa lê; a `Conversation` existe
  justamente para o que está chegando agora.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/ai`, sobre uma `FlatList` invertida: o fim da conversa é o começo da lista, então quem está lá continua lá quando o texto cresce, sem conta nenhuma. Rolar para cima mostra o mesmo botão "Ir para o fim", e a lista segura a posição de leitura enquanto a mensagem nova chega embaixo.

**A lista vem por `items`**, como todo o pacote: `renderItem` desenha uma mensagem e `keyExtractor` dá a chave. A ordem é a do web (a mais nova por último), e a inversão é da peça. O `empty` com `suggestions` e o `onSuggestion` atravessam com os mesmos nomes.

**A mensagem nova é anunciada**, como no `role="log"` do web: no Android pela região viva, e no iOS pelo anúncio do sistema, uma vez por mensagem e só quando o `streaming` acaba. O texto dito é o texto solto que o `renderItem` devolve; quem desenha a mensagem por um componente próprio diz a frase em `announcement`, e `null` ali espera.

As partes vestem pelo mesmo `classNames` do web: `viewport` na `FlatList`, `content` no `contentContainerClassName` dela, `empty`, `suggestions` e `scrollButton`.
