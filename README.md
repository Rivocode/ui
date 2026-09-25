# @rivocode/ui

O design system da RivoCode. Componentes acessíveis sobre a Base UI, estilo
autoral em Tailwind v4, e tokens white-label: nenhum componente sabe qual é a
cor da marca, ele pergunta ao tema.

Isso é o que permite a mesma biblioteca vestir a RivoCode num projeto e o
cliente X em outro, sem editar componente nenhum.

## Instalação

```bash
npm install @rivocode/ui lucide-react   # ou pnpm add, yarn add, bun add
```

Público no npm, sob licença MIT. Não precisa de token nem de `.npmrc`.

O `lucide-react` vai na mesma linha porque os componentes importam ícone direto
dele. O npm resolve esse par sozinho; o pnpm e o yarn não, e sem ele a
`Sidebar`, a `Pagination` e o `DatePicker` quebram em tempo de execução.

O Tailwind entra como dependência de desenvolvimento:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

React 19, React DOM 19 e Tailwind 4 são dependências de par, ou seja, quem manda
na versão é o projeto consumidor.

## Ligar o Tailwind no build

Instalar o plugin não basta, ele precisa entrar na lista. Sem isso o build passa
sem erro e gera um CSS sem uma única classe da biblioteca:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

## As duas linhas de CSS

No arquivo de CSS do projeto:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";

