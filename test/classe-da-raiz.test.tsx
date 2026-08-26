import { expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { CalendarPanel, Command } from "../src/index";
import * as pkg from "../src/index";
import * as chart from "../src/chart/index";
import * as form from "../src/form/index";

/*
 * "Toda peca aceita `className` na raiz, e a classe de quem usa vence a da
 * peca" e a primeira linha do contrato. Ate aqui quem conferia isso era o
 * `classnames.test.tsx`, peca a peca, escrito a mao - e lista escrita a mao so
 * cobre o que alguem lembrou de escrever. Foi assim que `ToastViewport` e
 * `SidebarMenuSkeleton` atravessaram versoes sem aceitar `className`, as duas
 * com pagina publicada dizendo que aceitam.
 *
 * Entao esta guarda nao tem lista de pecas: ela varre os exports dos tres
 * caminhos publicos e cobra de cada um. O que fica de fora esta nomeado
 * abaixo, com o motivo, e **cada excecao e ela propria conferida** - a lista
 * nao pode virar o esconderijo que ela deveria evitar.
 *
 * Sao duas camadas, porque sao dois defeitos diferentes:
 *
 * 1. O tipo nao tem `className`. E o defeito que as duas pecas tinham, e quem
 *    responde e o compilador, pelo `forwardsRoot` do catalogo de props.
 * 2. O tipo tem `className` e o codigo o descarta - basta desestruturar e
 *    esquecer de repassar. O compilador nao ve isso; so montar a peca ve.
 */

/** A marca que procuramos no DOM. Nada no catalogo usa uma classe assim. */
const MARK = "marca-da-raiz-xyz";

type CatalogPiece = {
  forwardsRoot: boolean;
  props: { name: string; required: boolean }[];
};

/*
 * O catalogo sai do compilador (`scripts/props-do-catalogo.ts`), e o
 * `check:props` ja garante que ele nao divergiu dos tipos. Ler daqui e ler o
 * tipo, sem montar um segundo leitor de TypeScript dentro do teste.
 */
const catalog: Record<string, CatalogPiece> = await Bun.file(
  "apps/docs/src/component-props.json",
).json();

/** Os tres caminhos publicos. O que nao sai por eles nao e peca de ninguem. */
const surface: Record<string, unknown> = { ...pkg, ...form, ...chart };

/**
 * Nem todo export de nome maiusculo e componente.
 *
 * Hook e utilitario ja caem fora pela inicial minuscula (`cn`, `useToast`,
 * `applyMask`, `buttonVariants`). O que sobra e nomeado aqui, um por um,
 * porque "parece um componente" e justamente o criterio que deixaria uma peca
 * de fora sem ninguem notar.
 */
const NOT_A_COMPONENT: Record<string, string> = {
  MASKS: "A tabela de mascaras que o MaskedInput e o applyMask leem. E dado, nao peca.",
};

/**
 * Pecas sem elemento proprio: nao ha raiz para vestir.
 *
 * Nao e lacuna. A raiz da Base UI e so estado e contexto, e a classe vai no
 * `*Content` correspondente, que a aceita. Aceitar `className` aqui criaria
 * uma prop que nao faz nada, e prop que mente e pior do que prop que falta.
 */
const NO_ROOT_ELEMENT: Record<string, string> = {
  AlertDialog: "Raiz de estado. A classe vai no AlertDialogContent.",
  Autocomplete: "Raiz de estado. A classe vai no AutocompleteInput.",
  Combobox: "Raiz de estado. A classe vai no ComboboxInput ou no ComboboxContent.",
  ComboboxValue: "Escreve o valor escolhido como texto, sem no proprio.",
  ContextMenu: "Raiz de estado. A classe vai no MenuContent.",
  Dialog: "Raiz de estado. A classe vai no DialogContent.",
  Menu: "Raiz de estado. A classe vai no MenuContent.",
  Popover: "Raiz de estado. A classe vai no PopoverContent.",
  PreviewCard: "Raiz de estado. A classe vai no PreviewCardContent.",
  Select: "Raiz de estado. A classe vai no SelectTrigger ou no SelectContent.",
  Sheet: "Raiz de estado. A classe vai no SheetContent.",
  Tooltip: "Raiz de estado. A classe vai no TooltipContent.",
  ChartAreaGradient: "Sai como <defs>: define gradiente e nao pinta caixa nenhuma.",
  ChartLegend: "A Legend da Recharts, que configura o grafico. O visivel e o ChartLegendContent.",
  ChartTooltip: "O Tooltip da Recharts, idem. O visivel e o ChartTooltipContent.",
  ZAxis: "Eixo da Recharts repassado inteiro: configura a escala, nao desenha caixa.",
};

/*
 * A guarda nasceu com duas lacunas nomeadas numa lista: `Command` e
 * `CalendarPanel` pintavam DOM proprio com tipo escrito a mao sem `className`,
 * e fecha-las era mexer em arquivo de outra rodada. As duas foram fechadas - a
 * paleta repassa a classe ao painel, e a casca do calendario a repassa a folha
 * ou ao painel, conforme o corte - e a lista saiu junto.
 *
 * Ela nao vira lista vazia esperando a proxima: enquanto existisse, seria o
 * unico lugar do arquivo onde caberia escrever "esta peca ainda nao" sem
 * precisar justificar por que a raiz dela nao existe.
 */

/**
 * Partes que a Base UI recusa a montar sem o pai, e o pai que falta.
 *
 * Elas existem para viver dentro de outra peca - `SelectItem` fora do
 * `Select`, `MenuContent` fora do `Menu` -, entao a segunda camada nao
 * consegue monta-las sozinhas. O `className` de cada uma continua conferido
 * pela primeira camada, que le o tipo. E um teste abaixo cobra que cada nome
 * daqui **de fato falhe** ao ser montado sozinho: entrada que passou a
 * renderizar perdeu o motivo de existir e volta para a varredura.
 */
const REQUIRES_PARENT: Record<string, string> = {
  AccordionItem: "Accordion",
  AlertDialogClose: "AlertDialog",
  AlertDialogContent: "AlertDialog",
  AlertDialogDescription: "AlertDialog",
  AlertDialogTitle: "AlertDialog",
  AlertDialogTrigger: "AlertDialog",
  AutocompleteInput: "Autocomplete",
  CollapsiblePanel: "Collapsible",
  CollapsibleTrigger: "Collapsible",
  ComboboxChip: "Combobox",
  ComboboxChips: "Combobox",
  ComboboxContent: "Combobox",
  ComboboxGroupLabel: "ComboboxGroup",
  ComboboxInput: "Combobox",
  ComboboxItem: "Combobox",
  ComboboxList: "Combobox",
  ContextMenuTrigger: "ContextMenu",
  DialogClose: "Dialog",
  DialogContent: "Dialog",
  DialogDescription: "Dialog",
  DialogTitle: "Dialog",
  DialogTrigger: "Dialog",
  FieldDescription: "Field",
  FieldError: "Field",
  FieldLabel: "Field",
  FieldsetLegend: "Fieldset",
  MenuContent: "Menu",
  MenuItem: "Menu",
  MenuTrigger: "Menu",
  MenubarTrigger: "Menubar",
  NavigationMenuContent: "NavigationMenu",
  NavigationMenuLink: "NavigationMenu",
  NavigationMenuList: "NavigationMenu",
  NavigationMenuTrigger: "NavigationMenu",
  NavigationMenuViewport: "NavigationMenu",
  PopoverClose: "Popover",
  PopoverContent: "Popover",
  PopoverDescription: "Popover",
  PopoverTitle: "Popover",
  PopoverTrigger: "Popover",
  PreviewCardContent: "PreviewCard",
  PreviewCardTrigger: "PreviewCard",
  SelectContent: "Select",
  SelectItem: "Select",
  SelectTrigger: "Select",
  SelectValue: "Select",
  SheetClose: "Sheet",
  SheetContent: "Sheet",
  SheetDescription: "Sheet",
  SheetTitle: "Sheet",
  SheetTrigger: "Sheet",
  Sidebar: "SidebarProvider",
  SidebarBrand: "SidebarProvider",
  SidebarFooter: "SidebarProvider",
  SidebarGroup: "SidebarProvider",
  SidebarInput: "SidebarProvider",
  SidebarMenuAction: "SidebarProvider",
  SidebarMenuItem: "SidebarProvider",
  SidebarMenuSkeleton: "SidebarProvider",
  SidebarRail: "SidebarProvider",
  SidebarTrigger: "SidebarProvider",
  TabList: "Tabs",
  ToolbarButton: "Toolbar",
  ToolbarGroup: "Toolbar",
  ToolbarSeparator: "Toolbar",
  TooltipContent: "Tooltip",
  TooltipTrigger: "Tooltip",
};

/**
 * Pecas de grafico que nao desenham nada fora de um grafico.
 *
 * A Recharts monta o eixo, a grade e a serie pelo `<ResponsiveContainer>`: o
 * elemento e um filho do SVG que ela desenha, e sozinho o componente devolve
 * `null` sem reclamar. `ChartLegendContent` e `ChartTooltipContent` caem no
 * mesmo lugar por outro motivo - sem `payload` nao ha o que desenhar.
 *
 * Tambem conferido abaixo: quem esta aqui precisa mesmo nao pintar nada. Uma
 * peca que pinta e perde a classe nao consegue se esconder nesta lista.
 */
const PAINTS_NOTHING_ALONE: Record<string, string> = {
  Bar: "Serie da Recharts.",
  CartesianGrid: "Grade da Recharts.",
  Cell: "Fatia de uma serie da Recharts.",
  ChartLegendContent: "Sem payload nao ha legenda para desenhar.",
  ChartTooltipContent: "Sem payload nao ha dica para desenhar.",
  ChartXAxis: "Eixo da Recharts, vestido pelo tema.",
  ChartYAxis: "Eixo da Recharts, vestido pelo tema.",
  LabelList: "Rotulo de serie da Recharts.",
  Line: "Serie da Recharts.",
  PolarAngleAxis: "Eixo polar da Recharts.",
  PolarGrid: "Grade polar da Recharts.",
  PolarRadiusAxis: "Eixo polar da Recharts.",
  Radar: "Serie da Recharts.",
  Rectangle: "Primitiva de desenho da Recharts.",
  ReferenceArea: "Marcacao da Recharts.",
  ReferenceLine: "Marcacao da Recharts.",
  Scatter: "Serie da Recharts.",
  XAxis: "Eixo da Recharts.",
  YAxis: "Eixo da Recharts.",
};

/**
 * O filho que a peca precisa para montar, quando `children` nao pode ser
 * qualquer coisa. `children` cai na linha do elemento raiz e o catalogo nao a
 * marca como obrigatoria, entao estes casos se declaram aqui.
 */
const SAMPLE_CHILD: Record<string, ReactNode> = {
  CodeBlock: "bun add @rivocode/ui",
};

/**
 * A prop sem a qual a peca nao pinta nada - e continuaria sem ser conferida.
 * O provider so desenha caixa no escopo local; no global ele veste a pagina
 * inteira e nao tem raiz propria para receber a classe.
 */
const SAMPLE_PROPS: Record<string, Record<string, unknown>> = {
  RivoProvider: { scope: "local" },
};

/**
 * O pai que o HTML exige. `<tbody>` dentro de `<div>` nao e DOM valido, e o
 * aviso do React sobre isso e verdadeiro: quem montou a peca no lugar errado
 * seria o teste, e nao a peca.
 */
const HTML_PARENT: Record<string, string[]> = {
  TableHeader: ["table"],
  TableBody: ["table"],
  TableRow: ["table", "tbody"],
  TableCell: ["table", "tbody", "tr"],
  TableHead: ["table", "thead", "tr"],
};

/** Todo export que e peca, dos tres caminhos, em ordem estavel. */
const pieces = Object.entries(surface)
  .filter(([name]) => /^[A-Z]/.test(name) && !NOT_A_COMPONENT[name])
  .filter(([, value]) => typeof value === "function" || typeof value === "object")
  .map(([name]) => name)
  .sort();

const excused = (name: string) => NO_ROOT_ELEMENT[name];

/**
 * Monta a peca sozinha, dentro de um no proprio.
 *
 * O `data-host` existe para separar o que a peca pintou do que o provider
 * pinta em volta - e assim "nao pintou nada" ser uma medida, e nao um palpite.
 */
function mount(name: string) {
  const node = createElement(
    surface[name] as never,
    { className: MARK, ...SAMPLE_PROPS[name] } as never,
    SAMPLE_CHILD[name],
  );
  // De dentro para fora: <table><tbody><tr>{peca}</tr></tbody></table>.
  const nested = (HTML_PARENT[name] ?? []).reduceRight<ReactNode>(
    (child, tag) => createElement(tag, null, child),
    node,
  );

  const { container } = render(
    <RivoProvider scope="local">
      <div data-host="">{nested}</div>
    </RivoProvider>,
  );

  const document_ = container.ownerDocument;

  return {
    wearsMark: Boolean(document_.querySelector(`.${MARK}`)),
    painted: document_.querySelector("[data-host]")!.querySelectorAll("*").length > 0,
  };
}

test("a varredura enxerga o pacote inteiro, e nao meia duzia de pecas", () => {
  // Se um refactor quebrar o import estrela ou a inicial maiuscula, os testes
  // abaixo passariam varrendo zero peca: verdes e cegos.
  expect(pieces.length).toBeGreaterThan(150);
  expect(pieces).toContain("Button");
  expect(pieces).toContain("ToastViewport");
  expect(pieces).toContain("SidebarMenuSkeleton");
  expect(pieces).toContain("ChartContainer");
});

test("todo export do pacote tem entrada no catalogo de props", () => {
  // Sem entrada, a peca escaparia da primeira camada em silencio.
  expect(pieces.filter((name) => !catalog[name])).toEqual([]);
});

test("o tipo de toda peca aceita className na raiz", () => {
  const missing = pieces.filter((name) => catalog[name] && !catalog[name]!.forwardsRoot && !excused(name));

  expect(missing).toEqual([]);
});

test("as excecoes nomeiam pecas que ainda existem", () => {
  // Excecao que sobrevive a peca que a justificava vira permissao solta: a
  // proxima peca a nascer com aquele nome ja vem dispensada da regra.
  const names = [
    ...Object.keys(NO_ROOT_ELEMENT),
    ...Object.keys(REQUIRES_PARENT),
    ...Object.keys(PAINTS_NOTHING_ALONE),
    ...Object.keys(NOT_A_COMPONENT),
    ...Object.keys(SAMPLE_CHILD),
    ...Object.keys(SAMPLE_PROPS),
    ...Object.keys(HTML_PARENT),
  ];

  expect(names.filter((name) => !(name in surface))).toEqual([]);
});

test("quem esta dispensado do className continua sem ele no tipo", () => {
  // O contrario do teste acima: a peca que ganhar `className` sai da lista, em
  // vez de a lista so crescer.
  const solved = Object.keys(NO_ROOT_ELEMENT).filter((name) => catalog[name]?.forwardsRoot);

  expect(solved).toEqual([]);
});

/*
 * A segunda camada monta. Fica de fora, e e o limite conhecido desta guarda,
 * a peca com prop obrigatoria: montar `DataTable` ou `Stat` exigiria um valor
 * plausivel por peca - uma lista de `Column<T>`, um `rowKey`, um `format` -, e
 * essa tabela de exemplos e a lista escrita a mao que a guarda veio substituir.
 * Todas continuam cobertas pela primeira camada, que le o tipo.
 */
const skipped = (name: string) =>
  Boolean(excused(name)) ||
  Boolean(REQUIRES_PARENT[name]) ||
  Boolean(PAINTS_NOTHING_ALONE[name]) ||
  Boolean(catalog[name]?.props.some((prop) => prop.required));

const mountable = pieces.filter((name) => !skipped(name));

test("a segunda camada monta a maior parte do catalogo, e nao um punhado", () => {
  expect(mountable.length).toBeGreaterThan(80);
});

test("toda peca montavel leva ao DOM o className de quem a chama", () => {
  const dropped: string[] = [];

  for (const name of mountable) {
    if (!mount(name).wearsMark) dropped.push(name);
    // O `cleanup` do setup roda entre testes, e a varredura inteira mora num
    // teste so: sem limpar aqui, a marca da peca anterior fica no documento e
    // a peca seguinte passa vestida com ela.
    cleanup();
  }

  expect(dropped).toEqual([]);
});

/*
 * O ponto cego que a segunda camada deixa, coberto a mao para as duas pecas
 * que acabaram de ganhar `className`.
 *
 * `Command` e `CalendarPanel` tem prop obrigatoria, entao a varredura nao as
 * monta - e o defeito que sobra depois de o tipo estar certo e justamente o
 * que so montar revela: desestruturar a prop e esquecer de repassa-la. As
 * duas nao pintam a raiz no lugar obvio (a paleta pinta dentro do portal, e a
 * casca do calendario troca de casca no corte do celular), que e por que elas
 * ficaram sem `className` por tantas versoes.
 */
test("a paleta de comandos leva a classe ao painel dentro do portal", () => {
  render(
    <RivoProvider scope="local">
      <Command open onOpenChange={() => {}} groups={[]} className={MARK} />
    </RivoProvider>,
  );

  expect(document.querySelector(`.${MARK}`)).not.toBeNull();
});

test("a casca do calendario leva a classe ao painel da mesa", () => {
  render(
    <RivoProvider scope="local">
      <CalendarPanel
        open
        onOpenChange={() => {}}
        trigger={<button type="button">Abrir</button>}
        title="Vencimento"
        className={MARK}
      >
        <p>Conteudo</p>
      </CalendarPanel>
    </RivoProvider>,
  );

  expect(document.querySelector(`.${MARK}`)).not.toBeNull();
});

test("quem esta na lista de parte de fato nao monta sozinha", () => {
  // O motivo da excecao, conferido. Sem isto a lista aceitaria qualquer nome
  // que alguem quisesse tirar da varredura - que e o `try/catch` que engole,
  // escrito de outro jeito.
  const mountedAnyway: string[] = [];

  for (const name of Object.keys(REQUIRES_PARENT)) {
    try {
      mount(name);
      mountedAnyway.push(name);
    } catch {
      // A recusa e o que esperamos: a peca cobra o contexto do pai.
    }
    cleanup();
  }

  expect(mountedAnyway).toEqual([]);
});

test("quem esta na lista de grafico de fato nao pinta nada sozinha", () => {
  // A peca que pinta e perde a classe nao consegue se esconder aqui: pintar e
  // exatamente o que esta lista nega.
  const painted: string[] = [];

  for (const name of Object.keys(PAINTS_NOTHING_ALONE)) {
    if (mount(name).painted) painted.push(name);
    cleanup();
  }

  expect(painted).toEqual([]);
});
