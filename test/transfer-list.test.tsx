import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";

import {
  TransferList,
  type TransferListItem,
  type TransferListProps,
} from "../src/components/transfer-list";
import { RivoProvider } from "../src/provider/rivo-provider";
import {
  transferCount,
  transferMove,
  transferMoved,
  transferSides,
} from "../src/shared/transfer";

const ITEMS: TransferListItem[] = [
  { value: "sp", label: "São Paulo" },
  { value: "jp", label: "João Pessoa" },
  { value: "rec", label: "Recife" },
  { value: "nat", label: "Natal", disabled: true },
  { value: "for", label: "Fortaleza" },
];

function Controlled(props: Partial<TransferListProps> & { start?: string[] }) {
  const { start = [], onValueChange, ...rest } = props;
  const [value, setValue] = useState<string[]>(start);
  return (
    <RivoProvider scope="local">
      <TransferList
        items={ITEMS}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange?.(next);
        }}
        {...rest}
      />
    </RivoProvider>
  );
}

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");

function lists() {
  const [available, chosen] = screen.getAllByRole("listbox") as [HTMLElement, HTMLElement];
  return { available, chosen };
}

const labelsOf = (list: HTMLElement) =>
  within(list)
    .queryAllByRole("option")
    .map((option) => option.textContent);

const status = (container: HTMLElement) =>
  (container.querySelector("[role='status'][aria-live='polite']")?.textContent ?? "").trim();

test("as duas listas nascem do value, com o nome e a contagem de cada uma", () => {
  render(<Controlled start={["rec"]} />);
  const { available, chosen } = lists();

  expect(available.getAttribute("aria-multiselectable")).toBe("true");
  expect(labelsOf(available)).toEqual(["São Paulo", "João Pessoa", "Natal", "Fortaleza"]);
  expect(labelsOf(chosen)).toEqual(["Recife"]);

  const titleOf = (list: HTMLElement) =>
    document.getElementById(list.getAttribute("aria-labelledby") ?? "")?.textContent;
  expect(titleOf(available)).toBe("Disponíveis");
  expect(titleOf(chosen)).toBe("Escolhidos");

  const countOf = (list: HTMLElement) =>
    document.getElementById((list.getAttribute("aria-describedby") ?? "").split(" ")[0]!)
      ?.textContent;
  expect(countOf(available)).toBe("4 itens");
  expect(countOf(chosen)).toBe("1 item");
});

test("o lado escolhido segue a ordem do value, e o que entra vai para o fim na ordem de items", () => {
  const onValueChange = mock((_: string[]) => {});
  render(<Controlled start={["for", "sp"]} onValueChange={onValueChange} />);
  const { available, chosen } = lists();

  expect(labelsOf(chosen)).toEqual(["Fortaleza", "São Paulo"]);

  fireEvent.click(within(available).getByText("Recife"));
  fireEvent.click(within(available).getByText("João Pessoa"));
  fireEvent.click(screen.getByRole("button", { name: "Mover selecionados para Escolhidos" }));

  expect(onValueChange).toHaveBeenLastCalledWith(["for", "sp", "jp", "rec"]);
  expect(labelsOf(chosen)).toEqual(["Fortaleza", "São Paulo", "João Pessoa", "Recife"]);
});

test("marcar pelo clique diz aria-selected e muda a contagem, e o botao so acende com marcados", () => {
  render(<Controlled />);
  const { available } = lists();
  const moveSelected = screen.getByRole("button", { name: "Mover selecionados para Escolhidos" });

  expect((moveSelected as HTMLButtonElement).disabled).toBe(true);

  const option = within(available).getByText("Recife").closest("[role='option']")!;
  fireEvent.click(option);

  expect(option.getAttribute("aria-selected")).toBe("true");
  expect(tokens(option)).toContain("bg-selected");
  expect(within(available.parentElement!.parentElement!).getByText("1 de 5 selecionados")).toBeDefined();
  expect((moveSelected as HTMLButtonElement).disabled).toBe(false);

  fireEvent.click(option);
  expect(option.getAttribute("aria-selected")).toBe("false");
  expect(tokens(option)).not.toContain("bg-selected");
  expect((moveSelected as HTMLButtonElement).disabled).toBe(true);
});