@source '../node_modules/@rivocode/ui/dist';
```

A linha `@source` não é opcional e é a que mais quebra. Sem ela, o Tailwind do
projeto não varre os componentes da biblioteca, não gera as classes que eles
usam, e tudo aparece **sem estilo nenhum**, silenciosamente. Ajuste o caminho
relativo conforme a pasta do seu arquivo de CSS.

O `preset` traz os tokens, os dois temas e as fontes da marca. Se o projeto já
tem tipografia própria, importe apenas os arquivos de token e escreva o seu
tema, como descrito em "Tema de cliente".

## O Provider

```tsx
import { RivoProvider, Button } from "@rivocode/ui";

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <Button>Acao primaria</Button>
    </RivoProvider>
  );
}
```

| Prop      | Valores                                     | Para que serve                                                     |
| --------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `theme`   | `rivocode-dark`, `rivocode-light`, `system` | `system` segue a preferência do sistema operacional                |
| `density` | `comfortable`, `compact`                    | `compact` encolhe a altura de todo controle, para tela de operação |
| `scope`   | `global`, `local`                           | `global` veste a página inteira. `local` veste só esta árvore      |
| `dir`     | `ltr`, `rtl`                                | em `rtl` a Base UI espelha o que depende de lado                   |

Use `scope="local"` quando o design system entra num projeto que já existe e não
pode vazar estilo para o resto da página. Nesse modo o Provider também cria um
container próprio para diálogo, menu e dica, que renderizam fora da árvore e
sairiam sem tema se ficassem soltos no fim do documento.

## Vocabulário para o seu layout

O preset expõe os tokens como utilitários do Tailwind, então o layout que você
escreve fala a mesma língua dos componentes:

| Família       | Utilitários                                                                              |
| ------------- | ---------------------------------------------------------------------------------------- |
| Superfícies   | `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-overlay`                                 |
| Texto         | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled`                         |
| Acento        | `bg-accent`, `text-accent-fg`, `text-accent-text`, `bg-accent-subtle`                    |
| Linhas e foco | `border-border`, `border-border-strong`, `ring-ring`                                     |
| Estados       | `bg-success`, `text-success-text`, `bg-danger-subtle`, e o mesmo para `warning` e `info` |
| Forma         | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill`                   |
| Tipografia    | `text-xs` a `text-3xl`, `font-sans`, `font-display`, `font-mono`                         |

**Preenchimento e texto são tokens diferentes de propósito.** `bg-danger` é o
vermelho que preenche um botão e recebe `text-danger-fg` por cima.
`text-danger-text` é o vermelho que se lê sobre o fundo da página. Nenhuma cor
serve bem para as duas coisas: a que tem contraste como texto não aguenta texto
branco por cima, e vice-versa. Vale o mesmo para o acento.

## O catálogo

134 peças. **A tabela abaixo não é o índice**: ela cobre as mais usadas e diz a
diferença entre as que se parecem, que é a parte que costuma faltar. O índice
completo, sempre em dia, fica em <https://ds.rivocode.com.br/llms.txt>.

### Tipografia

| Peça      | Para que serve                                                                    |
| --------- | --------------------------------------------------------------------------------- |
| `Heading` | título de `h1` a `h6`, com o tamanho separado do nível                            |
| `Text`    | parágrafo ou trecho nos tons de texto do tema; sem `size` e `tone`, herda da frase |
| `Link`    | âncora sublinhada, `external` com aviso a quem ouve, e o router pelo `render`     |
| `Highlight` | pinta o termo buscado dentro do texto, sem acento importar: "sao" acha "São"    |

### Ação

| Peça                    | Para que serve                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| `Button`                | cinco variantes, quatro tamanhos, forma em pílula                    |
| `IconButton`            | botão só com ícone: `label` obrigatório vira o nome, dica opcional   |
| `Toggle`, `ToggleGroup` | botão que fica apertado: alinhamento, modo de exibição, filtro       |
| `Toolbar`               | junta os controles numa parada de tabulação só, com setas entre eles |
| `ActionBar`             | ações em lote sobre a seleção: diz quantos, limpa, gruda no pé da área |
| `ScrollToTop`           | "Voltar ao topo" que aparece depois de descer e devolve o foco ao `main` |

### Campo

| Peça                            | Para que serve                                                             |
| ------------------------------- | -------------------------------------------------------------------------- |
| `Field`, `Input`                | campo com rótulo, ajuda e erro ligados por acessibilidade                  |
| `Textarea`                      | várias linhas; altura em número de linhas, sem variante de tamanho         |
| `MaskedInput`                   | CPF, CNPJ, CEP, telefone, data, hora, placa, cartão, boleto, molde à mão   |
| `CurrencyInput`                 | dinheiro em centavos inteiros, digitado da direita, com sinal e limite     |
| `SignaturePad`                  | assinatura com dedo, caneta ou mouse, ou o nome digitado; exporta SVG e PNG |
| `PostalCodeField`               | CEP que busca o endereço pela `lookup` que você escreve, e preenche o resto |
| `InputGroup`                    | encosta `R$`, `.com.br` ou botão no campo, sem borda dupla                 |
| `Checkbox`                      | caixa de marcar, com o estado misto do "selecionar todos"                  |
| `Radio`, `RadioGroup`           | escolha única quando as opções cabem na tela                               |
| `Questionnaire`                 | uma pergunta por vez, com progresso, pular, atalho de letra e envio: onboarding, pesquisa, o agente pedindo esclarecimento |
| `Switch`                        | liga e desliga **na hora**; o Checkbox só vale ao enviar o formulário      |
| `Select`                        | escolha única em lista curta e fixa                                        |
| `Combobox`                      | escolha em lista longa ou vinda do servidor, com busca e fichas            |
| `TreeSelect`, `Tree`            | escolha dentro de uma árvore; guarda a folha, nunca o pai                  |
| `TransferList`                  | duas listas, disponíveis e escolhidos, com busca, marcar vários e mover nos dois sentidos |
| `DatePicker`, `DateRangePicker` | data e período: digita ou escolhe, com rodapé Aplicar opcional             |
| `Calendar`                      | o mês cru, para quem quer o calendário na própria tela                     |
| `Rating`                        | nota em estrelas, com meia estrela e a média só leitura dita "4,5 de 5"   |
| `EventCalendar`                 | a agenda: o que acontece, quando e por quanto tempo. O `Calendar` escolhe uma data; este mostra compromisso no tempo |
| `Gantt`                         | o cronograma de projeto: tarefas em escala, dependência em seta, grupos que recolhem e edição por arrasto e teclado |

### Flutuante

| Peça          | Para que serve                                                         |
| ------------- | ---------------------------------------------------------------------- |
| `Dialog`      | janela modal; no celular encosta embaixo                               |
| `AlertDialog` | confirmação sem volta: não fecha com Esc nem com clique fora           |
| `Sheet`       | folha que desliza da borda, com gesto de arrastar; é o menu do celular |
| `Popover`     | painel ancorado de conteúdo livre                                      |
| `Tooltip`     | dica, para botão que só tem ícone                                      |
| `Menu`        | menu de ações, com grupos e item destrutivo                            |
| `Toast`       | aviso que passa, via `useToast()`                                      |
| `ImageViewer` | foto em tela cheia a partir das miniaturas, com zoom e setas           |
| `Tour`        | passeio guiado: escurece o resto, recorta o alvo e explica num balão   |

### Navegação

| Peça         | Para que serve                                                           |
| ------------ | ------------------------------------------------------------------------ |
| `AppShell`   | o esqueleto do app: cabeçalho fixo, `Sidebar`, `main`, link de pular     |
| `Sidebar`    | barra lateral que encolhe até a coluna de ícones e vira folha no celular |
| `Tabs`       | abas com risco deslizante; rolam de lado quando não cabem                |
| `Breadcrumb` | o caminho, que dobra o meio em reticência quando fica longo              |
| `Pagination` | páginas, com reticência; no celular vira "3 de 12" com as setas          |
| `Steps`      | a régua de um formulário em etapas, com `useWizard()`                    |
| `TableOfContents` | o índice "Nesta página": lê os títulos e marca a seção lida ao rolar |

### Dado

| Peça        | Para que serve                                                   |
| ----------- | ---------------------------------------------------------------- |
| `Table`     | tabela semântica, com seleção de linha                           |
| `DataTable` | tabela com os três estados de consulta: carregando, erro e vazio |
| `Item`      | a linha de lista: ícone, texto e ação                            |
| `Badge`     | selo de estado, seis tons                                        |
| `Avatar`    | foto de pessoa, com a inicial por trás                           |
| `Timeline`  | o que já aconteceu, em ordem, com quem e quando                  |
| `QRCode`    | o texto que a câmera do outro lê, em SVG escuro sobre claro em qualquer tema |
| `PixCode`   | a cobrança Pix: QR, valor, recebedor e o copia e cola que confere o CRC |

### Estado

| Peça         | Para que serve                                              |
| ------------ | ----------------------------------------------------------- |
| `Alert`      | aviso que fica, com o papel de leitor de tela certo por tom |
| `Banner`     | aviso de página, em faixa no topo: manutenção, fatura, teste |
| `CookieConsent` | aviso de cookies da LGPD: recusar com o mesmo peso de aceitar, e a escolha volta para você gravar |
| `Skeleton`   | marca de lugar enquanto o dado não chegou                   |
| `Spinner`    | espera sem fim previsto                                     |
| `Progress`   | espera com fim conhecido, que **anda para o fim e termina** |
| `Meter`      | capacidade em uso, que **sobe e desce**: cota, limite       |
| `EmptyState` | estado vazio, com descrição e saída obrigatórias            |
| `NotificationCenter` | o sininho com a contagem dita e a lista: ler, marcar, filtrar, carregar mais |

### IA

Em `@rivocode/ui/ai`, sem dependência nenhuma a instalar e sem SDK de IA: a
mensagem entra por prop, e o que a pessoa faz sai por evento.

| Peça           | Para que serve                                                                    |
| -------------- | --------------------------------------------------------------------------------- |
| `PromptInput`  | o campo da conversa: Enter envia, Shift+Enter quebra; o `Textarea` vai no formulário |
| `Message`      | um turno, alinhado por `role`, com copiar, tentar de novo e o "chegando"          |
| `Conversation` | a lista que gruda no fim enquanto o texto chega; a `Timeline` olha para trás      |
| `ToolCall`     | a chamada de ferramenta, com estado, entrada, saída e aprovar ou recusar          |
| `AILabel`      | o selo "IA" do conteúdo gerado, com explicação; estado de registro é `Badge`      |

### Arrastar e soltar

Em `@rivocode/ui/dnd`, atrás do `@dnd-kit/core` e do `@dnd-kit/sortable`, que só
quem importa este caminho instala. As duas são controladas, e as duas andam
pelo teclado com anúncio em português.

```sh
npm install @dnd-kit/core @dnd-kit/sortable
```

| Peça           | Para que serve                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- |
| `SortableList` | a ordem que só a pessoa sabe, arrastada pela alça; ordem por critério é `sortable` no `DataTable` |
| `Kanban`       | cartões que andam entre colunas de situação, com contagem e limite que avisa e não tranca   |

### Estrutura

`Card`, `Separator`, `RivoProvider`, mais:

| Peça          | Para que serve                                                         |
| ------------- | ---------------------------------------------------------------------- |
| `Accordion`   | seções que se fecham entre si                                          |
| `Collapsible` | um bloco só, sem moldura e sem coordenação entre irmãos                |
| `Spoiler`     | o começo do texto longo com "Ler mais", só quando estoura a altura     |
| `ScrollArea`  | barra de rolagem própria, para quando a do sistema atrapalha o desenho |
| `Stack`       | empilha numa direção, com o vão da escala que acompanha a densidade    |
| `Grid`        | colunas fixas ou quantas couberem por `minItemWidth`, sem media query  |
| `Container`   | largura máxima centralizada, com respiro lateral, em cinco passos      |
| `Carousel`    | slides de lado por scroll-snap; `Tabs` se compara, `Grid` se cabe tudo |
| `ResizablePanelGroup` | áreas com divisória que se arrasta: N painéis, aninhados, que recolhem e lembram o layout |
| `Affix`       | gruda na janela com o empilhamento da casa, e reserva o `scroll-padding` para o foco não parar atrás |

Três coisas que a biblioteca resolve por você e que costumam dar trabalho:

- **Portal com tema.** Diálogo, menu, seleção e dica renderizam fora da árvore.
  O Provider cria um container que carrega o tema, então eles nunca aparecem sem
  estilo, nem no modo escopado.
- **Fiação de aviso.** Provedor, portal e área de exibição já vivem no Provider.
  Você chama `useToast().add({...})` e pronto.
- **Identidade estável do `useToast()`.** O gerenciador da Base UI devolve objeto
  novo a cada renderização, e um `useEffect` que dependa dele entra em laço
  infinito. Aqui ele é estável.

## O que a biblioteca decide sozinha no celular

Todo componente é pensado em 390px antes do desktop, e algumas decisões estão
embutidas em vez de ficarem por sua conta:

- Painel flutuante não encosta na borda da tela.
- `Dialog` e `AlertDialog` encostam embaixo e ocupam a largura toda.
- `Calendar` mostra um mês só, mesmo quando você pede dois.
- `DatePicker` troca o painel ancorado por folha de baixo.
- `Sidebar` vira folha da esquerda.
- Dia do calendário tem 44px de alvo, contra 36 no desktop.
- `Pagination` troca os números pelas setas, `Breadcrumb` guarda as duas últimas
  migalhas, `Steps` vira uma linha de texto com barra de progresso.

O `useTelaEstreita()` está exportado, para as decisões que o seu layout também
precisa tomar em JS.

## Formulários

Zod e React Hook Form vivem no subcaminho `@rivocode/ui/form`, com dependências
de par **opcionais**: quem não usa formulário não carrega nada disso.

```sh
npm install react-hook-form zod @hookform/resolvers
```

```tsx
import { Input, DatePicker, Button } from "@rivocode/ui";
import { Form, FormField, useZodForm, paraDatePicker } from "@rivocode/ui/form";
import { z } from "zod";

