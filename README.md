# @rivocode/ui

O design system da RivoCode. Componentes acessíveis sobre a Base UI, estilo
autoral em Tailwind v4, e tokens white-label: nenhum componente sabe qual é a
cor da marca, ele pergunta ao tema.

Isso é o que permite a mesma biblioteca vestir a RivoCode num projeto e o
cliente X em outro, sem editar componente nenhum.

## Instalação

O pacote é privado, no GitHub Packages. Todo projeto consumidor precisa de um
`.npmrc` na raiz, com um token que tenha permissão de leitura de pacotes:

```
@rivocode:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Depois:

```sh
bun add @rivocode/ui
bun add -d tailwindcss @tailwindcss/vite
```

React 19, React DOM 19 e Tailwind 4 são dependências de par, ou seja, quem manda
na versão é o projeto consumidor.

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

Cinquenta e cinco peças. A tabela diz para que cada uma serve, e a diferença
entre as que se parecem — que é a parte que costuma faltar.

### Ação

| Peça                    | Para que serve                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| `Button`                | cinco variantes, quatro tamanhos, forma em pílula e botão de ícone   |
| `Toggle`, `ToggleGroup` | botão que fica apertado: alinhamento, modo de exibição, filtro       |
| `Toolbar`               | junta os controles numa parada de tabulação só, com setas entre eles |

### Campo

| Peça                            | Para que serve                                                             |
| ------------------------------- | -------------------------------------------------------------------------- |
| `Field`, `Input`                | campo com rótulo, ajuda e erro ligados por acessibilidade                  |
| `Textarea`                      | várias linhas; altura em número de linhas, sem variante de tamanho         |
| `MaskedInput`                   | CPF, CNPJ, CEP, telefone, data, hora, placa, cartão, dinheiro, molde à mão |
| `InputGroup`                    | encosta `R$`, `.com.br` ou botão no campo, sem borda dupla                 |
| `Checkbox`                      | caixa de marcar, com o estado misto do "selecionar todos"                  |
| `Radio`, `RadioGroup`           | escolha única quando as opções cabem na tela                               |
| `Switch`                        | liga e desliga **na hora**; o Checkbox só vale ao enviar o formulário      |
| `Select`                        | escolha única em lista curta e fixa                                        |
| `Combobox`                      | escolha em lista longa ou vinda do servidor, com busca e fichas            |
| `TreeSelect`, `Tree`            | escolha dentro de uma árvore; guarda a folha, nunca o pai                  |
| `DatePicker`, `DateRangePicker` | data e período: digita ou escolhe, com rodapé Aplicar opcional             |
| `Calendar`                      | o mês cru, para quem quer o calendário na própria tela                     |

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

### Navegação

| Peça         | Para que serve                                                           |
| ------------ | ------------------------------------------------------------------------ |
| `Sidebar`    | barra lateral que encolhe até a coluna de ícones e vira folha no celular |
| `Tabs`       | abas com risco deslizante; rolam de lado quando não cabem                |
| `Breadcrumb` | o caminho, que dobra o meio em reticência quando fica longo              |
| `Pagination` | páginas, com reticência; no celular vira "3 de 12" com as setas          |
| `Steps`      | a régua de um formulário em etapas, com `useWizard()`                    |

### Dado

| Peça        | Para que serve                                                   |
| ----------- | ---------------------------------------------------------------- |
| `Table`     | tabela semântica, com seleção de linha                           |
| `DataTable` | tabela com os três estados de consulta: carregando, erro e vazio |
| `Item`      | a linha de lista: ícone, texto e ação                            |
| `Badge`     | selo de estado, seis tons                                        |
| `Avatar`    | foto de pessoa, com a inicial por trás                           |

### Estado

| Peça         | Para que serve                                              |
| ------------ | ----------------------------------------------------------- |
| `Alert`      | aviso que fica, com o papel de leitor de tela certo por tom |
| `Skeleton`   | marca de lugar enquanto o dado não chegou                   |
| `Spinner`    | espera sem fim previsto                                     |
| `Progress`   | espera com fim conhecido, que **anda para o fim e termina** |
| `Meter`      | capacidade em uso, que **sobe e desce**: cota, limite       |
| `EmptyState` | estado vazio, com descrição e saída obrigatórias            |

### Estrutura

`Card`, `Separator`, `RivoProvider`, mais:

| Peça          | Para que serve                                                         |
| ------------- | ---------------------------------------------------------------------- |
| `Accordion`   | seções que se fecham entre si                                          |
| `Collapsible` | um bloco só, sem moldura e sem coordenação entre irmãos                |
| `ScrollArea`  | barra de rolagem própria, para quando a do sistema atrapalha o desenho |

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
bun add react-hook-form zod @hookform/resolvers
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
import { MaskedInput, aplicarMascara, emCentavos } from "@rivocode/ui";

<MaskedInput mask="cnpj" onValueChange={(comPontuacao, cru) => guardar(cru)} />
<MaskedInput mask="moeda" onValueChange={(texto) => guardar(emCentavos(texto))} />
<MaskedInput mask="99-99/9999" />
```

**Guarde o valor cru**, não o pontuado: a pontuação muda com o tempo e o dado
deixa de bater. O dinheiro sai em centavos, para o servidor receber inteiro em
vez de ponto flutuante.

Moldes prontos: `cpf`, `cnpj`, `cep`, `telefone`, `data`, `hora`, `placa`,
`cartao` e `moeda`. O telefone troca de molde entre o fixo e o celular sozinho.

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

## Gráficos

Recharts vive no subcaminho `@rivocode/ui/chart`, com dependência de par
opcional: quem não faz gráfico não carrega os 200 kB dela.

```sh
bun add recharts
```

As peças da Recharts que a biblioteca veste saem pelo mesmo import — sem isso
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
alcança — sem ele, o único movimento que sobra numa tela com "reduzir
movimento" ligado é justamente o maior deles.

A altura fica com você, por classe: gráfico sem altura definida some, porque o
contêiner mede o pai.

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

Ela mede quarenta pares que carregam texto e falha se algum ficar abaixo de
4,5 para 1, ou de 7 para 1 no texto principal. Ela existe para transformar
"acho que está legível" em número.

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
