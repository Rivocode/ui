import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Glob } from "bun";

import { AlertDialog, AlertDialogContent } from "../src/components/alert-dialog";
import { Button } from "../src/components/button";
import { Checkbox } from "../src/components/checkbox";
import { Command } from "../src/components/command";
import { Dialog, DialogContent } from "../src/components/dialog";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../src/components/menu";
import { Popover, PopoverContent, PopoverTrigger } from "../src/components/popover";
import { Radio, RadioGroup } from "../src/components/radio";
import { Switch } from "../src/components/switch";
import { useToast } from "../src/components/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "../src/components/tooltip";
import { RivoProvider } from "../src/provider/rivo-provider";

const CHANGING_STATE =
  /^(?:[\w-]+:)*(?:group-)?data-\[(?:starting-style|ending-style|checked|panel-open|popup-open)\]:(?:[\w-]+:)*(.+)$/;

function propertyOf(utility: string): string | null {
  if (utility.startsWith("[transform:")) return "transform";
  const bare = utility.replace(/^-/, "");
  if (bare.startsWith("scale-")) return "scale";
  if (bare.startsWith("translate-")) return "translate";
  if (bare.startsWith("rotate-")) return "rotate";
  if (bare.startsWith("opacity-")) return "opacity";
  if (/^h-/.test(bare)) return "height";
  if (/^w-/.test(bare)) return "width";
  return null;
}

const TRANSFORMS = ["transform", "translate", "scale", "rotate"];

function transitioned(tokens: string[]): Set<string> | "all" {
  const covered = new Set<string>();
  for (const token of tokens) {
    if (token === "transition-all") return "all";
    if (token === "transition") {
      for (const name of [...TRANSFORMS, "opacity"]) covered.add(name);
    }
    if (token === "transition-transform") for (const name of TRANSFORMS) covered.add(name);
    if (token === "transition-opacity") covered.add("opacity");
    const listed = /^transition-\[([^\]]+)\]$/.exec(token);
    if (listed) for (const name of listed[1]!.split(",")) covered.add(name.trim());
  }
  return covered;
}

function stranded(tokens: string[]): string[] {
  const covered = transitioned(tokens);
  if (covered === "all") return [];
  if (!tokens.some((token) => /^(?:[^\s:]+:)*transition(?:-|$)/.test(token))) return [];
  const out: string[] = [];
  for (const token of tokens) {
    const hit = CHANGING_STATE.exec(token);
    if (!hit) continue;
    const property = propertyOf(hit[1]!);
    if (property && !covered.has(property)) out.push(`${token} (${property})`);
  }
  return out;
}

function classBlocks(code: string) {
  const blocks: { text: string; at: number }[] = [];
  for (const opener of ["cn(", "cva("]) {
    for (let i = code.indexOf(opener); i !== -1; i = code.indexOf(opener, i + 1)) {
      if (/[\w.]/.test(code[i - 1] ?? "")) continue;
      let depth = 1;
      let end = i + opener.length;
      while (end < code.length && depth > 0) {
        if (code[end] === "(") depth += 1;
        else if (code[end] === ")") depth -= 1;
        end += 1;
      }
      blocks.push({ text: code.slice(i, end), at: i });
    }
  }
  for (const hit of code.matchAll(/className="[^"]*"/g)) {
    blocks.push({ text: hit[0], at: hit.index! });
  }
  return blocks;
}