const schema = z.object({
  email: z.email("Escreva um email válido"),
  vencimento: z.date("Escolha a data"),
});

export function EmitirNota() {
  const form = useZodForm(schema, { defaultValues: { email: "" } });

  return (
    <Form form={form} onSubmit={(valores) => console.log(valores)}>
      <FormField name="email" label="E-mail" description="Para onde vai a nota">
        {(campo) => <Input {...campo} placeholder="voce@empresa.com" />}
      </FormField>

      <FormField name="vencimento" label="Vencimento">
        {(campo) => <DatePicker {...paraDatePicker(campo)} />}
      </FormField>

      <Button type="submit">Emitir</Button>
    </Form>
  );
}
```

O `FormField` não inventa `id` nenhum: quem liga o rótulo ao controle é o
`Field` da Base UI, pelo contexto. Por isso todo controle do catálogo passa pelo
`Field.Control` dela, o `DatePicker` inclusive.

O controle vem por função, e não por clonagem do filho, porque cada um recebe
valor de um jeito. Para `Input` e `Textarea`, espalhar o campo basta. Para os
outros, os adaptadores fazem a ponte: `paraDatePicker`, `paraSelect` e
`paraCheckbox`.

O `useZodForm` separa o tipo de entrada do de saída. Sem isso um
`z.coerce.number()` mente sobre o tipo do campo.

## Máscara

O molde usa `9` para dígito, `A` para letra e `*` para os dois. O resto é
literal, e a máscara põe sozinha.

```tsx
import { CurrencyInput, MaskedInput } from "@rivocode/ui";

