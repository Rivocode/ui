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

test("o atalho sai uma tecla por parte, e o leitor de tela ouve a combinacao", () => {
  withTheme(<Kbd keys="mod+k" />);

  // O rotulo diz a combinacao inteira; as teclas em si ficam escondidas, senao
  // o leitor soletraria "comando" e "K" como dois textos soltos. O nome falado
  // e o da tecla que existe no teclado - `mod` nao e tecla, e era o que o
  // rotulo dizia.
  const group = screen.getByLabelText("Control mais K");
  expect(group.querySelectorAll("kbd").length).toBe(2);
  // Nome em `span` generico e descartado pelo leitor: o papel e o que segura o
  // rotulo de pe.
  expect(group.getAttribute("role")).toBe("img");
});

test("o grupo de botoes junta as bordas sem cada botao saber disso", () => {
  const { container } = withTheme(
    <ButtonGroup>
      <Button>Salvar</Button>
      <Button variant="secondary">Salvar e enviar</Button>
    </ButtonGroup>,
  );

  const group = container.querySelector("[role=group]");
  expect(group).not.toBeNull();
  expect(group!.querySelectorAll("button").length).toBe(2);
  // Nenhuma classe de canto foi escrita nos filhos.
  expect(screen.getByText("Salvar").className).not.toContain("rounded-r-none");
});

test("a proporcao vira estilo, e nao mais uma classe escrita a mao", () => {
  const { container } = withTheme(
    <AspectRatio ratio={4 / 3} data-testid="moldura">
      <img src="/nota.png" alt="" />
    </AspectRatio>,
  );

  const box = container.querySelector<HTMLElement>("[data-testid=moldura]")!;
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

test("a paleta acha pelo apelido, e nao so pelo rotulo exato", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "fatura" } });

  expect(screen.getByRole("option", { name: /Notas fiscais/ })).toBeDefined();
  expect(screen.queryByRole("option", { name: /Clientes/ })).toBeNull();
});

test("a paleta ignora acento, porque ninguem digita acento com pressa", () => {
  const groups: CommandGroup[] = [
    { items: [{ id: "sao", label: "São Paulo", onSelect: () => {} }] },
  ];

  withTheme(<Command open onOpenChange={() => {}} groups={groups} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "sao" } });

  expect(screen.getByRole("option", { name: /São Paulo/ })).toBeDefined();
});

test("Enter escolhe o item marcado, e fecha", () => {
  let picked = "";
  let isOpen = true;

  withTheme(
    <Command
      open
      onOpenChange={(proxima) => {
        isOpen = proxima;
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

test("sem resultado ela diz isso, em vez de mostrar lista vazia", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });

  expect(screen.getByText("Nada com esse nome")).toBeDefined();
});
