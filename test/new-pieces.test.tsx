import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { AspectRatio } from "../src/components/aspect-ratio";
import { Button } from "../src/components/button";
import { ButtonGroup } from "../src/components/button-group";
import { Command, type CommandGroup } from "../src/components/command";
import { Kbd } from "../src/components/kbd";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the shortcut comes out one key per part, and the screen reader hears the combination", () => {
  withTheme(<Kbd keys="mod+k" />);

  // The label says the whole combination; the keys themselves stay hidden,
  // otherwise the reader would spell "command" and "K" as two loose texts. The
  // spoken name is the one of the key that exists on the keyboard - `mod` is
  // not a key, and it was what the label said.
  const group = screen.getByLabelText("Control mais K");
  expect(group.querySelectorAll("kbd").length).toBe(2);
  // A name on a generic `span` is dropped by the reader: the role is what keeps
  // the label standing.
  expect(group.getAttribute("role")).toBe("img");
});

test("the button group joins the borders without each button knowing about it", () => {
  const { container } = withTheme(
    <ButtonGroup>
      <Button>Salvar</Button>
      <Button variant="secondary">Salvar e enviar</Button>
    </ButtonGroup>,
  );

  const group = container.querySelector("[role=group]");
  expect(group).not.toBeNull();
  expect(group!.querySelectorAll("button").length).toBe(2);
  // No corner class was written on the children.
  expect(screen.getByText("Salvar").className).not.toContain("rounded-r-none");
});

test("the ratio becomes a style, and no longer a hand-written class", () => {
  const { container } = withTheme(
    <AspectRatio ratio={4 / 3} data-testid="frame">
      <img src="/nota.png" alt="" />
    </AspectRatio>,
  );

  const box = container.querySelector<HTMLElement>("[data-testid=frame]")!;
  expect(box.getAttribute("style")).toContain("aspect-ratio");
  expect(box.getAttribute("style")).toContain("1.333");
});

const GROUPS: CommandGroup[] = [
  {
    label: "Ir para",
    items: [
      { id: "notas", label: "Notas fiscais", keywords: "nf fatura", onSelect: () => {} },
      { id: "clientes", label: "Clientes", onSelect: () => {} },
    ],
  },
];

test("the palette finds by alias, not only by the exact label", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "fatura" } });

  expect(screen.getByRole("option", { name: /Notas fiscais/ })).toBeDefined();
  expect(screen.queryByRole("option", { name: /Clientes/ })).toBeNull();
});

test("the palette ignores accents, because nobody types accents in a hurry", () => {
  const groups: CommandGroup[] = [
    { items: [{ id: "sao", label: "São Paulo", onSelect: () => {} }] },
  ];

  withTheme(<Command open onOpenChange={() => {}} groups={groups} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "sao" } });

  expect(screen.getByRole("option", { name: /São Paulo/ })).toBeDefined();
});

test("Enter picks the highlighted item, and closes", () => {
  let picked = "";
  let isOpen = true;

  withTheme(
    <Command
      open
      onOpenChange={(next) => {
        isOpen = next;
      }}
      groups={[
        {
          items: [
            { id: "a", label: "Primeira", onSelect: () => (picked = "a") },
            { id: "b", label: "Segunda", onSelect: () => (picked = "b") },
          ],
        },
      ]}
    />,
  );

  const field = screen.getByRole("combobox");
  fireEvent.keyDown(field, { key: "ArrowDown" });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(picked).toBe("b");
  expect(isOpen).toBe(false);
});

test("with no result it says so, instead of showing an empty list", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });

  expect(screen.getByText("Nada com esse nome")).toBeDefined();
});

test("changing the query moves the highlight back to the top, and Enter follows the highlight", () => {
  let picked = "";

  withTheme(
    <Command
      open
      onOpenChange={() => {}}
      groups={[
        {
          items: [
            { id: "abonar", label: "Abonar multa", onSelect: () => (picked = "abonar") },
            {
              id: "abandonar",
              label: "Abandonar rascunho",
              onSelect: () => (picked = "abandonar"),
            },
            { id: "arquivar", label: "Arquivar nota", onSelect: () => (picked = "arquivar") },
            {
              id: "atualizar",
              label: "Atualizar cadastro",
              onSelect: () => (picked = "atualizar"),
            },
          ],
        },
      ]}
    />,
  );

  const field = screen.getByRole("combobox");
  fireEvent.change(field, { target: { value: "a" } });
  fireEvent.keyDown(field, { key: "ArrowDown" });
  fireEvent.keyDown(field, { key: "ArrowDown" });
  fireEvent.keyDown(field, { key: "ArrowDown" });
  expect(screen.getByRole("option", { selected: true }).textContent).toContain(
    "Atualizar cadastro",
  );

  fireEvent.change(field, { target: { value: "ab" } });
  expect(screen.getByRole("option", { selected: true }).textContent).toContain("Abonar multa");

  fireEvent.keyDown(field, { key: "Enter" });
  expect(picked).toBe("abonar");
});