test("duas marcas no mesmo lote de atualizacao ficam as duas marcadas", () => {
  render(<Controlled />);
  const { available } = lists();
  const options = within(available).getAllByRole("option");

  act(() => {
    options[0]!.click();
    options[2]!.click();
  });

  expect(options[0]!.getAttribute("aria-selected")).toBe("true");
  expect(options[2]!.getAttribute("aria-selected")).toBe("true");
});

test("mover anuncia em portugues, com o plural certo e o nome da lista de destino", () => {
  const { container } = render(<Controlled />);
  const { available, chosen } = lists();

  expect(status(container)).toBe("");

  fireEvent.click(within(available).getByText("Recife"));
  fireEvent.click(screen.getByRole("button", { name: "Mover selecionados para Escolhidos" }));
  expect(status(container)).toBe("1 item movido para Escolhidos");

  for (const name of ["São Paulo", "João Pessoa", "Fortaleza"]) {
    fireEvent.click(within(available).getByText(name));
  }
  fireEvent.click(screen.getByRole("button", { name: "Mover selecionados para Escolhidos" }));
  expect(status(container)).toBe("3 itens movidos para Escolhidos");

  fireEvent.click(screen.getByRole("button", { name: "Mover todos para Disponíveis" }));
  expect(status(container)).toBe("4 itens movidos para Disponíveis");
  expect(labelsOf(chosen)).toEqual([]);
});

test("o mesmo anuncio duas vezes seguidas muda o texto da regiao, para o leitor repetir", () => {
  const { container } = render(<Controlled />);
  const { available } = lists();
  const region = container.querySelector("[role='status']")!;

  fireEvent.click(within(available).getByText("Recife"));
  fireEvent.click(screen.getByRole("button", { name: "Mover selecionados para Escolhidos" }));
  const first = region.textContent;
  fireEvent.click(within(available).getByText("Fortaleza"));
  fireEvent.click(screen.getByRole("button", { name: "Mover selecionados para Escolhidos" }));

  expect(region.textContent?.trim()).toBe("1 item movido para Escolhidos");
  expect(region.textContent).not.toBe(first);
});

