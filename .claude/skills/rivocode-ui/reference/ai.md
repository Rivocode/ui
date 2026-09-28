# Interface de IA: `@rivocode/ui/ai`

Não vem no pacote principal. Não tem dependência nenhuma a instalar: é caminho
próprio pelo **peso**, porque só a tela que conversa com um modelo precisa
destas cinco peças.

**Nenhuma delas conhece SDK de IA.** A mensagem entra por prop, e o que a
pessoa faz sai por evento: `onSubmit`, `onStop`, `onRetry`, `onApprove`,
`onReject`, `onSuggestion`. Quem fala com o modelo é a sua tela, com o SDK que
ela já usa. Não instale nem importe SDK por causa destas peças.

```tsx
import { Conversation, Message, PromptInput, ToolCall, AILabel } from '@rivocode/ui/ai'
```

## A tela de conversa

```tsx
<div className="flex h-[32rem] flex-col gap-3">
  <Conversation
    className="flex-1"
    empty={{
      title: 'Pergunte sobre as suas notas',
      description: 'O assistente lê as notas emitidas nesta conta, e nada além delas.',
      suggestions: ['Quanto faturei em agosto?', 'Quais notas vencem esta semana?'],
    }}
    onSuggestion={send}
  >
    {messages.map((message) => (
      <Message
        key={message.id}
        role={message.role}
        streaming={message.streaming}
        copyValue={message.text}
        onRetry={message.role === 'assistant' ? () => retry(message.id) : undefined}
      >
        {message.text}
      </Message>
    ))}
  </Conversation>
  <PromptInput streaming={isStreaming} onSubmit={send} onStop={stop} />
</div>
```

- **A altura da `Conversation` é sua, por classe.** Sem ela a conversa cresce e
  empurra a página. Ela gruda no fim enquanto o texto chega, solta quando a
  pessoa rola para cima e mostra "Ir para o fim".
- **`streaming` vai nos dois lugares**: na `Message` que está chegando (anuncia
  `aria-busy`, mostra o indicador, esconde as ações) e no `PromptInput` (troca
  enviar por parar e segura o Enter).
- **`children` da `Message` é seu.** Renderize o markdown com a biblioteca que
  o projeto já tem; `copyValue` recebe o texto cru.
- `role` é `user` (balão à direita), `assistant` (texto corrido à esquerda) ou
  `system` (linha discreta no centro).

## O campo

`PromptInput`: Enter envia, Shift+Enter quebra a linha, e Enter no meio de uma
composição de teclado não envia. Sem `value`, ele se limpa depois de enviar;
com `value` e `onValueChange`, quem limpa é você. `attachments` e `actions` são
lugares: a peça não escolhe arquivo. `maxLength` com `showCount` mostra
`120/4000`.

Não use `Textarea` para conversa, nem `PromptInput` para observação de
formulário: um envia a cada Enter, o outro vai junto com o formulário.

## Ferramenta e aprovação

```tsx
<ToolCall
  name="emitir_nota"
  title="Emitir a nota da Clínica São Lucas"
  status={call.status}
  input={call.args}
  output={call.result}
  error={call.error}
  onApprove={() => approve(call.id)}
  onReject={() => reject(call.id)}
/>
```

`status` é `pending`, `running`, `done`, `error` ou `approval`, cada um com
ícone e texto. Em `approval` os botões aparecem fora do painel e o painel abre
sozinho; a peça não guarda a decisão, então mude o `status` você.

## Conteúdo gerado fora da conversa

O resumo que vai morar num cartão comum leva o `AILabel`:

```tsx
<div className="flex items-center gap-2">
  <CardTitle>Resumo de agosto</CardTitle>
  <AILabel explanation="Escrito pelo assistente a partir das notas de agosto. Confira os valores antes de enviar ao contador." />
</div>
```

Escreva a explicação com a origem, o limite e o que conferir. Estado de
registro continua sendo `Badge`; o `AILabel` diz só a origem. `aiLabelVariants`
sai junto, para quem precisa da classe do selo num elemento próprio.

## No React Native

Mesmas cinco peças em `@rivocode/ui-native/ai`, o único caminho do nativo sem
peer. O que muda: a `Conversation` vem por `items`, `renderItem` e
`keyExtractor` sobre uma `FlatList` invertida; o `PromptInput` é controlado e
envia só pelo botão; a `Message` tem `onCopy` no lugar do `copyValue`; e a
explicação do `AILabel` abre numa `Sheet`. Detalhe em
[native.md](native.md).