<MaskedInput mask="cnpj" onValueChange={(comPontuacao, cru) => guardar(cru)} />
<MaskedInput mask="99-99/9999" />
<CurrencyInput value={centavos} onValueChange={setCentavos} />
```

**Guarde o valor cru**, não o pontuado: a pontuação muda com o tempo e o dado
deixa de bater. O dinheiro é o `CurrencyInput`, que entrega centavos inteiros,
para o servidor receber inteiro em vez de ponto flutuante; ele lê também o
valor colado como `R$ 1.234,56`.

Moldes prontos: `cpf`, `cnpj`, `cep`, `telefone`, `data`, `hora`, `placa`,
`cartao`, `boleto` e `moeda`. O telefone troca de molde entre o fixo e o celular
sozinho, e o boleto troca da linha de banco para a de convênio quando começa
com 8. `isValidBoletoLine` e `parseBoleto` conferem a linha e leem dela o banco,
o valor e o vencimento.

## Listagem com estados de consulta

O `DataTable` não conhece React Query, e isso é de propósito: entram três
booleanos, e funciona igual com `fetch` na mão, com SWR ou com server component.

```tsx
<DataTable
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  rowKey={(nota) => nota.id}
  columns={[
    { key: "numero", header: "Número" },
    { key: "cliente", header: "Cliente" },
    { key: "valor", header: "Valor", align: "right", hideOnMobile: true },
  ]}
  empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