test("item desabilitado nao se marca e fica para tras no mover todos", () => {
  render(<Controlled />);
  const { available, chosen } = lists();
  const natal = within(available).getByText("Natal").closest("[role='option']")!;

  expect(natal.getAttribute("aria-disabled")).toBe("true");
  expect(tokens(natal)).toContain("text-fg-disabled");

  fireEvent.click(natal);
  expect(natal.getAttribute("aria-selected")).toBe("false");

  fireEvent.click(screen.getByRole("button", { name: "Mover todos para Escolhidos" }));
  expect(labelsOf(available)).toEqual(["Natal"]);
  expect(labelsOf(chosen)).toEqual(["São Paulo", "João Pessoa", "Recife", "Fortaleza"]);
  expect(
    (screen.getByRole("button", { name: "Mover todos para Escolhidos" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

test("a busca ignora acento e caixa, e o mover todos respeita o que ela deixou a mostra", () => {
  render(<Controlled />);
  const { available, chosen } = lists();
  const search = screen.getByRole("searchbox", { name: "Buscar em Disponíveis" });

  fireEvent.change(search, { target: { value: "SAO" } });
  expect(labelsOf(available)).toEqual(["São Paulo"]);

  fireEvent.change(search, { target: { value: "joao" } });
  expect(labelsOf(available)).toEqual(["João Pessoa"]);

  fireEvent.click(screen.getByRole("button", { name: "Mover todos para Escolhidos" }));
  expect(labelsOf(chosen)).toEqual(["João Pessoa"]);
});

test("busca sem resultado diz que nada foi achado, e lista vazia diz que nao ha item", () => {
  render(<Controlled start={ITEMS.map((item) => item.value)} />);
  const { available } = lists();

  expect(labelsOf(available)).toEqual([]);
  const described = (available.getAttribute("aria-describedby") ?? "").split(" ");
  expect(document.getElementById(described[1]!)?.textContent).toBe("Nenhum item");

  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar em Escolhidos" }), {
    target: { value: "manaus" },
  });
  const chosen = lists().chosen;
  const empty = (chosen.getAttribute("aria-describedby") ?? "").split(" ")[1]!;
  expect(document.getElementById(empty)?.textContent).toBe("Nada encontrado");
});

test("marcado que a busca escondeu nao e movido", () => {
  render(<Controlled />);
  const { available, chosen } = lists();
  const search = screen.getByRole("searchbox", { name: "Buscar em Disponíveis" });

  fireEvent.click(within(available).getByText("Recife"));
  fireEvent.change(search, { target: { value: "for" } });

  expect(
    (screen.getByRole("button", { name: "Mover selecionados para Escolhidos" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);

  fireEvent.click(within(available).getByText("Fortaleza"));
  fireEvent.click(screen.getByRole("button", { name: "Mover selecionados para Escolhidos" }));
  expect(labelsOf(chosen)).toEqual(["Fortaleza"]);
});

test("pelo teclado: setas andam, espaco marca, shift estende, ctrl+a marca tudo e Enter move", () => {
  const { container } = render(<Controlled />);
  const { available, chosen } = lists();
  const activeLabel = () =>
    document.getElementById(available.getAttribute("aria-activedescendant") ?? "")?.textContent;

  available.focus();
  expect(activeLabel()).toBe("São Paulo");

  fireEvent.keyDown(available, { key: "ArrowDown" });
  expect(activeLabel()).toBe("João Pessoa");

  fireEvent.keyDown(available, { key: " " });
  fireEvent.keyDown(available, { key: "ArrowDown", shiftKey: true });
  expect(activeLabel()).toBe("Recife");

  const selectedNow = () =>
    within(available)
      .getAllByRole("option")
      .filter((option) => option.getAttribute("aria-selected") === "true")
      .map((option) => option.textContent);
  expect(selectedNow()).toEqual(["João Pessoa", "Recife"]);

  fireEvent.keyDown(available, { key: "Escape" });
  expect(selectedNow()).toEqual([]);

  fireEvent.keyDown(available, { key: "a", ctrlKey: true });
  expect(selectedNow()).toEqual(["São Paulo", "João Pessoa", "Recife", "Fortaleza"]);

  fireEvent.keyDown(available, { key: "End" });
  expect(activeLabel()).toBe("Fortaleza");

  fireEvent.keyDown(available, { key: "Enter" });
  expect(labelsOf(chosen)).toEqual(["São Paulo", "João Pessoa", "Recife", "Fortaleza"]);
  expect(status(container)).toBe("4 itens movidos para Escolhidos");
  expect(document.activeElement).toBe(available);
  expect(activeLabel()).toBe("Natal");
});

test("seta para baixo na busca desce para a lista", () => {
  render(<Controlled />);
  const search = screen.getByRole("searchbox", { name: "Buscar em Disponíveis" });

  search.focus();
  fireEvent.keyDown(search, { key: "ArrowDown" });
  expect(document.activeElement).toBe(lists().available);
});

test("o botao que se apaga depois de mover entrega o foco a lista de destino", () => {
  render(<Controlled />);
  const moveAll = screen.getByRole("button", { name: "Mover todos para Escolhidos" });

  moveAll.focus();
  act(() => moveAll.click());

  expect((moveAll as HTMLButtonElement).disabled).toBe(true);
  expect(document.activeElement).toBe(lists().chosen);
});

test("desabilitada, nada marca, nada move e nenhuma lista entra no tab", () => {
  const onValueChange = mock((_: string[]) => {});
  render(<Controlled disabled onValueChange={onValueChange} />);
  const { available, chosen } = lists();

  expect(available.getAttribute("aria-disabled")).toBe("true");
  expect(available.tabIndex).toBe(-1);
  expect(chosen.tabIndex).toBe(-1);

  fireEvent.click(within(available).getByText("Recife"));
  fireEvent.keyDown(available, { key: "Enter" });
  expect(within(available).getByText("Recife").closest("[role='option']")!.getAttribute("aria-selected")).toBe("false");
  for (const button of screen.getAllByRole("button")) {
    expect((button as HTMLButtonElement).disabled).toBe(true);
  }
  expect(onValueChange).not.toHaveBeenCalled();
});

test("labels troca os nomes das listas, e o anuncio e os botoes acompanham", () => {
  const { container } = render(
    <Controlled labels={{ available: "Permissões", chosen: "Concedidas" }} searchable={false} />,
  );
  const { available } = lists();

  expect(screen.queryAllByRole("searchbox")).toHaveLength(0);
  fireEvent.click(within(available).getByText("Recife"));
  fireEvent.click(screen.getByRole("button", { name: "Mover selecionados para Concedidas" }));
  expect(status(container)).toBe("1 item movido para Concedidas");
});

test("classNames alcanca cada parte pelo nome", () => {
  render(
    <Controlled
      start={["rec"]}
      classNames={{
        panel: "rc-panel",
        header: "rc-header",
        search: "rc-search",
        list: "rc-list",
        option: "rc-option",
        actions: "rc-actions",
      }}
    />,
  );
  const { available, chosen } = lists();

  expect(tokens(available)).toContain("rc-list");
  expect(tokens(within(chosen).getByRole("option"))).toContain("rc-option");
  expect(document.querySelectorAll(".rc-panel")).toHaveLength(2);
  expect(document.querySelectorAll(".rc-header")).toHaveLength(2);
  expect(document.querySelectorAll(".rc-search")).toHaveLength(2);
  expect(document.querySelectorAll(".rc-actions")).toHaveLength(1);
});

test("as contas puras dizem o plural certo e nao movem o que esta desabilitado", () => {
  expect(transferCount(0, 1)).toBe("1 item");
  expect(transferCount(0, 1234)).toBe("1.234 itens");
  expect(transferCount(2, 10)).toBe("2 de 10 selecionados");
  expect(transferMoved(1, "Escolhidos")).toBe("1 item movido para Escolhidos");
  expect(transferMoved(3, "Escolhidos")).toBe("3 itens movidos para Escolhidos");

  expect(transferMove(ITEMS, [], ["nat", "sp"], "chosen")).toEqual(["sp"]);
  expect(transferMove(ITEMS, ["nat", "sp"], ["nat", "sp"], "available")).toEqual(["nat"]);
  expect(transferSides(ITEMS, ["sumiu", "jp"]).chosen.map((item) => item.value)).toEqual(["jp"]);
});

const MANY: TransferListItem[] = Array.from({ length: 5000 }, (_, index) => ({
  value: `k${index}`,
  label: `Cliente ${index}`,
}));

test("mover cinco mil itens de uma vez, ida e volta, nao cresce ao quadrado", () => {
  const keys = MANY.map((item) => item.value);
  const real = Array.prototype.includes;
  let scanned = 0;
  Array.prototype.includes = function (this: unknown[], ...args: Parameters<typeof real>) {
    if (this.length >= 1000) scanned += this.length;
    return real.apply(this, args);
  };
  try {
    for (let turn = 0; turn < 10; turn++) {
      const there = transferMove(MANY, [], keys, "chosen");
      expect(there).toHaveLength(5000);
      expect(transferMove(MANY, there, keys, "available")).toHaveLength(0);
    }
  } finally {
    Array.prototype.includes = real;
  }
  expect(scanned).toBeLessThan(500_000);
});

test("com mil e quinhentos itens, marcar tudo e mover tudo nao varre a lista de marcados por linha", () => {
  render(<Controlled items={MANY.slice(0, 1500)} searchable={false} />);
  const { available } = lists();
  const real = Array.prototype.includes;
  let scanned = 0;
  Array.prototype.includes = function (this: unknown[], ...args: Parameters<typeof real>) {
    if (this.length >= 1000) scanned += this.length;
    return real.apply(this, args);
  };
  try {
    fireEvent.keyDown(available, { key: "a", ctrlKey: true });
    for (let turn = 0; turn < 5; turn++) {
      fireEvent.click(within(available).getAllByRole("option")[turn * 7]!);
    }
    fireEvent.keyDown(available, { key: "Enter" });
  } finally {
    Array.prototype.includes = real;
  }
  expect(labelsOf(lists().chosen)).toHaveLength(1495);
  expect(scanned).toBeLessThan(500_000);
});
