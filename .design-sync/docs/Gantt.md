---
category: Dados
---

# Gantt

O cronograma de projeto: tarefas com começo e fim numa linha do tempo, com a
tabela ao lado, as dependências em seta e a edição por arrasto e por teclado.

A pergunta que ele responde é de encadeamento: **o que precisa acabar antes de
quê, e o que atrasa se esta tarefa escorregar**. A tabela da esquerda é a lista
que se lê; a linha do tempo da direita é a mesma lista posta em escala, onde a
duração vira largura e a dependência vira seta.

```tsx
const [tasks, setTasks] = useState(projeto)

<Gantt
  label="Implantação do ERP"
  tasks={tasks}
  defaultScale="week"
  onTaskChange={(task, change) =>
    setTasks((atual) =>
      atual.map((item) =>
        item.id === task.id ? { ...item, start: change.start, end: change.end } : item,
      ),
    )
  }
/>
```

Uma tarefa é um objeto pequeno, e o vocabulário de cor é o fechado da casa:

```ts
type GanttTask = {
  id: string
  title: string
  start: Date
  end: Date
  progress?: number
  dependsOn?: string[]
  group?: string
  assignee?: string
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
}
```

## O fim é exclusivo, e o marco é a tarefa sem duração

`end` é o **instante em que a tarefa acaba**, e não o último dia dela. Uma
tarefa de 12 a 18 de outubro termina em 19/10 à meia-noite, e é assim que a
barra ocupa os sete dias inteiros. A coluna "Fim" e o leitor de tela mostram o
último dia coberto, 18/10, porque é o que a pessoa diz em voz alta.

A escolha tem um motivo só, e é o marco: **marco é a tarefa com `end` igual a
`start`**, duração zero, desenhada como losango. Com o fim inclusivo, uma tarefa
de um dia e um marco seriam o mesmo objeto. Quem guarda o último dia no banco
soma um dia antes de entregar.

`end` com hora vale: uma tarefa que acaba às 12h do dia 18 desenha meia coluna
nesse dia e continua sendo "12 a 18 de outubro".

## As três escalas

| Escala | Um dia vale | O cabeçalho | A seta anda |
|---|---|---|---|
| `day` | 40px | mês em cima, dia com a inicial da semana embaixo; fim de semana pintado | um dia |
| `week` | 18px | mês em cima, a segunda-feira de cada semana embaixo | uma semana |
| `month` | 5px | ano em cima, mês embaixo | um mês, pelo começo; o fim vem junto e a duração em dias não muda |

Na escala por mês a seta desloca o começo, e o fim é recalculado com a mesma
duração em dias. O começo no dia 31 cai no último dia de um mês mais curto, e a
tarefa de um dia em 30 de janeiro continua tendo um dia em fevereiro: ela não vira
marco nem perde dia pelo caminho.

O período desenhado sai das tarefas, com folga de uma unidade de cada lado;
`range` o fixa. A linha vermelha é hoje (`today`, ou o relógio do aparelho), e
a moldura abre rolada até ela. O botão "Hoje" da barra volta para lá.

**A linha de hoje passa por baixo do texto.** O rótulo do dia no cabeçalho e o
rótulo de cada barra têm fundo, então a linha, a grade e as setas somem atrás
das letras em vez de riscá-las. A barra que tem sucessora afasta o rótulo mais
8px, para a seta que sai do fim dela descer no vão e não no começo do nome. E
o rótulo do mês ou do ano, quando a coluna começa antes da área visível, fica
preso junto à tabela e encurta com reticências até o que sobrou da coluna,
em vez de sumir pela metade atrás dela.

## Editar: controlado, e nunca sozinho

A edição só existe com `onTaskChange`. Sem ele a grade é só leitura, e se diz
assim (`aria-readonly`). Com ele:

- **arrastar a barra** move a tarefa inteira, dia a dia;
- **arrastar uma borda** muda o começo ou o fim, com piso de um dia;
- **as setas**, na célula da linha do tempo, movem uma unidade da escala;
- **Shift com as setas** muda a duração, pela ponta do fim.

`onTaskChange(task, { start, end, kind })` recebe a tarefa como ela estava e
as datas novas; `kind` é `move` ou `resize`. **A peça não muda nada sozinha**:
a barra só anda quando `tasks` voltar mudado. Durante o arrasto ela desenha a
prévia, e ao soltar chama o callback uma vez. Quem precisa recusar (uma tarefa
travada, uma data fora do contrato) simplesmente não aplica.

**O anúncio segue o que foi aplicado, e não o que foi pedido.** Depois de cada
mudança uma região viva diz a tarefa e o intervalo novo, "Instalar servidor: 13
a 19 de outubro", e ela lê do `tasks` que voltou. Se quem controla recusar, o
leitor de tela não ouve uma data que não existe.

