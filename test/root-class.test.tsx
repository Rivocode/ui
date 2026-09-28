import { expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { CalendarPanel, Command } from "../src/index";
import * as pkg from "../src/index";
import * as chart from "../src/chart/index";
import * as form from "../src/form/index";
import * as ai from "../src/ai/index";
import * as dnd from "../src/dnd/index";
import * as editor from "../src/editor/index";

/*
 * "Every component accepts `className` on the root, and the consumer's class
 * beats the component's" is the first line of the contract. Until now what
 * checked it was `classnames.test.tsx`, component by component, written by hand -
 * and a hand-written list only covers what someone remembered to write. That is
 * how `ToastViewport` and `SidebarMenuSkeleton` went through versions without
 * accepting `className`, both with a published page saying they do.
 *
 * So this guard has no component list: it scans the exports of the three
 * public paths and checks each one. What is left out is named below, with the
 * reason, and **each exception is itself checked** - the list must not become
 * the hiding place it was supposed to prevent.
 *
 * There are two layers, because there are two different defects:
 *
 * 1. The type has no `className`. That is the defect both components had, and
 *    the compiler answers it, through the props catalog's `forwardsRoot`.
 * 2. The type has `className` and the code drops it - it is enough to
 *    destructure and forget to pass it on. The compiler does not see that; only
 *    mounting the component does.
 */

/** The mark we look for in the DOM. Nothing in the catalog uses a class like this. */
const MARK = "root-mark-xyz";

type CatalogPiece = {
  forwardsRoot: boolean;
  props: { name: string; required: boolean }[];
};

/*
 * The catalog comes from the compiler (`scripts/catalog-props.ts`), and
 * `check:props` already guarantees it has not diverged from the types. Reading
 * from here is reading the type, without building a second TypeScript reader
 * inside the test.
 */
const catalog: Record<string, CatalogPiece> = await Bun.file(
  "apps/docs/src/component-props.json",
).json();

/** The five public paths. What does not ship through them is nobody's component. */
const surface: Record<string, unknown> = { ...pkg, ...form, ...chart, ...ai, ...dnd, ...editor };

/**
 * Not every export with an uppercase name is a component.
 *
 * Hooks and utilities already drop out by their lowercase initial (`cn`,
 * `useToast`, `applyMask`, `buttonVariants`). What is left is named here, one by
 * one, because "looks like a component" is exactly the criterion that would
 * leave a component out without anyone noticing.
 */
const NOT_A_COMPONENT: Record<string, string> = {
  MASKS: "The mask table MaskedInput and applyMask read. It is data, not a component.",
};

/**
 * Components without an element of their own: there is no root to dress.
 *
 * It is not a gap. The Base UI root is only state and context, and the class
 * goes on the matching `*Content`, which accepts it. Accepting `className`
 * here would create a prop that does nothing, and a prop that lies is worse
 * than a missing prop.
 */
const NO_ROOT_ELEMENT: Record<string, string> = {
  AlertDialog: "State root. The class goes on AlertDialogContent.",
  Autocomplete: "State root. The class goes on AutocompleteInput.",
  Combobox: "State root. The class goes on ComboboxInput or ComboboxContent.",
  ComboboxValue: "Writes the chosen value as text, without a node of its own.",
  ContextMenu: "State root. The class goes on MenuContent.",
  Dialog: "State root. The class goes on DialogContent.",
  Menu: "State root. The class goes on MenuContent.",
  MenuSubmenu: "Branch state root. The class goes on the MenuContent inside it.",
  Popover: "State root. The class goes on PopoverContent.",
  PreviewCard: "State root. The class goes on PreviewCardContent.",
  Select: "State root. The class goes on SelectTrigger or SelectContent.",
  Sheet: "State root. The class goes on SheetContent.",
  Tooltip: "State root. The class goes on TooltipContent.",
  ChartAreaGradient: "Renders as <defs>: defines a gradient and paints no box at all.",
  ChartLegend: "Recharts' Legend, which configures the chart. The visible part is ChartLegendContent.",
  ChartTooltip: "Recharts' Tooltip, likewise. The visible part is ChartTooltipContent.",
  ZAxis: "Recharts axis passed through whole: configures the scale, draws no box.",
};

/*
 * The guard was born with two gaps named in a list: `Command` and
 * `CalendarPanel` painted their own DOM with a hand-written type without
 * `className`, and closing them meant touching files from another round. Both
 * were closed - the palette passes the class to the panel, and the calendar
 * shell passes it to the sheet or the panel, depending on the breakpoint - and
 * the list went away with them.
 *
 * It does not become an empty list waiting for the next one: while it existed,
 * it would be the only place in the file where one could write "this
 * component not yet" without having to justify why its root does not exist.
 */

/**
 * Parts Base UI refuses to mount without their parent, and the missing parent.
 *
 * They exist to live inside another component - `SelectItem` outside `Select`,
 * `MenuContent` outside `Menu` -, so the second layer cannot mount them alone.
 * Each one's `className` is still checked by the first layer, which reads the
 * type. And a test below requires every name here to **actually fail** when
 * mounted alone: an entry that started rendering lost its reason to exist and
 * goes back to the scan.
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
  ComboboxGroup: "Combobox",
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
  FieldsetLegend: "Fieldset",
  MenuCheckboxItem: "Menu",
  MenuContent: "Menu",
  MenuItem: "Menu",
  MenuLinkItem: "Menu",
  MenuSubmenuTrigger: "MenuSubmenu",
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
  QuestionnaireChoices: "QuestionnaireItem",
  QuestionnaireDescription: "QuestionnaireItem",
  QuestionnaireError: "QuestionnaireItem",
  QuestionnaireInput: "QuestionnaireItem",
  QuestionnaireNext: "Questionnaire",
  QuestionnairePrevious: "Questionnaire",
  QuestionnaireProgress: "Questionnaire",
  QuestionnaireSkip: "Questionnaire",
  QuestionnaireSubmit: "Questionnaire",
  QuestionnaireTitle: "QuestionnaireItem",
  PreviewCardTrigger: "PreviewCard",
  SelectContent: "Select",
  SelectGroupLabel: "SelectGroup",
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
 * Chart components that draw nothing outside a chart.
 *
 * Recharts mounts the axis, grid and series through `<ResponsiveContainer>`:
 * the element is a child of the SVG it draws, and alone the component returns
 * `null` without complaining. `ChartLegendContent` and `ChartTooltipContent`
 * land in the same place for another reason - without `payload` there is
 * nothing to draw.
 *
 * Also checked below: whoever is here must really paint nothing. A component
 * that paints and loses the class cannot hide in this list.
 */
const PAINTS_NOTHING_ALONE: Record<string, string> = {
  Bar: "Recharts series.",
  CartesianGrid: "Recharts grid.",
  Cell: "Slice of a Recharts series.",
  ChartLegendContent: "Without payload there is no legend to draw.",
  ChartTooltipContent: "Without payload there is no tooltip to draw.",
  ChartXAxis: "Recharts axis, dressed by the theme.",
  ChartYAxis: "Recharts axis, dressed by the theme.",
  LabelList: "Recharts series label.",
  Line: "Recharts series.",
  PolarAngleAxis: "Recharts polar axis.",
  PolarGrid: "Recharts polar grid.",
  PolarRadiusAxis: "Recharts polar axis.",
  Radar: "Recharts series.",
  Rectangle: "Recharts drawing primitive.",
  ReferenceArea: "Recharts marker.",
  ReferenceLine: "Recharts marker.",
  Scatter: "Recharts series.",
  XAxis: "Recharts axis.",
  YAxis: "Recharts axis.",
};

/**
 * The child the component needs to mount, when `children` cannot be just
 * anything. `children` falls into the root element row and the catalog does not
 * mark it as required, so these cases are declared here.
 */
const SAMPLE_CHILD: Record<string, ReactNode> = {
  CodeBlock: "bun add @rivocode/ui",
};

/**
 * The prop without which the component paints nothing - and would stay
 * unchecked. The provider only draws a box in local scope; in global scope it
 * dresses the whole page and has no root of its own to receive the class.
 */
const SAMPLE_PROPS: Record<string, Record<string, unknown>> = {
  RivoProvider: { scope: "local" },
  FieldError: { match: true },
  RichTextView: { value: "<p>Nota paga em 12/08.</p>" },
  ScrollToTop: { threshold: -1 },
  TableOfContents: { items: [{ id: "emissao", label: "Emissão" }] },
};

/**
 * The parent HTML requires. `<tbody>` inside `<div>` is not valid DOM, and
 * React's warning about it is true: the one that mounted the component in the
 * wrong place would be the test, and not the component.
 */
const HTML_PARENT: Record<string, string[]> = {
  TableHeader: ["table"],
  TableBody: ["table"],
  TableRow: ["table", "tbody"],
  TableCell: ["table", "tbody", "tr"],
  TableHead: ["table", "thead", "tr"],
};

/** Every export that is a component, from the three paths, in stable order. */
const pieces = Object.entries(surface)
  .filter(([name]) => /^[A-Z]/.test(name) && !NOT_A_COMPONENT[name])
  .filter(([, value]) => typeof value === "function" || typeof value === "object")
  .map(([name]) => name)
  .sort();

const excused = (name: string) => NO_ROOT_ELEMENT[name];

/**
 * Mounts the component alone, inside a node of its own.
 *
 * `data-host` exists to separate what the component painted from what the
 * provider paints around it - so that "painted nothing" is a measurement, and
 * not a guess.
 */
function mount(name: string) {
  const node = createElement(
    surface[name] as never,
    { className: MARK, ...SAMPLE_PROPS[name] } as never,
    SAMPLE_CHILD[name],
  );
  // Inside out: <table><tbody><tr>{component}</tr></tbody></table>.
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

test("the scan sees the whole package, and not a handful of components", () => {
  // If a refactor breaks the star import or the uppercase initial, the tests
  // below would pass scanning zero components: green and blind.
  expect(pieces.length).toBeGreaterThan(150);
  expect(pieces).toContain("Button");
  expect(pieces).toContain("ToastViewport");
  expect(pieces).toContain("SidebarMenuSkeleton");
  expect(pieces).toContain("ChartContainer");
});

test("every package export has an entry in the props catalog", () => {
  // Without an entry, the component would silently escape the first layer.
  expect(pieces.filter((name) => !catalog[name])).toEqual([]);
});

test("every component type accepts className on the root", () => {
  const missing = pieces.filter(
    (name) => catalog[name] && !catalog[name]!.forwardsRoot && !excused(name),
  );

  expect(missing).toEqual([]);
});

test("the exceptions name components that still exist", () => {
  // An exception that outlives the component that justified it becomes a loose
  // permission: the next component born with that name comes exempt from the rule.
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

test("whoever is exempt from className still lacks it in the type", () => {
  // The opposite of the test above: a component that gains `className` leaves
  // the list, instead of the list only growing.
  const solved = Object.keys(NO_ROOT_ELEMENT).filter((name) => catalog[name]?.forwardsRoot);

  expect(solved).toEqual([]);
});

/*
 * The second layer mounts. Left out, and this is the known limit of this
 * guard, are components with a required prop: mounting `DataTable` or `Stat`
 * would require a plausible value per component - a list of `Column<T>`, a
 * `rowKey`, a `format` -, and that table of examples is the hand-written list
 * the guard came to replace. They all remain covered by the first layer, which
 * reads the type.
 */
const skipped = (name: string) =>
  Boolean(excused(name)) ||
  Boolean(REQUIRES_PARENT[name]) ||
  Boolean(PAINTS_NOTHING_ALONE[name]) ||
  Boolean(catalog[name]?.props.some((prop) => prop.required));

const mountable = pieces.filter((name) => !skipped(name));

test("the second layer mounts most of the catalog, and not a handful", () => {
  expect(mountable.length).toBeGreaterThan(80);
});

test("every mountable component carries the caller's className to the DOM", () => {
  const dropped: string[] = [];

  for (const name of mountable) {
    if (!mount(name).wearsMark) dropped.push(name);
    // The setup `cleanup` runs between tests, and the whole scan lives in a
    // single test: without cleaning here, the previous component's mark stays
    // in the document and the next component passes wearing it.
    cleanup();
  }

  expect(dropped).toEqual([]);
});

/*
 * The blind spot the second layer leaves, covered by hand for the two
 * components that just gained `className`.
 *
 * `Command` and `CalendarPanel` have a required prop, so the scan does not
 * mount them - and the defect left after the type is right is exactly what
 * only mounting reveals: destructuring the prop and forgetting to pass it on.
 * Neither paints its root in the obvious place (the palette paints inside the
 * portal, and the calendar shell swaps shells at the mobile breakpoint), which
 * is why they went without `className` for so many versions.
 */
test("the command palette carries the class to the panel inside the portal", () => {
  render(
    <RivoProvider scope="local">
      <Command open onOpenChange={() => {}} groups={[]} className={MARK} />
    </RivoProvider>,
  );

  expect(document.querySelector(`.${MARK}`)).not.toBeNull();
});

test("the calendar shell carries the class to the desktop panel", () => {
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

test("whoever is on the parts list really does not mount alone", () => {
  // The exception's reason, checked. Without this the list would accept any
  // name someone wanted to pull out of the scan - which is the swallowing
  // `try/catch`, written another way.
  const mountedAnyway: string[] = [];

  for (const name of Object.keys(REQUIRES_PARENT)) {
    try {
      mount(name);
      mountedAnyway.push(name);
    } catch {
      // The refusal is what we expect: the component requires the parent's context.
    }
    cleanup();
  }

  expect(mountedAnyway).toEqual([]);
});

test("whoever is on the chart list really paints nothing alone", () => {
  // A component that paints and loses the class cannot hide here: painting is
  // exactly what this list denies.
  const painted: string[] = [];

  for (const name of Object.keys(PAINTS_NOTHING_ALONE)) {
    if (mount(name).painted) painted.push(name);
    cleanup();
  }

  expect(painted).toEqual([]);
});
