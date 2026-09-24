---
category: IA
---

# PromptInput

O campo onde a pessoa escreve para um assistente: cresce com o texto, envia no
Enter, quebra a linha no Shift+Enter e troca o botão de enviar pelo de parar
enquanto a resposta chega. Vive em `@rivocode/ui/ai`.

```tsx
import { PromptInput } from '@rivocode/ui/ai'

<PromptInput
  streaming={isStreaming}
  onSubmit={(text) => send(text)}
  onStop={() => stop()}
/>
```

A peça não conhece modelo, SDK nem rede. Ela entrega o texto no `onSubmit` e
recebe de volta o `streaming`; quem fala com o modelo é a sua tela, com o SDK
que ela já usa.

## Enviar, quebrar a linha e parar

- **Enter envia.** Com o campo vazio (só espaço conta como vazio), desabilitado
  ou em `streaming`, não envia nada.
- **Shift+Enter quebra a linha.** A dica está ligada ao campo por
  `aria-describedby`, então quem usa leitor de tela ouve as duas regras ao
  entrar nele.
- **Enter no meio de uma composição do teclado não envia.** Quem digita com
  acento morto ou com teclado de ideogramas confirma a letra com Enter, e
  mandar a mensagem pela metade ali é o defeito mais comum desse tipo de campo.
- **Em `streaming`, o botão vira o de parar**, com o nome "Parar resposta", e
  chama o `onStop`. O campo continua aceitando texto para a próxima pergunta:
  só o envio espera.

O campo cresce até `maxRows` linhas (8, sem a prop) e, dali em diante, rola por
dentro.

## Controlado ou não

Sem `value`, a peça guarda o texto e o limpa depois de enviar. Com `value` e
`onValueChange`, quem limpa é você, no `onSubmit`: é o que permite devolver o
texto ao campo quando o envio falha.

```tsx
const [text, setText] = useState('')

<PromptInput
  value={text}
  onValueChange={setText}
  onSubmit={async (value) => {
    setText('')
    const ok = await send(value)
    if (!ok) setText(value)
  }}
/>
```

## Anexos, ações e contador

`attachments` é o lugar acima do campo para o que já foi anexado: fichas,
miniaturas. `actions` é o canto esquerdo do rodapé, para anexar, escolher o
modelo ou ditar. A peça **não escolhe arquivo**: ela só reserva o lugar, e o
seletor é seu.

`showCount` mostra a contagem de caracteres, como `120/4000` quando há
`maxLength`. Ao bater no teto a contagem vai para o tom de perigo, e o campo
recusa o que passa dele.

```tsx
<PromptInput
  maxLength={4000}
  showCount
  attachments={<Badge>nota-agosto.pdf</Badge>}
  actions={
    <IconButton label="Anexar arquivo" variant="ghost" size="sm">
      <Paperclip />
    </IconButton>
  }
/>
```

## Nomes

O campo se chama "Mensagem", o botão "Enviar mensagem" e o de parar "Parar
resposta". `label`, `submitLabel` e `stopLabel` trocam os três, para outra
língua ou para um assistente com nome próprio.

## Partes

`classNames` alcança `attachments`, `textarea`, `footer`, `count` e `submit` (o
botão de enviar e o de parar, que ocupam o mesmo lugar).

## Quando não usar

- **Texto longo de formulário** é `Textarea`. O `Textarea` guarda uma
  observação, uma descrição de serviço, e é enviado junto com o resto do
  formulário; o `PromptInput` é uma conversa, e cada Enter é um envio. Um
  campo de observação que envia no Enter perde o texto da pessoa na primeira
  quebra de linha.
- **Busca** é `SearchInput`. Pergunta para um assistente e filtro de lista
  parecem a mesma caixa, mas a busca responde enquanto se digita e não tem
  botão de parar.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/ai`, com os mesmos `streaming`, `onStop`, `attachments`, `actions`, `maxLength`, `showCount` e os mesmos nomes acessíveis ("Mensagem", "Enviar mensagem", "Parar resposta").

**É controlado.** `value` e `onValueChange` são obrigatórios, como todo campo do pacote, e quem limpa o campo depois do `onSubmit` é quem chamou.

**O envio é só pelo botão.** No teclado do celular, a tecla de retorno de um campo de várias linhas quebra a linha, e é isso que a pessoa espera dela; não há Shift para separar os dois gestos. O campo cresce até `maxRows` linhas (6, sem a prop) e rola por dentro.
