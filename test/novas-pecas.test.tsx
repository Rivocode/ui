import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { AspectRatio } from "../src/components/aspect-ratio";
import { Button } from "../src/components/button";
import { ButtonGroup } from "../src/components/button-group";
import { Command, type CommandGroup } from "../src/components/command";
import { Kbd } from "../src/components/kbd";

function comTema(no: React.ReactNode) {
  return render(<RivoProvider scope="local">{no}</RivoProvider>);
}

test("o atalho sai uma tecla por parte, e o leitor de tela ouve a combinacao", () => {
  comTema(<Kbd keys="mod+k" />);

  // O rotulo diz a combinacao inteira; as teclas em si ficam escondidas, senao
  // o leitor soletraria "comando" e "K" como dois textos soltos.
  const grupo = screen.getByLabelText("mod mais k");
  expect(grupo.querySelectorAll("kbd").length).toBe(2);
});

test("o grupo de botoes junta as bordas sem cada botao saber disso", () => {
  const { container } = comTema(
    <ButtonGroup>
      <Button>Salvar</Button>
      <Button variant="secondary">Salvar e enviar</Button>
    </ButtonGroup>,
  );

  const grupo = container.querySelector("[role=group]");
  expect(grupo).not.toBeNull();
  expect(grupo!.querySelectorAll("button").length).toBe(2);
  // Nenhuma classe de canto foi escrita nos filhos.
  expect(screen.getByText("Salvar").className).not.toContain("rounded-r-none");
});

test("a proporcao vira estilo, e nao mais uma classe escrita a mao", () => {
  const { container } = comTema(
    <AspectRatio ratio={4 / 3} data-testid="moldura">
      <img src="/nota.png" alt="" />
    </AspectRatio>,
  );

  const caixa = container.querySelector<HTMLElement>("[data-testid=moldura]")!;
  expect(caixa.getAttribute("style")).toContain("aspect-ratio");
  expect(caixa.getAttribute("style")).toContain("1.333");
});

const GRUPOS: CommandGroup[] = [
  {
    label: "Ir para",
    items: [
      { id: "notas", label: "Notas fiscais", keywords: "nf fatura", onSelect: () => {} },
      { id: "clientes", label: "Clientes", onSelect: () => {} },
    ],
  },
];

test("a paleta acha pelo apelido, e nao so pelo rotulo exato", () => {
  comTema(<Command open onOpenChange={() => {}} groups={GRUPOS} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "fatura" } });

  expect(screen.getByRole("option", { name: /Notas fiscais/ })).toBeDefined();
  expect(screen.queryByRole("option", { name: /Clientes/ })).toBeNull();
});

test("a paleta ignora acento, porque ninguem digita acento com pressa", () => {
  const grupos: CommandGroup[] = [
    { items: [{ id: "sao", label: "São Paulo", onSelect: () => {} }] },
  ];

  comTema(<Command open onOpenChange={() => {}} groups={grupos} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "sao" } });

  expect(screen.getByRole("option", { name: /São Paulo/ })).toBeDefined();
});

test("Enter escolhe o item marcado, e fecha", () => {
  let escolhido = "";
  let aberta = true;

  comTema(
    <Command
      open
      onOpenChange={(proxima) => {
        aberta = proxima;
      }}
      groups={[
        {
          items: [
            { id: "a", label: "Primeira", onSelect: () => (escolhido = "a") },
            { id: "b", label: "Segunda", onSelect: () => (escolhido = "b") },
          ],
        },
      ]}
    />,
  );

  const campo = screen.getByRole("combobox");
  fireEvent.keyDown(campo, { key: "ArrowDown" });
  fireEvent.keyDown(campo, { key: "Enter" });

  expect(escolhido).toBe("b");
  expect(aberta).toBe(false);
});

test("sem resultado ela diz isso, em vez de mostrar lista vazia", () => {
  comTema(<Command open onOpenChange={() => {}} groups={GRUPOS} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });

  expect(screen.getByText("Nada com esse nome")).toBeDefined();
});