/>
```

Erro vence carregando, e vazio só vale depois que a consulta voltou. Sem essa
ordem, uma nova busca sobre um erro pisca "nenhum resultado" antes de mostrar o
problema.

## Texto com formatação

O editor vive no subcaminho `@rivocode/ui/editor`, sobre o Tiptap 3, com
dependências de par opcionais: quem não escreve texto formatado não carrega o
ProseMirror.

```sh
npm install @tiptap/react @tiptap/pm @tiptap/core @tiptap/starter-kit @tiptap/extensions
```

```tsx
import { Field, FieldLabel } from "@rivocode/ui";
import { RichTextEditor, RichTextView } from "@rivocode/ui/editor";

<Field>
  <FieldLabel>Descrição do serviço</FieldLabel>
  <RichTextEditor value={html} onValueChange={setHtml} maxLength={2000} />
</Field>

<RichTextView value={nota.descricao} empty="Sem descrição." />
```

O valor é HTML, e o editor em branco entrega string vazia. O `RichTextView`
exibe o que foi salvo sem `innerHTML` e sem carregar o Tiptap.

## Gráficos

Recharts vive no subcaminho `@rivocode/ui/chart`, com dependência de par
opcional: quem não faz gráfico não carrega os 200 kB dela.

```sh
npm install recharts
```

As peças da Recharts que a biblioteca veste saem pelo mesmo import: sem isso
você teria a moldura e nada para pôr dentro, e teria que acertar a versão da
Recharts na mão. `Tooltip` e `Legend` dela ficam de fora de propósito: os nossos
já embrulham os dois, e o nome colidiria com o `Tooltip` do catálogo.

```tsx
import {
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  useChartMotion,
  XAxis,
  YAxis,
  type ChartConfig,
} from "@rivocode/ui/chart";

const config = {
  emitidas: { label: "Emitidas" },
  pagas: { label: "Pagas" },
} satisfies ChartConfig;

