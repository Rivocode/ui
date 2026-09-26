# Escolher a peça certa

## Conteúdo

- Escolhas que costumam sair erradas
- Toda consulta tem quatro finais

O catálogo tem 134 peças. O índice de todas fica em
<https://ds.rivocode.com.br/llms.txt>, e cada uma tem o próprio documento em
`https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md`, com a importação,
exemplos que rodam e a tabela de props.

## Escolhas que costumam sair erradas

| Situação | Peça certa | Por quê |
|---|---|---|
| Aviso que fica na tela | `Alert` | O `Toast` passa, e quem estava olhando para outro canto perde |
| Aviso da página inteira: manutenção, fatura em atraso, modo de teste | `Banner` | Faixa de largura total no topo da área; o `Alert` mora junto do trecho de que fala |
| Passeio guiado pela tela no primeiro acesso, um elemento de cada vez | `Tour` | Escurece o resto, recorta o alvo e prende o foco no balão; vira folha de baixo no celular. Dica de um elemento só é `Tooltip` ou `Popover`, e novidade que não para a pessoa é `Banner` |
| Botão só com ícone | `IconButton` | O `label` é obrigatório e vira o nome; `tooltip` mostra a dica sem repetir o nome |
| Aviso de cookies da LGPD | `CookieConsent` | Recusar tem o mesmo peso de aceitar, não prende a página e Esc não dispensa; a escolha volta por `onDecision` e quem grava é o app. Nunca `AlertDialog`: parede de cookies não é consentimento livre |
| Confirmação destrutiva | `AlertDialog` | Ele exige resposta; o `Dialog` deixa fechar clicando fora |
| Escolha entre poucas opções fixas | `Select` | O `Combobox` pede digitação sem precisar |
| Lista longa, ou vinda do servidor | `Combobox` | Não cabe na cabeça de quem escolhe |
| Liga agora, sem confirmar | `Switch` | O `Checkbox` só vale quando o formulário for enviado |
| Perguntas uma por vez: onboarding, pesquisa, triagem, o agente pedindo esclarecimento | `Questionnaire` | Valida antes de avançar e só a opcional se pula; se as perguntas cabem numa tela é `Form`, e etapa com vários campos é `Steps` com `useWizard` |
| Quais colunas a listagem mostra | `MenuCheckboxItem` | Dentro do `Menu`: traz `aria-checked` e a navegação de menu, que `Popover` com `Checkbox` dentro não tem |
| Ordenar por, dentro do menu | `MenuRadioGroup` + `MenuRadioItem` | Uma ordem de cada vez; passe `closeOnClick` para o menu fechar ao escolher |
| Lista de opções com famílias de verdade | `SelectGroup` + `SelectGroupLabel` | Se agrupar é para domar lista grande demais, o remédio é o `Combobox`, que busca |
| Marcar uma opção entre várias | `ToggleGroup` | Guarda estado e diz isso no aria |
| Ações irmãs encostadas | `ButtonGroup` | Não guarda estado; são ações, não escolha |
| Fazer a mesma coisa com várias linhas marcadas | `ActionBar` | Entra com a seleção do `DataTable`, diz quantos e limpa; a ação de uma linha só fica no `Menu` da linha |
| Montar um conjunto a partir de uma lista longa, vendo o que ficou de fora | `TransferList` | Duas listas com busca e mover nos dois sentidos; lista curta é `CheckboxGroup`, e escolher sem ver o resto é `Combobox` com `multiple` |
| Mostrar por que o resultado da busca apareceu | `Highlight` | Pinta o termo sem acento importar; filtre com `matchesSearch`, que é a mesma regra |
| Texto longo que a pessoa pode querer ler ali mesmo | `Spoiler` | Corta por altura e só mostra o "Ler mais" quando estoura; bloco fechado com título próprio é `Collapsible` |
| Ir a qualquer lugar pelo teclado | `Command` | Paleta em Ctrl+K, busca sem acento e por `keywords` |
| Mostrar um atalho no texto | `Kbd` | `mod` sai `⌘` no Mac e `Ctrl` no resto |
| Título de seção menor sem pular nível | `Heading` com `size` | `level` decide a tag de `h1` a `h6`; `size` muda só o desenho, e a ordem dos títulos fica inteira |
| Texto secundário, legenda ou frase num tom de estado | `Text` com `tone` | Só os papéis de texto do tema; sem `size` e `tone`, herda da frase em volta |
| Ir para outra página ou outro site | `Link` | Navega; o `Button` age. `external` abre em outra aba e avisa quem ouve, e o router entra pelo `render` |
| Nome de arquivo, comando ou chave de JSON no texto | `Code` | O `Kbd` promete "aperte isto"; este é para ler ou copiar |
| Retorno de API, log ou configuração em bloco | `CodeBlock` | Rola sozinho, e `copyable` põe o copiar no canto |
| Levar um dado para outro sistema | `Clipboard` | A confirmação é parte da peça: o nome acessível do botão muda |
| Cobrar por Pix: QR, valor e copia e cola | `PixCode` | Recebe o copia e cola pronto e confere o CRC; monte o estático com `buildPixPayload` |
| Um link ou código que a câmera de outro aparelho lê | `QRCode` | SVG sempre escuro sobre claro, em qualquer tema, numa placa com a margem de 4 módulos; `label` obrigatório, e `logo` só com `level="H"` |
| "há 2 minutos" em log, fila ou notificação | `RelativeTime` | Sai num `<time>`, com a data exata no `title` e corte configurável |
| O que já aconteceu com uma coisa, em ordem | `Timeline` | Olha para trás, com carimbo e autor; o `Steps` olha para a frente |
| Cronograma de projeto: o que vem antes de quê, e por quantos dias | `Gantt` | Tabela à esquerda, escala à direita e seta de dependência; edição controlada por `onTaskChange`. Hora do dia e choque de horário é `EventCalendar` |
| O sino do cabeçalho com a lista de notificações | `NotificationCenter` | Conta as não lidas no nome do botão, abre popover na mesa e folha no celular, e não busca nada: marcar, filtrar e carregar mais saem por callback |
| Contagem por cima do sino, da aba, do menu | `Indicator` | Posiciona sozinho, e a contagem é dita e não só vista |
| Fila de pessoas sobrepostas | `AvatarGroup` | Corta para uma letra e conta o excedente em "+n" |
| Vários cartões ou fotos que a pessoa percorre de lado | `Carousel` | Rola por scroll-snap, com botões e teclado; o que se compara é `Tabs`, e o que cabe na tela é `Grid` |
| Foto que a pessoa precisa ampliar: imóvel, vistoria, comprovante | `ImageViewer` | Tela cheia sobre o `Dialog`, com zoom, setas e `alt` obrigatório; imagem que só enfeita o card é `AspectRatio` |
| Nota em estrelas, ou a média que os outros deram | `Rating` | `radiogroup` com uma opção por estrela e setas; `readOnly` vira uma imagem só, "4,3 de 5". Número exato é `NumberField`, faixa contínua é `Slider` |
| Assinatura na tela: aceite, recebimento, vistoria | `SignaturePad` | Dedo, caneta ou mouse, com o nome digitado em cursiva para quem não desenha; exporta SVG e PNG com tinta escura nos dois temas. "Li e aceito" sem rubrica é `Checkbox` |
| Valor em dinheiro | `CurrencyInput` | Entra e sai em centavos inteiros, digita da direita e lê o colado; quantidade com passo é `NumberField` |
| CPF | `MaskedInput` | `mask="cpf"`, e o número se confere com `isValidCpf` no schema, ao sair do campo. Guarde o cru, o segundo argumento do `onValueChange`: só os 11 dígitos |
| CNPJ, inclusive o alfanumérico | `MaskedInput` | `mask="cnpj"` aceita letra nas doze primeiras casas e põe em maiúscula; confere com `isValidCnpj`. Guarde o cru |
| CPF ou CNPJ no mesmo campo | `ToggleGroup` e `MaskedInput` | Nenhum molde alterna sozinho entre os dois: a pessoa escolhe "Pessoa física" ou "Pessoa jurídica" antes, e o `mask` troca junto com o validador |
| Telefone, fixo ou celular | `MaskedInput` | `mask="telefone"` troca sozinho entre fixo e celular pela quantidade de dígitos, 10 ou 11; `autoComplete="tel-national"`. Guarde os dígitos, e a chave Pix pede `+55` na frente |
| CEP que preenche o endereço | `PostalCodeField` | Máscara e busca: completa os 8 dígitos, chama o seu `lookup` e entrega `onAddress`. CEP solto, sem endereço, é `MaskedInput` com `mask="cep"` |
| Data: vencimento, nascimento, agendamento | `DatePicker` | Digita ou escolhe no calendário, com `min`, `max` e `disabledDays`; nascimento leva `max` em hoje. `mask="data"` num campo de texto perde o calendário e a validação da data |
| Hora do dia | `TimeField` | Entra e sai como `HH:mm`, com `min`, `max` e `step`; `mask="hora"` não confere se a hora existe |
| Número do cartão | `MaskedInput` | `mask="cartao"` e `autoComplete="cc-number"`. A biblioteca não confere o cartão: quem aprova é o adquirente |
| Placa de veículo, antiga ou Mercosul | `MaskedInput` | `mask="placa"`; a forma se confere com `isValidPlate` |
| Linha digitável de boleto | `MaskedInput` | `mask="boleto"` troca sozinho para a de convênio quando começa com 8; `isValidBoletoLine` confere e `parseBoleto` lê valor e vencimento |
| Código de verificação que chega por SMS, de uso único | `OTPField` | Uma casa por dígito, cola o código inteiro e `autoComplete="one-time-code"` deixa o celular preencher sozinho |
| E-mail do cliente, de contato ou de login | `Input` | `type="email"` e `autoComplete="email"`, sem máscara; o formato se confere no schema com `z.string().email()` |
| Campo de formulário para a chave Pix: a pessoa digita ou cadastra a chave para receber ou transferir | `Input` | Sem máscara, porque a chave Pix pode ser CPF, CNPJ, e-mail, celular ou aleatória; `isValidPixKey` confere depois de tirar a pontuação. Mostrar a chave para alguém copiar é `Code` com `Clipboard`; cobrar com QR e copia e cola é `PixCode` |
| Quantidade, parcelas, porcentagem | `NumberField` | Número com passo e teclado numérico; dinheiro nunca entra aqui, é `CurrencyInput` |
| Senha, com o olho que revela | `PasswordInput` | O botão diz a ação e não o estado; sair do campo esconde de novo |
| Marcadores que a pessoa escreve | `TagsInput` | Enter fecha, Backspace tira a última, repetida não entra |
| Ocorrência por período, em faixa | `Tracker` | Responde "piorou ontem?"; cabe no rodapé de um `Stat` |
| Lista e detalhe lado a lado, com proporção ajustável | `Splitter` | Divisória é `separator` de verdade e anda pelas setas; empilha no celular |
| Três ou mais áreas ajustáveis, aninhadas, que recolhem ou guardam o layout | `ResizablePanelGroup` | Com `ResizablePanel` e `ResizableHandle`; o `Splitter` é a forma curta dele para duas áreas |
| Corrigir um valor sem sair da tela | `Editable` | Escape desfaz, sair do campo salva; fechado é um `button` |
| Escolher a cor de marca de um cliente | `ColorPicker` | Grade de amostras que anda por seta e diz qual está escolhida, mais o hexadecimal colado do manual |
| Segurar a altura antes da imagem | `AspectRatio` | Sem ela a linha pula quando a imagem carrega |
| Empilhar blocos com vão que acompanha a densidade | `Stack` | `gap` é escala (`xs` a `xl`), não pixel; `direction="row"` põe lado a lado |
| Cartões em colunas que se ajustam à tela | `Grid` | `minItemWidth` põe quantas couberem, sem media query; `columns` fixa o número |
| Largura de leitura da página, centralizada | `Container` | `size` de `sm` a `xl`, respiro lateral por token; só no web |
| Dividir a página em seções | `TabList` padrão | O risco embaixo diz "esta parte da página" |
| Ver a mesma coisa de outro jeito | `TabList variant="segmented"` | A caixinha não promete seção |
| Quanto de uma capacidade está em uso | `Meter` | O `Progress` anda para o fim e termina |
| Um número julgado por faixas (em dia, atenção, crítico) | `ChartGauge`, de `@rivocode/ui/chart` | O `ChartRadial` mede contra meta e não julga; o `Meter` cabe numa linha e só diz quanto |
| O padrão numa grade de linha por coluna | `ChartHeatmap` | Célula vazia não é zero; um estado por período, numa linha só, é o `Tracker` |
| Quantos passaram de cada etapa para a seguinte | `ChartFunnel` | A taxa sai escrita; onde a pessoa está num processo é o `Steps` |
| Proporção de muitas categorias | `ChartTreemap` | Até seis, o `ChartDonut` lê melhor; o rótulo que não cabe some |
| Número de painel com variação e tendência | `Stat` | O valor chega formatado; a `Sparkline` entra pelo slot `chart` |
| Folha de detalhes com rótulo e valor | `DescriptionList` + `DescriptionItem` | Sai como `<dl>` de verdade; o valor aceita `Badge` e `font-mono` |
| Campo de busca com lupa e atalho | `SearchInput` | `type="search"`, Esc limpa; `shortcut="mod+k"` só desenha o atalho |
| Anexar arquivo, com arrastar e soltar | `FileUpload` + `FileUploadList` | Valida `accept` e `maxSize` na entrada; subir é do app, o item mostra `progress` e `error` |
| O esqueleto de uma aplicação nova: cabeçalho, barra lateral, conteúdo | `AppShell` | Monta o `Sidebar` da casa, o cabeçalho fixo com o botão da barra, os landmarks e o link "Pular para o conteúdo"; o topo de cada rota continua sendo `PageHeader` |
| Topo de rota com trilha, título e ações | `PageHeader` | O título é `<h1>`; trilha e ações entram por slot |
| Índice "Nesta página" de um texto longo | `TableOfContents` | Lê os `h2`/`h3` (ou `items`), marca a seção lida com `aria-current` e leva o foco ao título no clique; `offset` desconta o cabeçalho fixo. Navegar entre rotas é `Sidebar` |
| "Voltar ao topo" numa página ou lista longa | `ScrollToTop` | Só existe depois de `threshold` pixels, sobe suave (salto com reduzir movimento) e leva o foco ao `<main>`; `target` para caixa que rola |
| Ação ou aviso que fica parado na janela enquanto a página rola | `Affix` | `position` por lado, empilhamento de `--rc-z-*`, e reserva o `scroll-padding` para o foco não parar atrás; o topo que gruda dentro da seção é `sticky` |
| Listagem com estados de consulta | `DataTable` | Recebe carregando, erro e vazio prontos |
| Listagem que ordena, busca, pagina ou seleciona | `DataTable` com `sortable`, `filter`, `pageSize`, `selectable` | Tudo opt-in e client-side; no servidor, entregue os dados prontos e não peça o recurso |
| Tabela montada à mão | `Table` e suas partes | Sai como `<table>` de verdade |
| Ordem que só a pessoa sabe: fila de emissão, prioridade, etapas | `SortableList`, de `@rivocode/ui/dnd` | Arrasta pela alça e pelo teclado, e anuncia cada posição; ordem por critério (valor, data) é `sortable` no `DataTable`. Peer opcional: `@dnd-kit/core` e `@dnd-kit/sortable` |
| Coisas que andam entre situações: a emitir, em análise, emitida | `Kanban`, de `@rivocode/ui/dnd` | Colunas com contagem e `limit`, cartão entre colunas pelo teclado; situação que só se lê cabe numa coluna de `Badge` do `DataTable`. No nativo não porta: lá é lista por coluna e `Menu` "Mover para" |
| Campo onde a pessoa escreve para um assistente | `PromptInput`, de `@rivocode/ui/ai` | Enter envia e Shift+Enter quebra; o `Textarea` vai junto com o formulário e não envia no Enter |
| A conversa com um assistente | `Conversation` + `Message` | Gruda no fim enquanto o texto chega e solta quando a pessoa rola; a `Timeline` olha para trás |
| Chamada de ferramenta, com aprovação | `ToolCall` | Estado com ícone e texto, e aprovar ou recusar fora do painel; o `Accordion` organiza texto, não acontecimento |
| Marcar conteúdo gerado por IA fora da conversa | `AILabel` | O leitor ouve por extenso e a explicação abre no toque; estado de registro continua `Badge` |
| Excluir, arquivar ou remover um item da lista quando dá para voltar atrás | `ToastViewport` | Faz na hora e o `useToast` oferece "Desfazer" pelo `actionProps`, com `timeout` maior que o padrão. Confirmar antes cobra de todo mundo para proteger o engano de poucos |
| Desfazer a exclusão, o arquivamento ou a última ação | `ToastViewport` | O desfazer mora no aviso que confirma a ação: `actionProps` com `children: "Desfazer"` e o `onClick` que restaura e fecha o aviso |
| Excluir de vez, cancelar nota, emitir: o que não tem volta | `AlertDialog` | Só aqui a confirmação se paga; o título nomeia o objeto e o botão diz o efeito. Item pequeno e local é `Popconfirm` |
| Editar um campo direto na tabela, na lista ou no detalhe, sem abrir formulário | `Editable` | Clica, edita, Enter salva e Esc desfaz; a linha inteira com vários campos é `Sheet` ao lado da lista |
| Mostrar opções avançadas só quando a pessoa pedir | `Collapsible` | Esconde o que poucos usam sem tirar do formulário; várias seções que se abrem uma de cada vez são `Accordion` |
| Cadastro com muitos campos que não dependem uns dos outros | `Fieldset` | Um formulário só, em seções com título, e não wizard: quebrar em passos só esconde o tamanho. Passos só quando uma etapa depende da anterior |
| Fluxo em etapas em que a escolha de uma muda a seguinte, com revisão no fim | `Steps` | `useWizard` valida cada passo antes de avançar e `WizardFooter` segura voltar e seguir; a última etapa é sempre revisão |
| Salvar o rascunho do formulário e recuperar ao voltar | `Form` | O rascunho volta preenchido depois de erro, de recarregar a página ou de fechar sem querer: guarde os valores com `useLocalStorage` enquanto a pessoa digita e limpe no envio |
| Busca global: achar qualquer tela, cliente ou nota de qualquer lugar do app | `Command` | Ctrl+K de qualquer lugar, com `keywords` para os sinônimos; o campo que filtra só a lista da tela é `SearchInput` |
| Tela vazia na primeira vez, sem nada cadastrado ainda | `EmptyState` | Diz o que vai aparecer ali e oferece criar o primeiro; vazio por filtro oferece limpar o filtro, e não criar |
| Abrir o detalhe de um item por cima da tela, sem sair dela e sem perder o contexto de trás | `Sheet` | Folha lateral mantém o contexto; lista e detalhe sempre lado a lado é `Splitter`, `Dialog` é para uma decisão curta, e página nova é para tarefa que ocupa a tela |

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
