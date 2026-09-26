import { describe, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { useState, type ReactNode } from "react";

import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "../src/components/alert-dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../src/components/combobox";
import { Command } from "../src/components/command";
import { Dialog, DialogContent, DialogTitle } from "../src/components/dialog";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../src/components/menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "../src/components/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../src/components/popover";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "../src/components/preview-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../src/components/select";
import { Sheet, SheetContent, SheetTitle } from "../src/components/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "../src/components/tooltip";
import { Tour } from "../src/components/tour";
import { Kanban } from "../src/dnd/index";
import { RivoProvider } from "../src/provider/rivo-provider";

const SCALE = Object.fromEntries(
  [...readFileSync(new URL("../src/tokens/scales.css", import.meta.url), "utf8").matchAll(
    /--rc-z-([a-z]+):\s*(\d+);/g,
  )].map((match) => [match[1]!, Number(match[2])]),
);

function zExpression(element: Element): string | null {
  const inline = (element as HTMLElement).style?.zIndex;
  if (inline) return inline;
  const token = (element.getAttribute("class") ?? "")
    .split(/\s+/)
    .find((name) => /^z-\[.+\]$/.test(name));
  return token ? token.slice(3, -1) : null;
}

function resolve(expression: string): number {
  const numeric = expression
    .replace(/var\(--rc-z-([a-z]+)\)/g, (_, name: string) => {
      expect(SCALE[name]).toBeNumber();
      return String(SCALE[name]);
    })
    .replaceAll("max(", "Math.max(")
    .replaceAll("calc(", "(");
  expect(numeric).toMatch(/^[\d\s+(),.Mathmx]+$/);
  return Number(new Function(`return ${numeric}`)());
}

function levelOf(element: Element | null): number {
  let node = element;
  while (node && node !== document.body) {
    const expression = zExpression(node);
    if (expression) return resolve(expression);
    node = node.parentElement;
  }
  throw new Error("sem z-index do elemento ate o body");
}

const inner = () => document.querySelector('[data-testid="inner"]');
const outer = () => document.querySelector('[data-testid="outer"]');
const innerBackdrop = () => document.querySelector(".inner-backdrop");

type Floating = { name: string; node: ReactNode; backdrop?: boolean };

const ITEMS = [
  { label: "Abertas", value: "abertas" },
  { label: "Pagas", value: "pagas" },
];

const INNERS: Floating[] = [
  {
    name: "Select",
    node: (
      <Select items={ITEMS} defaultValue="abertas" defaultOpen>
        <SelectTrigger aria-label="Status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent data-testid="inner">
          <SelectItem value="abertas">Abertas</SelectItem>
          <SelectItem value="pagas">Pagas</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    name: "Combobox",
    node: (
      <Combobox items={ITEMS} defaultOpen>
        <ComboboxInput aria-label="Cliente" />
        <ComboboxContent data-testid="inner">
          <ComboboxList>
            {(item: (typeof ITEMS)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ),
  },
  {
    name: "Menu",
    node: (
      <Menu defaultOpen>
        <MenuTrigger>Acoes</MenuTrigger>
        <MenuContent data-testid="inner">
          <MenuItem>Baixar</MenuItem>
        </MenuContent>
      </Menu>
    ),
  },
  {
    name: "NavigationMenu",
    node: (
      <NavigationMenu defaultValue="produtos">
        <NavigationMenuList>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent data-testid="inner">
              <NavigationMenuLink href="#">Notas</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenu>
    ),
  },
  {
    name: "Popover",
    node: (
      <Popover defaultOpen>
        <PopoverTrigger>Filtros</PopoverTrigger>
        <PopoverContent data-testid="inner">Filtros</PopoverContent>
      </Popover>
    ),
  },
  {
    name: "PreviewCard",
    node: (
      <PreviewCard defaultOpen>
        <PreviewCardTrigger href="#">Cliente</PreviewCardTrigger>
        <PreviewCardContent data-testid="inner">Cliente</PreviewCardContent>
      </PreviewCard>
    ),
  },
  {
    name: "Tooltip",
    node: (
      <Tooltip defaultOpen>
        <TooltipTrigger>Dica</TooltipTrigger>
        <TooltipContent data-testid="inner">Dica</TooltipContent>
      </Tooltip>
    ),
  },
  {
    name: "Dialog",
    backdrop: true,
    node: (
      <Dialog defaultOpen>
        <DialogContent data-testid="inner" classNames={{ backdrop: "inner-backdrop" }}>
          <DialogTitle>Interno</DialogTitle>
        </DialogContent>
      </Dialog>
    ),
  },
  {
    name: "AlertDialog",
    backdrop: true,
    node: (
      <AlertDialog defaultOpen>
        <AlertDialogContent data-testid="inner" classNames={{ backdrop: "inner-backdrop" }}>
          <AlertDialogTitle>Excluir?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    ),
  },
  {
    name: "Sheet",
    backdrop: true,
    node: (
      <Sheet defaultOpen>
        <SheetContent data-testid="inner" classNames={{ backdrop: "inner-backdrop" }}>
          <SheetTitle>Interno</SheetTitle>
        </SheetContent>
      </Sheet>
    ),
  },
  {
    name: "Command",
    node: <Command open onOpenChange={() => {}} groups={[]} data-testid="inner" />,
  },
];

type Layer = { name: string; modal?: boolean; wrap: (children: ReactNode) => ReactNode };

const LAYERS: Layer[] = [
  {
    name: "Dialog",
    modal: true,
    wrap: (children) => (
      <Dialog defaultOpen>
        <DialogContent data-testid="outer">
          <DialogTitle>Externo</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    ),
  },
  {
    name: "AlertDialog",
    modal: true,
    wrap: (children) => (
      <AlertDialog defaultOpen>
        <AlertDialogContent data-testid="outer">
          <AlertDialogTitle>Externo</AlertDialogTitle>
          {children}
        </AlertDialogContent>
      </AlertDialog>
    ),
  },
  {
    name: "Sheet",
    modal: true,
    wrap: (children) => (
      <Sheet defaultOpen>
        <SheetContent data-testid="outer">
          <SheetTitle>Externo</SheetTitle>
          {children}
        </SheetContent>
      </Sheet>
    ),
  },
  {
    name: "Popover",
    wrap: (children) => (
      <Popover defaultOpen>
        <PopoverTrigger>Externo</PopoverTrigger>
        <PopoverContent data-testid="outer">{children}</PopoverContent>
      </Popover>
    ),
  },
  {
    name: "PreviewCard",
    wrap: (children) => (
      <PreviewCard defaultOpen>
        <PreviewCardTrigger href="#">Externo</PreviewCardTrigger>
        <PreviewCardContent data-testid="outer">{children}</PreviewCardContent>
      </PreviewCard>
    ),
  },
  {
    name: "Menu",
    wrap: (children) => (
      <Menu defaultOpen>
        <MenuTrigger>Externo</MenuTrigger>
        <MenuContent data-testid="outer">{children}</MenuContent>
      </Menu>
    ),
  },
];

function mount(node: ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 20)));

describe("o que abre de dentro de uma camada fica acima dela", () => {
  test("a matriz tem o tamanho que se espera", () => {
    expect(INNERS.length).toBeGreaterThan(9);
    expect(LAYERS.length).toBeGreaterThan(4);
    expect(Object.keys(SCALE).length).toBe(8);
  });

  for (const layer of LAYERS) {
    for (const floating of INNERS) {
      if (floating.name === "NavigationMenu" && !layer.modal) continue;
      test(`${floating.name} dentro de ${layer.name}`, async () => {
        mount(layer.wrap(floating.node));
        await settle();

        expect(outer()).not.toBeNull();
        expect(inner()).not.toBeNull();
        const base = levelOf(outer());
        expect(levelOf(inner())).toBeGreaterThan(base);
        if (floating.backdrop && !layer.modal) expect(innerBackdrop()).not.toBeNull();
        if (innerBackdrop()) {
          expect(levelOf(innerBackdrop())).toBeGreaterThan(base);
          expect(levelOf(inner())).toBeGreaterThan(levelOf(innerBackdrop()));
        }
        cleanup();
      });
    }
  }

  test("fora de qualquer camada, cada peca fica no proprio degrau e sem estilo inline", async () => {
    const expected: Record<string, string> = {
      Select: "dropdown",
      Combobox: "dropdown",
      Menu: "dropdown",
      NavigationMenu: "dropdown",
      Popover: "popover",
      PreviewCard: "popover",
      Tooltip: "tooltip",
      Dialog: "dialog",
      AlertDialog: "dialog",
      Sheet: "dialog",
      Command: "dialog",
    };
    expect(Object.keys(expected).length).toBe(INNERS.length);

    for (const floating of INNERS) {
      mount(floating.node);
      await settle();
      expect(inner()).not.toBeNull();
      expect(levelOf(inner())).toBe(SCALE[expected[floating.name]!]!);
      let node: Element | null = inner();
      while (node && node !== document.body) {
        expect((node as HTMLElement).style.zIndex).toBe("");
        node = node.parentElement;
      }
      cleanup();
    }
  });

  test("tres camadas encaixadas sobem uma sobre a outra", async () => {
    mount(
      <Dialog defaultOpen>
        <DialogContent data-testid="outer">
          <DialogTitle>Externo</DialogTitle>
          <Popover defaultOpen>
            <PopoverTrigger>Meio</PopoverTrigger>
            <PopoverContent data-testid="middle">
              <Select items={ITEMS} defaultValue="abertas" defaultOpen>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent data-testid="inner">
                  <SelectItem value="abertas">Abertas</SelectItem>
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>
        </DialogContent>
      </Dialog>,
    );
    await settle();

    const middle = levelOf(document.querySelector('[data-testid="middle"]'));
    expect(middle).toBeGreaterThan(levelOf(outer()));
    expect(levelOf(inner())).toBeGreaterThan(middle);
    expect(levelOf(inner())).toBeLessThan(SCALE.toast!);
    cleanup();
  });
});

describe("o alerta aberto de dentro de um popover", () => {
  function Page() {
    const [open, setOpen] = useState(false);
    return (
      <RivoProvider scope="local">
        <Popover defaultOpen>
          <PopoverTrigger>Abrir</PopoverTrigger>
          <PopoverContent data-testid="outer">
            <button type="button" id="abre-alerta" onClick={() => setOpen(true)}>
              excluir
            </button>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogContent data-testid="inner" classNames={{ backdrop: "inner-backdrop" }}>
                <AlertDialogTitle>Excluir?</AlertDialogTitle>
                <button type="button" id="fecha-alerta" onClick={() => setOpen(false)}>
                  cancelar
                </button>
              </AlertDialogContent>
            </AlertDialog>
          </PopoverContent>
        </Popover>
      </RivoProvider>
    );
  }

  async function click(id: string) {
    await act(async () => {
      (document.getElementById(id) as HTMLElement).click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  }

  test("fica por cima do popover, e o popover para de receber clique e foco", async () => {
    render(<Page />);
    await settle();
    expect(outer()!.closest("[inert]")).toBeNull();

    await click("abre-alerta");
    expect(inner()).not.toBeNull();
    expect(levelOf(innerBackdrop())).toBeGreaterThan(levelOf(outer()));
    expect(levelOf(inner())).toBeGreaterThan(levelOf(innerBackdrop()));
    expect(outer()!.closest("[inert]")).not.toBeNull();
    expect(inner()!.closest("[inert]")).toBeNull();

    await click("fecha-alerta");
    expect(outer()).not.toBeNull();
    expect(outer()!.closest("[inert]")).toBeNull();
    cleanup();
  });
});

describe("o tour cobre a camada onde mora o alvo", () => {
  test("alvo dentro de um Dialog: a mascara fica acima do dialogo, e o balao acima da mascara", async () => {
    const page = (open: boolean) => (
      <RivoProvider scope="local">
        <Dialog defaultOpen>
          <DialogContent data-testid="outer">
            <DialogTitle>Externo</DialogTitle>
            <button id="alvo-no-dialogo" type="button">
              alvo
            </button>
          </DialogContent>
        </Dialog>
        <Tour open={open} interactive steps={[{ target: "#alvo-no-dialogo", title: "Aqui" }]} />
      </RivoProvider>
    );
    const { rerender } = render(page(false));
    await settle();
    rerender(page(true));
    await settle();

    const mask = document.querySelector("[data-tour-mask]");
    const card = document.querySelector("[data-tour-popup]");
    expect(mask).not.toBeNull();
    expect(card).not.toBeNull();
    expect(levelOf(mask)).toBeGreaterThan(levelOf(outer()));
    expect(levelOf(card)).toBeGreaterThan(levelOf(mask));
    cleanup();
  });

  test("alvo fora de camada: a mascara e o balao ficam nos degraus de sempre", async () => {
    mount(
      <>
        <button id="alvo-solto" type="button">
          alvo
        </button>
        <Tour defaultOpen steps={[{ target: "#alvo-solto", title: "Aqui" }]} />
      </>,
    );
    await settle();

    const mask = document.querySelector<HTMLElement>("[data-tour-mask]");
    expect(mask).not.toBeNull();
    expect(levelOf(mask)).toBe(SCALE.overlay!);
    expect(mask!.style.zIndex).toBe("");
    expect(levelOf(document.querySelector("[data-tour-popup]"))).toBe(SCALE.popover!);
    cleanup();
  });
});

describe("o cartao arrastado do Kanban", () => {
  type Card = { id: string; title: string };

  function Board() {
    return (
      <Kanban<Card>
        aria-label="Notas"
        columns={[
          { id: "todo", title: "A fazer", items: [{ id: "1", title: "Nota 1" }] },
          { id: "done", title: "Feita", items: [] },
        ]}
        getKey={(item) => item.id}
        getLabel={(item) => item.title}
        onMove={() => {}}
        renderCard={(item) => <span data-card="">{item.title}</span>}
      />
    );
  }

  async function pick() {
    const handle = document.querySelector("[aria-roledescription]") as HTMLElement;
    expect(handle).not.toBeNull();
    handle.focus();
    await act(async () => {
      fireEvent.keyDown(handle, { key: " ", code: "Space" });
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    const cards = [...document.querySelectorAll("[data-card]")];
    expect(cards.length).toBe(2);
    return cards[1]!;
  }

  test("dentro de um Sheet, passa por cima da folha", async () => {
    mount(
      <Sheet defaultOpen>
        <SheetContent data-testid="outer">
          <SheetTitle>Quadro</SheetTitle>
          <Board />
        </SheetContent>
      </Sheet>,
    );
    await settle();

    expect(levelOf(await pick())).toBeGreaterThan(levelOf(outer()));
    cleanup();
  });

  test("fora de camada, fica no degrau do dropdown", async () => {
    mount(<Board />);
    await settle();

    expect(levelOf(await pick())).toBe(SCALE.dropdown!);
    cleanup();
  });
});