export function NotasPorMes({ dados }) {
  const movimento = useChartMotion();

  return (
    <ChartContainer config={config} className="h-64">
      <LineChart data={dados}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent config={config} />} />
        <Line dataKey="emitidas" stroke="var(--color-emitidas)" {...movimento} />
        <Line dataKey="pagas" stroke="var(--color-pagas)" {...movimento} />
      </LineChart>
    </ChartContainer>
  );
}
```

Três coisas que o `ChartContainer` resolve:

- **A cor da série vira variável com o nome da série.** `emitidas` no `config`
  publica `var(--color-emitidas)`, então a linha, a barra e a dica falam do
  mesmo jeito, e trocar a cor é mexer num lugar só. Sem cor declarada, entra a
  próxima da paleta na ordem do `config`. A Recharts não lê classe do Tailwind:
  a ponte tem que ser por variável de CSS.
- **Eixo, grade e rastro vêm do tema.** A Recharts pinta esses três com cor
  própria, e no tema escuro eles somem.
- **A dica é substituída inteira.** A da Recharts sai com fundo branco escrito
  em estilo embutido, e não há classe que corrija estilo embutido.

A paleta são oito cores por tema (`--rc-chart-1` a `--rc-chart-8`), e elas
passam pela guarda de contraste com um mínimo próprio: **3:1 contra a
superfície**, que é a regra de objeto gráfico. Cor de série não carrega texto, e
exigir 4,5:1 dela deixaria a paleta inteira escura demais para distinguir.

O `useChartMotion()` liga a animação à preferência do sistema. O resto do
catálogo resolve isso por token, mas a Recharts interpola em JS e nenhum token a
alcança: sem ele, o único movimento que sobra numa tela com "reduzir
movimento" ligado é justamente o maior deles.

A altura fica com você, por classe: gráfico sem altura definida some, porque o
contêiner mede o pai.

Além da moldura, o subcaminho traz seis gráficos prontos. Os quatro últimos são
desenho próprio, sem Recharts, e não entram no `ChartContainer`: carregando,
erro e vazio vêm do `QueryBoundary` em volta.

| Peça           | Para que serve                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- |
| `ChartDonut`   | partes de um todo, até seis, com o total no buraco e a lista de fatias embaixo              |
| `ChartRadial`  | uma medida contra a meta: quanto falta para chegar, e subir é sempre melhor                 |
| `ChartGauge`   | uma medida que é julgada por faixas com nome (em dia, atenção, crítico), e subir pode ser pior |
| `ChartHeatmap` | o padrão numa grade de linha por coluna, como emissões por dia e hora; célula vazia não é zero |
| `ChartFunnel`  | etapas em que cada uma é parte da anterior, com a taxa de conversão escrita entre elas        |
| `ChartTreemap` | área proporcional acima de seis categorias, onde a rosca para de informar                    |

## Tela de aplicação

```tsx
<SidebarProvider defaultOpen>
  <Sidebar>
    <SidebarHeader>RivoCode</SidebarHeader>
    <SidebarContent>
      <SidebarGroup label="Operação">
        <SidebarMenu>
          <SidebarMenuItem href="/painel" icon={<LayoutDashboard size={16} />} active>
            Painel
          </SidebarMenuItem>
          <SidebarMenuItem href="/notas" icon={<FileText size={16} />} badge={<Badge>4</Badge>}>
            Notas fiscais
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>

  <SidebarInset>
    <header>
      <SidebarTrigger />
    </header>
  </SidebarInset>
