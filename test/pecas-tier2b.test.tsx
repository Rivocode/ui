import { expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Splitter } from "../src/components/splitter";
import { Editable } from "../src/components/editable";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("a divisoria e um separator que o teclado move", () => {
  // Arrastar com o mouse e metade da peca: sem teclado, quem nao usa ponteiro
  // fica preso na proporcao que o desenvolvedor escolheu.
  let size = 40;
  withTheme(
    <Splitter
      defaultSize={40}
      onSizeChange={(next) => {
        size = next;
      }}
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  const handle = screen.getByRole("separator", { name: "Lista e detalhe" });
  expect(handle.getAttribute("aria-valuenow")).toBe("40");

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(size).toBeGreaterThan(40);
});

test("a divisoria respeita o minimo dos dois lados", () => {
  let size = 20;
  withTheme(
    <Splitter
      defaultSize={20}
      min={20}
      onSizeChange={(next) => {
        size = next;
      }}
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowLeft" });
  expect(size).toBe(20);
});

test("no celular os dois lados empilham, em vez de espremer", () => {
  // Duas colunas de 190px nao sao duas colunas: sao duas listas ilegiveis.
  withTheme(<Splitter start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />);

  // O primeiro filho e o container do provider; a peca e o proximo.
  const splitter = screen.getByRole("separator").parentElement!;
  expect(splitter.className).toContain("max-md:flex-col");
  expect(screen.getByRole("separator").className).toContain("max-md:hidden");
});

function splitter(dir: "ltr" | "rtl") {
  const medida = { size: 50 };
  const view = render(
    <RivoProvider scope="local" dir={dir}>
      <Splitter
        defaultSize={50}
        min={10}
        onSizeChange={(next) => {
          medida.size = next;
        }}
        start={<p>Lista</p>}
        end={<p>Detalhe</p>}
        label="Lista e detalhe"
      />
    </RivoProvider>,
  );

  const handle = within(view.container).getByRole("separator", { name: "Lista e detalhe" });
  handle.setPointerCapture = () => {};
  handle.parentElement!.getBoundingClientRect = () =>
    ({ left: 0, right: 600, width: 600, top: 0, bottom: 300, height: 300 }) as DOMRect;

  return { ...view, handle, medida };
}

test("em rtl o arraste mede da borda que comeca a leitura, e nao sempre da esquerda", () => {
  const { handle, medida } = splitter("rtl");

  fireEvent.pointerDown(handle, { clientX: 300, clientY: 150, pointerId: 1 });
  fireEvent.pointerMove(window, { clientX: 420, clientY: 150, pointerId: 1 });

  expect(medida.size).toBe(30);
  expect(handle.getAttribute("aria-valuenow")).toBe("30");

  const espelho = splitter("ltr");
  fireEvent.pointerDown(espelho.handle, { clientX: 300, clientY: 150, pointerId: 1 });
  fireEvent.pointerMove(window, { clientX: 420, clientY: 150, pointerId: 1 });

  expect(espelho.medida.size).toBe(70);
});

test("em rtl a seta move a divisoria para o lado que a pessoa ve, e nao pelo numero", () => {
  const { handle, medida } = splitter("rtl");

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(medida.size).toBe(48);

  fireEvent.keyDown(handle, { key: "ArrowLeft" });
  fireEvent.keyDown(handle, { key: "ArrowLeft" });
  expect(medida.size).toBe(52);

  fireEvent.keyDown(handle, { key: "Home" });
  expect(medida.size).toBe(10);

  fireEvent.keyDown(handle, { key: "End" });
  expect(medida.size).toBe(90);
});

test("o alvo da divisoria chega aos 24px que a WCAG 2.5.8 pede", () => {
  withTheme(<Splitter start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />);

  const handle = screen.getByRole("separator");
  expect(handle.className).toContain("relative");
  expect(handle.className).toContain("after:absolute");
  expect(handle.className).toContain("after:-inset-x-3");
});

test("a divisoria deitada estica o alvo pela outra medida", () => {
  withTheme(
    <Splitter
      orientation="vertical"
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  const handle = screen.getByRole("separator");
  expect(handle.className).toContain("after:-inset-y-3");
});

test("a divisoria diz a medida com unidade, e nao um numero pelado", () => {
  withTheme(
    <Splitter defaultSize={50} start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />,
  );

  const handle = screen.getByRole("separator");
  expect(handle.getAttribute("aria-valuetext")).toBe("50%");

  fireEvent.keyDown(handle, { key: "End" });
  expect(handle.getAttribute("aria-valuetext")).toBe("85%");
});

test("a divisoria aponta para o lado que ela mede", () => {
  withTheme(<Splitter start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />);

  const handle = screen.getByRole("separator");
  const controlled = document.getElementById(handle.getAttribute("aria-controls")!)!;

  expect(controlled.textContent).toBe("Lista");
});

test("o aria-label de quem chama pousa no no que tem papel, e nao numa div solta", () => {
  const { container } = withTheme(
    <Splitter
      aria-label="Divisória entre lista e detalhe"
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  const root = container.firstElementChild!.firstElementChild!;
  expect(root.getAttribute("aria-label")).toBeNull();
  expect(screen.getByRole("separator", { name: "Divisória entre lista e detalhe" })).toBeDefined();
});

test("o texto vira campo no clique e volta no Enter", () => {
  let saved = "";
  withTheme(
    <Editable
      value="Clínica São Lucas"
      label="Cliente"
      onValueChange={(next) => {
        saved = next;
      }}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente") as HTMLInputElement;

  fireEvent.change(field, { target: { value: "Clínica Aurora" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(saved).toBe("Clínica Aurora");
});

test("o Escape desfaz, e nao salva pela metade", () => {
  // Sair pela lateral e o gesto de quem se arrependeu: salvar ali transforma
  // um clique errado numa edicao que ninguem pediu.
  let saved = "sem mudanca";
  withTheme(
    <Editable
      value="Clínica São Lucas"
      label="Cliente"
      onValueChange={(next) => {
        saved = next;
      }}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente");

  fireEvent.change(field, { target: { value: "outra coisa" } });
  fireEvent.keyDown(field, { key: "Escape" });

  expect(saved).toBe("sem mudanca");
  expect(screen.getByRole("button", { name: /Clínica São Lucas/ })).toBeDefined();
});
