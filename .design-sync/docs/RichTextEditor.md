---
category: Formulário
---

# RichTextEditor

O campo de texto com formatação: negrito, itálico, sublinhado, tachado,
código, dois níveis de título, listas, citação, bloco de código e link, com
desfazer, refazer e limpar formatação. Entrega o documento em HTML, e o
`RichTextView` exibe o que ele salvou com a mesma tipografia. Vive em
`@rivocode/ui/editor`, sobre o Tiptap 3.

```bash
npm install @tiptap/react @tiptap/pm @tiptap/core @tiptap/starter-kit @tiptap/extensions
```

Os cinco são peers **opcionais**: quem não importa `@rivocode/ui/editor` não
instala nenhum, e o resto da biblioteca não os alcança (`check:chart` guarda a
fronteira, como faz com a Recharts).

```tsx
import { Field, FieldLabel, FieldDescription } from '@rivocode/ui'
import { RichTextEditor } from '@rivocode/ui/editor'

const [descricao, setDescricao] = useState('')

<Field>
  <FieldLabel>Descrição do serviço</FieldLabel>
  <RichTextEditor
    value={descricao}
    onValueChange={setDescricao}
    placeholder="O que foi feito, e para quem"
    maxLength={2000}
  />
  <FieldDescription>Sai no corpo da nota, abaixo dos itens.</FieldDescription>
</Field>
```

## O valor

`value` e `defaultValue` são HTML, e `onValueChange` devolve o documento
inteiro em HTML a cada mudança. **O editor em branco entrega string vazia**, e
não `<p></p>`: é o que deixa `z.string().min(1)` recusar o campo vazio sem
regra especial.

Trocar o `value` por fora substitui o documento sem disparar
`onValueChange`, então o campo controlado não entra em laço.

`onJsonChange` entrega o mesmo documento no formato JSON do Tiptap. Guarde o
JSON quando o texto for exibido no celular ou precisar ser lido por máquina; o
`RichTextView` lê os dois formatos.

Com `name`, o HTML viaja num `input` escondido, e o campo entra no envio de um
`<form>` comum.

## Barra de ferramentas e atalhos

A barra é uma `Toolbar`: **uma parada de Tab só**, e as setas andam entre os
botões. Cada botão de estado é um `Toggle` com `aria-pressed`, agrupado num
`ToggleGroup` com nome ("Estilo do texto", "Títulos", "Listas", "Blocos"), e
cada um diz o próprio atalho em `aria-keyshortcuts` e na dica que abre ao
pousar ou focar.

Em tela estreita a barra quebra **por grupo**, e nunca no meio de um: desfazer,
refazer e limpar formatação descem juntos, e o separador entre grupos some
quando o grupo seguinte abre a linha.

| Ação | Atalho |
|---|---|
| Negrito, itálico, sublinhado | `Ctrl`+`B`, `Ctrl`+`I`, `Ctrl`+`U` |
| Tachado, código | `Ctrl`+`Shift`+`S`, `Ctrl`+`E` |
| Título, subtítulo | `Ctrl`+`Alt`+`2`, `Ctrl`+`Alt`+`3` |
| Lista com marcadores, numerada | `Ctrl`+`Shift`+`8`, `Ctrl`+`Shift`+`7` |
| Citação, bloco de código | `Ctrl`+`Shift`+`B`, `Ctrl`+`Alt`+`C` |
| Link | `Ctrl`+`K` |
| Desfazer, refazer | `Ctrl`+`Z`, `Ctrl`+`Shift`+`Z` |
| Limpar formatação | `Ctrl`+`\` |

No Mac, `Ctrl` é `⌘`. Título e subtítulo saem como `h2` e `h3`: o `h1` é da
página em volta, e um campo de formulário não disputa o esboço dela. HTML
colado com `h1` ou `h4` vira parágrafo.

## Link

`Ctrl`+`K` ou o botão abre um painel com o endereço. O que se digita sem
protocolo ganha o que falta: `rivocode.com.br` vira `https://rivocode.com.br`,
e `nf@rivocode.com.br` vira `mailto:`. **Só passam `http`, `https`, `mailto`,
`tel` e endereço relativo**; `javascript:` é recusado com a explicação no
próprio campo. Com o cursor dentro de um link, o botão fica pressionado, com
`aria-pressed="true"`, e o painel traz "Remover link".

O painel é um formulário próprio, e o envio dele não envia o formulário em
volta do editor.

## Colar

Colar do Word, do Google Docs ou de uma página não traz cor, fonte, tamanho,
classe nem imagem: o documento só aceita o que a barra sabe fazer, e o resto
cai no caminho. O negrito de verdade fica; o negrito falso que o Google Docs
põe em volta de tudo, não.

## Limite

`maxLength` conta **caracteres de texto**, e não o HTML: `<strong>Nota</strong>`
conta 4. O contador aparece no rodapé, é lido pelo leitor de tela como "120 de
2000 caracteres" ao entrar no campo, e passa ao tom de perigo no teto, com o
aviso "Limite de 2000 caracteres atingido." numa região educada. A digitação e
a colagem que passariam do teto são recusadas.