</SidebarProvider>
```

Fechada quer dizer coisas diferentes em cada largura: na mesa, encolhida até a
coluna de ícones, com o nome de cada item virando dica; no celular, fora da
tela, e a barra vira a folha da esquerda. O atalho é Ctrl+B, ou Cmd+B no Mac.

## Tema de cliente

Copie `src/tokens/themes/rivocode-light.css`, troque os valores, e rode a
guarda:

```sh
bun run check:contrast
```

Ela mede todos os pares que carregam texto e falha se algum ficar abaixo de
4,5 para 1, ou de 7 para 1 no texto principal. Ela existe para transformar
"acho que está legível" em número.

### `rivocode-ui check-theme`, no seu projeto

A guarda acima roda **aqui dentro**. O tema que você escreve roda **aí**, e
nenhuma guarda desta pasta o alcança. Para o seu lado da fronteira existe um
comando, e ele viaja no pacote:

```sh
npx rivocode-ui check-theme src/tema-acme.css
npx rivocode-ui check-theme src/temas/*.css --json   # a mesma coisa, para o CI
npx rivocode-ui check-theme acme.theme.ts            # o mapa do React Native
```

Ele lê os arquivos que você passar, junta as declarações por seletor de tema, e
cobra os 55 papéis obrigatórios. Sai com código 1 se faltar algum, então uma
linha no seu pipeline segura a quebra antes do deploy.

**E então mede o contraste, com a mesma conta e a mesma tabela de pares da
guarda acima.** É por isso que ela existe nesta seção duas vezes: a matemática
mora em um módulo do pacote, e não em `scripts/`, então o seu tema é medido pelo
código que mede o nosso — 76 pares por tema, com o alfa composto sobre o fundo
em que ele é desenhado antes de medir. Enquanto essa conta ficou fora do pacote,
quem quis medir o próprio tema escreveu 220 linhas no app: os nomes de papel, os
pares, os mínimos e a composição de alfa. A cópia envelheceu calada, com um
`compose` que não enxergava duas das três sintaxes de alfa e devolvia `NaN`.

A ordem das duas perguntas não é detalhe: papel faltando primeiro, porque medir
o contraste de um papel que não existe cai no valor herdado e devolve um número
bonito por acidente. Se falta papel, o comando para ali e não mede.

**A extensão diz qual forma de tema você escreveu.** `.css` é a camada 3 do web.
`.ts`, `.mjs` e `.js` é o mapa com `light` e `dark` que o `RivoProvider` do
`@rivocode/ui-native` recebe — o arquivo que `bun run gen:native --tema`
escreve. São dois formatos do mesmo tema, e um comando só para os dois: dois
CLIs divergiriam na primeira correção que só um deles recebesse. Quem prefere
medir por código importa `checkThemeMap` de `@rivocode/ui-native/contrast`.

**A mensagem diz o que acontece na tela, e não só qual token falta.** Faltar
`--rc-font-sans` não é erro de compilação: o `tsc` passa, o Vite passa, e a
página inteira renderiza na fonte do navegador. Foi assim que a mudança da
0.7.0, que levou `--rc-font-*` da camada global para dentro do seletor de tema,
chegou calada em quem tinha tema escrito para a 0.6.x. O comando separa as
faltas em duas listas, quebra calada e quebra visível, e avisa quando o papel
que falta **nasceu numa versão nova** - que é o momento em que dá para
consertar, no upgrade, e não meses depois.

Os três papéis de acabamento (`--rc-accent-image`, `--rc-accent-shadow` e
`--rc-overlay-filter`) são os únicos opcionais e não entram na conta. Os tokens
de forma também não: eles têm valor de `:root` por baixo.

## Desenvolvimento

```sh
bun install
bun run check   # lint, tipos, guarda de cor, guarda de contraste, testes
bun run shot    # gera a vitrine em demo/dist/, de mesa e de celular
bun run serve   # abre a vitrine em http://127.0.0.1:4173
```

### `bun link` duplica o React

Ao desenvolver com `bun link`, o projeto consumidor puxa o React de dentro
desta pasta em vez do dele, e a página quebra com
`Cannot read properties of null (reading 'useState')`. Não é defeito do pacote:
o pacote publicado não carrega React dentro. É o link.

No `vite.config.ts` do projeto consumidor:

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"] },
});
```

## Notas

- A Base UI é o pacote `@base-ui/react`. O nome antigo,
  `@base-ui-components/react`, parou num candidato a lançamento e não deve ser
  usado.
- A publicação é manual e disparada por tag, nunca automática em push. Biblioteca
  que publica sozinha publica engano.
- O retrato de celular sai de dentro de um iframe, em `demo/celular.html`, e não
  do tamanho da janela: o Chrome no macOS não abre janela abaixo de 500px, e
  pedir 390 devolvia uma foto cortada em 390 **com layout de 500**.

## Documentação

<https://ds.rivocode.com.br>

Cada peça tem também o endereço cru em markdown, para quem lê com agent em vez
de olho: `https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md`. O índice
fica em `/llms.txt`, e há uma skill pronta em `/skill`.

## Licença

MIT. Veja [LICENSE](LICENSE).