**No toque não se arrasta.** Com o dedo, a moldura rola; a barra só se arrasta
com mouse ou caneta. Arrastar uma barra de 18px numa linha do tempo que também
rola de lado é o conflito de gesto que o `EventCalendar` já decidiu não
comprar, e a resposta é a mesma. No celular a edição é pelo formulário que o
app abre em `onTaskSelect`, ou pelo teclado de quem tem um.

## Dependências

`dependsOn` lista os `id` que precisam acabar antes. Cada um vira uma seta do
fim da anterior ao começo desta, e a seta contorna por baixo quando a sucessora
começa antes. **Dependência desrespeitada vira seta tracejada**, no vermelho de
texto, e a célula dela diz "depende de Comprar hardware, e começa antes de ela
terminar". O tracejado existe para a informação não depender de cor.

As setas não rodam nenhum cálculo de caminho crítico e não empurram ninguém: a
peça mostra o encadeamento, e remarcar o projeto é regra do app.

## Grupos, e centenas de tarefas

Tarefas com o mesmo `group` ficam sob uma linha que recolhe, na ordem em que o
primeiro membro aparece. A linha do grupo mostra a contagem e um traço do
começo do primeiro ao fim do último. Recolher é por clique no nome, por
`Enter`, ou pelas setas, como em qualquer árvore; `collapsedGroups` e
`onCollapsedGroupsChange` controlam de fora.

As linhas são virtualizadas: quinhentas tarefas desenham só as que cabem na
moldura, e a grade continua dizendo `aria-rowcount` com o total real. As setas
são um SVG só, calculado pela posição da linha, e não pelo DOM, então a seta
para uma tarefa fora da tela continua certa quando ela aparece.

## A tabela da esquerda, e a divisória

As colunas vêm de `columns`, na ordem pedida: as quatro da casa pelo nome
(`title`, `start`, `end`, `assignee`) e colunas próprias com `cell`. O título
sempre entra, e é sempre o primeiro. Sem `columns`, entram título, início e
fim, e o responsável só entra quando alguma tarefa tem `assignee`.

**A divisória entre a tabela e a linha do tempo não é o `Splitter` nem o
`ResizablePanelGroup`, e é de propósito.** Os dois dividem a tela em painéis que
rolam cada um por si, e aqui as duas metades são a mesma linha: com duas
rolagens, a linha 212 da tabela e a linha 212 do cronograma se desencontram a
cada pixel de barra de rolagem horizontal, e a virtualização teria de ser
feita duas vezes e sincronizada. A peça tem uma rolagem só, com a tabela presa
à esquerda, e a divisória mede a largura dela com o mesmo contrato das irmãs:
`role="separator"`, setas de 16 em 16 pixels, `Home` e `End` nos extremos.

## No celular

A 390px sobra só o título, em 160px, e a linha do tempo rola de lado **dentro
da própria moldura**: a página não rola de lado nunca. A divisória sai, porque
não há o que dividir, e a linha ganha os 44px de alvo de toque.

**Nos 160px o título quebra em até duas linhas**, que cabem nos 44px da linha,
e só então corta. O nome inteiro fica no `title` do cabeçalho da linha, no
celular e na mesa, e é também o que o leitor de tela anuncia.

## Acessibilidade

A peça é uma grade de verdade, e o motivo é que ela **é** uma tabela: uma linha
por tarefa, com colunas que têm nome. É `treegrid` quando há grupo (a linha do
grupo tem `aria-expanded`, e as tarefas dele têm `aria-level="2"`, posição e
tamanho do conjunto) e `grid` quando não há. O título é o cabeçalho da linha, e
a célula da linha do tempo fala o que o desenho mostra: "12 a 18 de outubro,
40% concluído, depende de Comprar hardware". A alternativa em tabela não é uma
segunda tela: é a coluna da esquerda, que já está lá para quem enxerga.

O andaime (rótulos de dia, linhas de grade, a linha de hoje e as setas) sai
`aria-hidden`. A seta é dita na célula de quem depende, e não na de quem é
dependido, porque é ali que "começa antes de ela terminar" faz sentido.

**Uma parada de tabulação para a grade inteira**, com foco itinerante entre
células, e a célula focada nunca sai do DOM, mesmo virtualizada.

| Tecla | O que faz |
|---|---|
| `↑` `↓` | linha de cima e de baixo, na mesma coluna |
| `←` `→` na tabela | célula anterior e seguinte |
| `←` `→` na linha do tempo | move a tarefa uma unidade da escala, se `onTaskChange` existe; senão, volta para a tabela |
| `Shift` `←` `→` na linha do tempo | encurta e alonga pela ponta do fim; marco não tem duração e não muda |
| `←` `→` no grupo | recolhe e abre; aberto, `→` vai para a linha do tempo dele |
| `←` no título de uma tarefa do grupo | sobe para a linha do grupo |
| `Home` `End` | primeira e última célula da linha: `Home` é a saída da linha do tempo |
| `Ctrl` `Home` `End` | primeira e última linha |
| `PageUp` `PageDown` | uma moldura para cima ou para baixo |
| `Enter` `Espaço` | abre e recolhe o grupo, ou dispara `onTaskSelect` |
| `Esc` | cancela o arrasto em andamento |