Conteúdo salvo maior que o teto abre inteiro, e só aceita apagar: cortar o
texto de alguém ao abrir é perda de dado silenciosa.

## No formulário

Dentro de `Field`, o `FieldLabel` nomeia o texto, o `FieldDescription` e o
`FieldError` o descrevem, e o `invalid` do `Field` pinta a moldura e anuncia
`aria-invalid`. Com o `@rivocode/ui/form`, o adaptador é o `forValue`, mais o
`onBlur` para o campo contar como tocado:

```tsx
import { Form, FormField, forValue, useZodForm } from '@rivocode/ui/form'
import { RichTextEditor } from '@rivocode/ui/editor'
import { z } from 'zod'

const schema = z.object({
  descricao: z.string().min(1, 'Descreva o serviço.'),
})

function ServiceForm() {
  const form = useZodForm(schema, { defaultValues: { descricao: '' } })

  return (
    <Form form={form} onSubmit={salvar}>
      <FormField name="descricao" label="Descrição do serviço">
        {(field) => <RichTextEditor {...forValue(field)} onBlur={field.onBlur} maxLength={2000} />}
      </FormField>
      <Button type="submit">Salvar</Button>
    </Form>
  )
}
```

O `defaultValues` com string vazia não é detalhe: sem ele o `value` chega
`undefined` no primeiro desenho, e o editor começa não controlado.

Fora de `Field`, dê o nome com `aria-label` e pinte o erro com `invalid`.

## Estados

- **`readOnly`**: a barra some, o texto continua selecionável e copiável, e o
  campo anuncia `aria-readonly`.
- **`disabled`**: barra e texto travados, no tom apagado, com `aria-disabled`.
  Dentro de um `Field` desabilitado, trava sozinho.
- **`invalid`**: moldura de perigo e `aria-invalid`.
- **Carregando no servidor**: o editor não monta no servidor
  (`immediatelyRender: false`), e no lugar dele sai o conteúdo já formatado,
  pelo `RichTextView`. A página renderizada no servidor mostra o texto no
  primeiro desenho, e ele vira editável quando o JavaScript chega.

## O que chega ao servidor

O HTML sai de um editor que só escreve o que a barra sabe fazer, e o
`RichTextView` só exibe isso. Mas o servidor recebe o que o navegador mandar,
e **quem chama a sua API não é obrigado a usar o editor**. Se o HTML salvo for
exibido por outro caminho (e-mail, PDF, `dangerouslySetInnerHTML`), passe-o
por um sanitizador no servidor, como o `sanitize-html` ou o DOMPurify, com a
mesma lista de tags. O `RichTextView` não precisa disso: ele não usa
`innerHTML`.

## Nomes

Os nomes da barra, do painel e do contador saem em português, e `labels` troca
os que vierem, um por um:

```tsx
<RichTextEditor
  aria-label="Description"
  labels={{
    toolbar: 'Formatting',
    bold: 'Bold',
    count: (count, max) => `${count} of ${max} characters`,
  }}
/>
```

## Partes

`classNames` alcança `toolbar`, `content` (a área editável), `footer` e `count`.
A altura mínima é de três controles; para rolar por dentro, dê o teto pela
parte: `classNames={{ content: 'max-h-96 overflow-y-auto' }}`.

## Quando não usar

- **Observação, motivo, comentário curto** é `Textarea`. Texto sem negrito nem
  lista não precisa de barra de ferramentas, e o `Textarea` guarda texto puro,
  que qualquer sistema lê. O `RichTextEditor` guarda HTML.
- **Mensagem para um assistente** é `PromptInput`: Enter envia. No
  `RichTextEditor`, Enter abre parágrafo novo.
- **Mostrar o que foi salvo** é `RichTextView`. Um `RichTextEditor` com
  `readOnly` carrega o Tiptap inteiro para exibir texto parado.

## No React Native

Não porta, por decisão, e não é fila: a pergunta que faltaria decidir não é de gesto, é de motor.

**O editor do web não atravessa.** Ele é o Tiptap sobre o ProseMirror, que vive do `contenteditable` do navegador, e o React Native não tem `contenteditable`. As duas saídas são outro produto: um `WebView` com o mesmo editor dentro, que traz o `react-native-webview` como peer de módulo nativo, teclado e seleção que não são os do sistema, e texto que o leitor de tela lê pelo caminho da página e não pelo do app; ou uma biblioteca de texto rico nativa, que não lê nem escreve o mesmo documento. Nenhuma das duas é a mesma peça com outra API.

**E a barra é superfície de mesa.** Ela é uma `Toolbar`, que também não porta: uma parada de tabulação com seta entre os botões, sobre uma seleção feita com o ponteiro. No toque, formatar um trecho é selecionar com o dedo que cobre o trecho, e quinze botões não cabem acima do teclado.

**No celular, a resposta é dividir o trabalho.** O que se escreve no telefone é texto curto, e o campo é o `Textarea`. O que foi escrito formatado no web se lê com o `RichTextView`, que porta sem peer e lê o mesmo HTML e o mesmo JSON.
