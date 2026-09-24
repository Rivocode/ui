# Escolher a peça certa

## Conteúdo

- Escolhas que costumam sair erradas
- Toda consulta tem quatro finais

O catálogo tem 106 peças. O índice de todas fica em
<https://ds.rivocode.com.br/llms.txt>, e cada uma tem o próprio documento em
`https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md`, com a importação,
exemplos que rodam e a tabela de props.

## Escolhas que costumam sair erradas

| Situação | Peça certa | Por quê |
|---|---|---|
| Aviso que fica na tela | `Alert` | O `Toast` passa, e quem estava olhando para outro canto perde |
| Aviso da página inteira: manutenção, fatura em atraso, modo de teste | `Banner` | Faixa de largura total no topo da área; o `Alert` mora junto do trecho de que fala |
| Botão só com ícone | `IconButton` | O `label` é obrigatório e vira o nome; `tooltip` mostra a dica sem repetir o nome |
| Confirmação destrutiva | `AlertDialog` | Ele exige resposta; o `Dialog` deixa fechar clicando fora |
| Escolha entre poucas opções fixas | `Select` | O `Combobox` pede digitação sem precisar |
| Lista longa, ou vinda do servidor | `Combobox` | Não cabe na cabeça de quem escolhe |
| Liga agora, sem confirmar | `Switch` | O `Checkbox` só vale quando o formulário for enviado |
| Quais colunas a listagem mostra | `MenuCheckboxItem` | Dentro do `Menu`: traz `aria-checked` e a navegação de menu, que `Popover` com `Checkbox` dentro não tem |
| Ordenar por, dentro do menu | `MenuRadioGroup` + `MenuRadioItem` | Uma ordem de cada vez; passe `closeOnClick` para o menu fechar ao escolher |
| Lista de opções com famílias de verdade | `SelectGroup` + `SelectGroupLabel` | Se agrupar é para domar lista grande demais, o remédio é o `Combobox`, que busca |
| Marcar uma opção entre várias | `ToggleGroup` | Guarda estado e diz isso no aria |
| Ações irmãs encostadas | `ButtonGroup` | Não guarda estado; são ações, não escolha |
| Ir a qualquer lugar pelo teclado | `Command` | Paleta em Ctrl+K, busca sem acento e por `keywords` |
| Mostrar um atalho no texto | `Kbd` | `mod` sai `⌘` no Mac e `Ctrl` no resto |
| Título de seção menor sem pular nível | `Heading` com `size` | `level` decide a tag de `h1` a `h6`; `size` muda só o desenho, e a ordem dos títulos fica inteira |
| Texto secundário, legenda ou frase num tom de estado | `Text` com `tone` | Só os papéis de texto do tema; sem `size` e `tone`, herda da frase em volta |
| Ir para outra página ou outro site | `Link` | Navega; o `Button` age. `external` abre em outra aba e avisa quem ouve, e o router entra pelo `render` |
| Nome de arquivo, comando ou chave de JSON no texto | `Code` | O `Kbd` promete "aperte isto"; este é para ler ou copiar |
| Retorno de API, log ou configuração em bloco | `CodeBlock` | Rola sozinho, e `copyable` põe o copiar no canto |
| Levar um dado para outro sistema | `Clipboard` | A confirmação é parte da peça: o nome acessível do botão muda |
| "há 2 minutos" em log, fila ou notificação | `RelativeTime` | Sai num `<time>`, com a data exata no `title` e corte configurável |
| O que já aconteceu com uma coisa, em ordem | `Timeline` | Olha para trás, com carimbo e autor; o `Steps` olha para a frente |
| Contagem por cima do sino, da aba, do menu | `Indicator` | Posiciona sozinho, e a contagem é dita e não só vista |
| Fila de pessoas sobrepostas | `AvatarGroup` | Corta para uma letra e conta o excedente em "+n" |
| Vários cartões ou fotos que a pessoa percorre de lado | `Carousel` | Rola por scroll-snap, com botões e teclado; o que se compara é `Tabs`, e o que cabe na tela é `Grid` |
| Foto que a pessoa precisa ampliar: imóvel, vistoria, comprovante | `ImageViewer` | Tela cheia sobre o `Dialog`, com zoom, setas e `alt` obrigatório; imagem que só enfeita o card é `AspectRatio` |
| Senha, com o olho que revela | `PasswordInput` | O botão diz a ação e não o estado; sair do campo esconde de novo |
| Marcadores que a pessoa escreve | `TagsInput` | Enter fecha, Backspace tira a última, repetida não entra |
| Ocorrência por período, em faixa | `Tracker` | Responde "piorou ontem?"; cabe no rodapé de um `Stat` |
| Lista e detalhe lado a lado, com proporção ajustável | `Splitter` | Divisória é `separator` de verdade e anda pelas setas; empilha no celular |
| Corrigir um valor sem sair da tela | `Editable` | Escape desfaz, sair do campo salva; fechado é um `button` |
| Escolher a cor de marca de um cliente | `ColorPicker` | Grade de amostras que anda por seta e diz qual está escolhida, mais o hexadecimal colado do manual |
| Segurar a altura antes da imagem | `AspectRatio` | Sem ela a linha pula quando a imagem carrega |
| Empilhar blocos com vão que acompanha a densidade | `Stack` | `gap` é escala (`xs` a `xl`), não pixel; `direction="row"` põe lado a lado |
| Cartões em colunas que se ajustam à tela | `Grid` | `minItemWidth` põe quantas couberem, sem media query; `columns` fixa o número |
| Largura de leitura da página, centralizada | `Container` | `size` de `sm` a `xl`, respiro lateral por token; só no web |
| Dividir a página em seções | `TabList` padrão | O risco embaixo diz "esta parte da página" |
| Ver a mesma coisa de outro jeito | `TabList variant="segmented"` | A caixinha não promete seção |
| Quanto de uma capacidade está em uso | `Meter` | O `Progress` anda para o fim e termina |
| Número de painel com variação e tendência | `Stat` | O valor chega formatado; a `Sparkline` entra pelo slot `chart` |
| Folha de detalhes com rótulo e valor | `DescriptionList` + `DescriptionItem` | Sai como `<dl>` de verdade; o valor aceita `Badge` e `font-mono` |
| Campo de busca com lupa e atalho | `SearchInput` | `type="search"`, Esc limpa; `shortcut="mod+k"` só desenha o atalho |
| Anexar arquivo, com arrastar e soltar | `FileUpload` + `FileUploadList` | Valida `accept` e `maxSize` na entrada; subir é do app, o item mostra `progress` e `error` |
| Topo de rota com trilha, título e ações | `PageHeader` | O título é `<h1>`; trilha e ações entram por slot |
| Listagem com estados de consulta | `DataTable` | Recebe carregando, erro e vazio prontos |
| Listagem que ordena, busca, pagina ou seleciona | `DataTable` com `sortable`, `filter`, `pageSize`, `selectable` | Tudo opt-in e client-side; no servidor, entregue os dados prontos e não peça o recurso |
| Tabela montada à mão | `Table` e suas partes | Sai como `<table>` de verdade |
| Campo onde a pessoa escreve para um assistente | `PromptInput`, de `@rivocode/ui/ai` | Enter envia e Shift+Enter quebra; o `Textarea` vai junto com o formulário e não envia no Enter |
| A conversa com um assistente | `Conversation` + `Message` | Gruda no fim enquanto o texto chega e solta quando a pessoa rola; a `Timeline` olha para trás |
| Chamada de ferramenta, com aprovação | `ToolCall` | Estado com ícone e texto, e aprovar ou recusar fora do painel; o `Accordion` organiza texto, não acontecimento |
| Marcar conteúdo gerado por IA fora da conversa | `AILabel` | O leitor ouve por extenso e a explicação abre no toque; estado de registro continua `Badge` |

## Toda consulta tem quatro finais

Carregando, deu certo, deu errado, veio vazia. O `DataTable` e o
`ChartContainer` recebem os quatro:

```tsx
<DataTable
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  rowKey={(invoice) => invoice.id}
  empty={{
    title: 'Nenhuma nota por aqui',
    description: 'Quando você emitir a primeira, ela aparece nesta lista.',
  }}
  columns={[
    { key: 'number', header: 'Número' },
    { key: 'customer', header: 'Cliente' },
    { key: 'amount', header: 'Valor', align: 'right' },
    { key: 'status', header: 'Situação', hideOnMobile: true },
  ]}
/>
```

A descrição do vazio é obrigatória de propósito: "nenhum resultado" transfere
para a pessoa o trabalho de descobrir por quê, e ela quase nunca descobre.