`←` e `→` seguem a direção da escrita: em RTL, `←` leva a tarefa para depois. A
instrução de edição chega pelo `aria-describedby` da célula, e diz a unidade da
escala atual: "Setas movem uma semana, Shift com setas muda a duração, Home
volta ao título".

## Os quatro finais

Os mesmos do `DataTable`, da `VirtualList` e do `EventCalendar`, na mesma ordem
e com os mesmos nomes: **erro vence carregando, e vazio só vale depois que a
consulta voltou**. `isLoading` e `tasks === undefined` são a mesma coisa, e o
carregando desenha linhas de esqueleto sem fingir cabeçalho de período nenhum.
Sem `empty`, a lista vazia desenha a grade só com o cabeçalho, e a moldura vira
parada de tabulação.

## Partes

`classNames` veste cada parte sem ninguém alcançar o nó interno por `[&>div>div]`:

- **`toolbar`**: a barra com "Hoje" e o seletor de escala.
- **`frame`**: a moldura que rola.
- **`header`**: a faixa de cabeçalho, presa ao topo.
- **`row`**: cada linha, de tarefa ou de grupo.
- **`cell`**: cada célula da tabela.
- **`timeline`**: a célula da linha do tempo de cada linha.
- **`bar`**: a barra de uma tarefa com duração.
- **`milestone`**: o losango do marco.
- **`handle`**: a divisória entre a tabela e a linha do tempo.

## O que ele não faz

1. **Não busca dado nem salva.** Entra `tasks`, sai `onTaskChange`.
2. **Não calcula caminho crítico nem reprograma.** Mover uma tarefa não empurra
   as sucessoras; a seta tracejada mostra o conflito, e o app decide.
3. **Não cria tarefa nem liga dependência pelo desenho.** Arrastar de uma barra
   para outra para criar seta é aplicação, e não peça.
4. **Não conhece feriado nem dia útil.** O fim de semana é pintado na escala de
   dia e é só isso: a duração continua em dias corridos.
5. **Não conhece fuso**, pelo mesmo motivo do `EventCalendar`: tudo é `Date`,
   na hora local.

## Quando não usar

**Se o que importa é a hora do dia, use `EventCalendar`.** Compromisso de
quinze minutos, choque de horário numa terça, agenda de consultório: a grade de
tempo dele mostra hora e sobreposição, e a do `Gantt` começa no dia. O `Gantt`
responde "o que vem antes de quê"; o `EventCalendar` responde "o que bate com
o quê".

**Se os eventos já aconteceram, use `Timeline`.** Ela olha para trás, sobre um
objeto só, e os eventos dela são instantes. O `Gantt` olha para frente, sobre
um projeto, e as tarefas dele têm duração e dependência. Trilha de auditoria de
uma nota fiscal desenhada em Gantt é uma fileira de marcos sem seta nenhuma.

**Se ninguém precisa ver duração nem encadeamento, use `Table`, ou o
`DataTable` quando vier de consulta.** Uma lista de tarefas com prazo,
responsável e situação, ordenada e filtrada, é uma tabela, e a tabela faz isso
melhor e em qualquer largura. O `Gantt` só se paga quando a resposta é
geométrica: "essa tarefa é longa demais", "essa começa antes da outra acabar".

**Se são passos de um fluxo que a pessoa percorre, use `Steps`.** Etapas de
um cadastro não têm data nem duração.

## No React Native

Não porta, e é decisão, pela mesma conta que tirou o `EventCalendar` do celular. O `Gantt` existe para mostrar duração e encadeamento lado a lado: a tabela à esquerda, a escala à direita e a seta entre as duas. A 358px a tabela fica com o título e mais nada, e a escala de semana mostra onze dias por tela; a seta de dependência liga barras que quase nunca estão na mesma tela ao mesmo tempo. O que sobra é uma lista com retângulos coloridos, e a lista sozinha diz isso melhor.

**A edição é o que fecha a conta.** O web já não arrasta com o dedo, porque a barra de 18px disputa o gesto com a rolagem de lado da própria moldura, e é o mesmo conflito que a `week` do `EventCalendar` não resolveu. Um `Gantt` nativo sem arrastar seria uma tabela cara; com arrastar, seria um gesto que a casa já mediu e recusou.

**No telefone, a resposta é outra peça.** A tarefa do dia é lista, montada com `Item` ou `DataList`, com início, fim e responsável escritos; prazo com valor é o `Calendar`, que pinta por dia pelo `DayPaint`; e o andamento de uma tarefa é o `Progress`. Remarcar é o formulário com `DatePicker`, que é o que o dedo faz bem.