function tokensOf(text: string) {
  return [...text.matchAll(/[^\s"'`]+/g)].map((hit) => hit[0]);
}

async function sources() {
  const found: string[] = [];
  for await (const file of new Glob("src/**/*.tsx").scan({ cwd: "." })) found.push(file);
  return found;
}

function lineAt(code: string, at: number) {
  return code.slice(0, at).split("\n").length;
}

test("a propriedade que o estado muda e a mesma que a transicao anima", async () => {
  const files = await sources();
  expect(files.length).toBeGreaterThan(80);

  let blocks = 0;
  const jumps: string[] = [];
  for (const file of files) {
    const code = await Bun.file(file).text();
    for (const { text, at } of classBlocks(code)) {
      blocks += 1;
      for (const miss of stranded(tokensOf(text)))
        jumps.push(`${file}:${lineAt(code, at)} ${miss}`);
    }
  }

  expect(blocks).toBeGreaterThan(300);
  expect(jumps).toEqual([]);
});

test("nenhuma lista de transicao nomeia transform, que o Tailwind 4 nao escreve", async () => {
  const files = await sources();
  expect(files.length).toBeGreaterThan(80);

  const named: string[] = [];
  for (const file of files) {
    const code = await Bun.file(file).text();
    for (const hit of code.matchAll(/transition-\[([^\]]+)\]/g)) {
      if (hit[1]!.split(",").includes("transform"))
        named.push(`${file}:${lineAt(code, hit.index!)} ${hit[0]}`);
    }
  }

  expect(named).toEqual([]);
});

test("toda transicao dura um token, que zera quando a pessoa pede menos movimento", async () => {
  const files = await sources();
  expect(files.length).toBeGreaterThan(80);

  let seen = 0;
  const fixed: string[] = [];
  for (const file of files) {
    const code = await Bun.file(file).text();
    for (const { text, at } of classBlocks(code)) {
      const tokens = tokensOf(text);
      const moves = tokens.filter((token) => /^(?:[\w-]+:)*transition(?:-|$)/.test(token));
      if (moves.length === 0) continue;
      seen += 1;
      const lasts = tokens.some((token) =>
        /^(?:[\w-]+:)*duration-\[var\(--rc-duration-(?:fast|base|slow|sheet)\)\]$/.test(token),
      );
      if (!lasts) fixed.push(`${file}:${lineAt(code, at)} ${moves.join(" ")}`);
    }
  }

  expect(seen).toBeGreaterThan(60);
  expect(fixed).toEqual([]);
});

test("toda animacao em laco para quando a pessoa pede menos movimento", async () => {
  const files = await sources();
  expect(files.length).toBeGreaterThan(80);

  let seen = 0;
  const loose: string[] = [];
  for (const file of files) {
    const code = await Bun.file(file).text();
    for (const { text, at } of classBlocks(code)) {
      const tokens = tokensOf(text);
      for (const token of tokens) {
        const hit = /^((?:[^\s:]+:)*)animate-(?!none$)[\w-]+$/.exec(token);
        if (!hit || hit[1]!.includes("motion-reduce:")) continue;
        seen += 1;
        if (!tokens.includes(`motion-reduce:${hit[1]}animate-none`)) {
          loose.push(`${file}:${lineAt(code, at)} ${token}`);
        }
      }
    }
  }

  expect(seen).toBeGreaterThanOrEqual(4);
  expect(loose).toEqual([]);
});

function tokensOfElement(element: Element | null) {
  expect(element).not.toBeNull();
  return element!.className.split(" ").filter(Boolean);
}

function expectAnimatedEntry(element: Element | null, entry: string[]) {
  const tokens = tokensOfElement(element);
  for (const token of entry) expect(tokens).toContain(token);
  expect(stranded(tokens)).toEqual([]);
  expect(tokens.some((token) => token.startsWith("duration-[var(--rc-duration-"))).toBe(true);
}

test("o painel flutuante cresce e aparece, e o crescer nao e de estalo", () => {
  render(
    <RivoProvider scope="local">
      <Menu defaultOpen>
        <MenuTrigger>Mais</MenuTrigger>
        <MenuContent>
          <MenuItem>Duplicar</MenuItem>
        </MenuContent>
      </Menu>
      <Popover defaultOpen>
        <PopoverTrigger>Filtro</PopoverTrigger>
        <PopoverContent data-testid="painel-pop">Corpo</PopoverContent>
      </Popover>
      <Tooltip defaultOpen>
        <TooltipTrigger>Ajuda</TooltipTrigger>
        <TooltipContent>Dica</TooltipContent>
      </Tooltip>
    </RivoProvider>,
  );

  const entry = ["transition-[opacity,scale]", "data-[starting-style]:scale-[0.97]"];
  expectAnimatedEntry(screen.getByRole("menu"), entry);
  expectAnimatedEntry(screen.getByTestId("painel-pop"), entry);
  expectAnimatedEntry(screen.getByRole("tooltip"), entry);
  expect(tokensOfElement(screen.getByRole("menu"))).not.toContain("transition-[opacity,transform]");
});

test("o dialogo entra junto com a tarja, e nao de estalo por cima dela", () => {
  render(
    <RivoProvider scope="local">
      <Dialog open>
        <DialogContent data-testid="dg">Corpo</DialogContent>
      </Dialog>
      <AlertDialog open>
        <AlertDialogContent data-testid="ad">Corpo</AlertDialogContent>
      </AlertDialog>
    </RivoProvider>,
  );

  const entry = [
    "transition-[opacity,scale]",
    "data-[starting-style]:opacity-0",
    "data-[ending-style]:opacity-0",
    "data-[starting-style]:scale-[0.97]",
  ];
  expectAnimatedEntry(screen.getByTestId("dg"), entry);
  expectAnimatedEntry(screen.getByTestId("ad"), entry);
});

test("a paleta de comandos e a tarja dela entram animadas", () => {
  render(
    <RivoProvider scope="local">
      <Command open onOpenChange={() => {}} groups={[]} />
    </RivoProvider>,
  );

  expectAnimatedEntry(screen.getByRole("dialog"), [
    "transition-[opacity,scale]",
    "data-[starting-style]:opacity-0",
  ]);
  const backdrop = document.querySelector("[data-rc-portal] .bg-overlay");
  expectAnimatedEntry(backdrop, [
    "data-[starting-style]:opacity-0",
    "data-[ending-style]:opacity-0",
  ]);
});

test("o polegar do interruptor desliza, porque a transicao anima translate", () => {
  render(<Switch aria-label="Notificar" defaultChecked />);

  const thumb = screen.getByRole("switch").querySelector("span");
  const tokens = tokensOfElement(thumb);
  expect(tokens).toContain("data-[checked]:translate-x-5");
  expect(tokens).toContain("transition-[translate,background-color]");
  expect(tokens).not.toContain("transition-[transform,background-color]");
  expect(stranded(tokens)).toEqual([]);
});

test("a marca da caixa e o ponto do radio aparecem crescendo", () => {
  render(
    <>
      <Checkbox aria-label="Aceito" defaultChecked />
      <RadioGroup defaultValue="a" aria-label="Plano">
        <Radio value="a" aria-label="Mensal" />
      </RadioGroup>
    </>,
  );

  const entry = [
    "transition-[opacity,scale]",
    "data-[starting-style]:scale-50",
    "data-[starting-style]:opacity-0",
    "data-[ending-style]:opacity-0",
  ];
  expectAnimatedEntry(document.querySelector("[data-rc-check]"), entry);
  expectAnimatedEntry(screen.getByRole("radio").querySelector("span"), entry);
});

function Disparo() {
  const toast = useToast();
  return <Button onClick={() => toast.add({ title: "Nota emitida" })}>Emitir</Button>;
}

test("o aviso desliza de verdade, porque a transicao anima translate", () => {
  render(
    <RivoProvider scope="local" toastPosition="bottom-right">
      <Disparo />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  const tokens = tokensOfElement(screen.getByText("Nota emitida").closest("[class*='shadow-3']"));
  expect(tokens).toContain("data-[starting-style]:translate-x-4");
  expect(tokens).toContain("transition-[opacity,translate]");
  expect(stranded(tokens)).toEqual([]);
});
