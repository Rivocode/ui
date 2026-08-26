# Escolher a peça certa

## Conteúdo

- Escolhas que costumam sair erradas
- Toda consulta tem quatro finais

O catálogo tem 71 peças. O índice de todas fica em
<https://ds.rivocode.com.br/llms.txt>, e cada uma tem o próprio documento em
`https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md`, com a importação,
exemplos que rodam e a tabela de props.

## Escolhas que costumam sair erradas

| Situação | Peça certa | Por quê |
|---|---|---|
| Aviso que fica na tela | `Alert` | O `Toast` passa, e quem estava olhando para outro canto perde |
| Confirmação destrutiva | `AlertDialog` | Ele exige resposta; o `Dialog` deixa fechar clicando fora |
| Escolha entre poucas opções fixas | `Select` | O `Combobox` pede digitação sem precisar |
| Lista longa, ou vinda do servidor | `Combobox` | Não cabe na cabeça de quem escolhe |
| Liga agora, sem confirmar | `Switch` | O `Checkbox` só vale quando o formulário for enviado |
| Marcar uma opção entre várias | `ToggleGroup` | Guarda estado e diz isso no aria |
| Ações irmãs encostadas | `ButtonGroup` | Não guarda estado; são ações, não escolha |
| Ir a qualquer lugar pelo teclado | `Command` | Paleta em Ctrl+K, busca sem acento e por `keywords` |
| Mostrar um atalho no texto | `Kbd` | `mod` sai `⌘` no Mac e `Ctrl` no resto |
| Nome de arquivo, comando ou chave de JSON no texto | `Code` | O `Kbd` promete "aperte isto"; este é para ler ou copiar |
| Retorno de API, log ou configuração em bloco | `CodeBlock` | Rola sozinho, e `copyable` põe o copiar no canto |
| Levar um dado para outro sistema | `Clipboard` | A confirmação é parte da peça: o nome acessível do botão muda |
| "há 2 minutos" em log, fila ou notificação | `RelativeTime` | Sai num `<time>`, com a data exata no `title` e corte configurável |
| Segurar a altura antes da imagem | `AspectRatio` | Sem ela a linha pula quando a imagem carrega |
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
