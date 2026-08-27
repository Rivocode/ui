import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { FilterBar, FilterChip, type AppliedFilter } from "../src/components/filter-bar";

function reservedLine() {
  return screen.queryAllByText("Nenhum filtro aplicado").find((node) => node.tagName === "P");
}

const APPLIED: AppliedFilter[] = [
  { id: "status", label: "Situacao", value: "Em aberto" },
  { id: "customer", label: "Cliente", value: "Clinica Sao Lucas" },
];

test("a ficha mostra o campo e o valor, e o valor tem o peso", () => {
  render(<FilterChip label="Cliente" value="Clinica Sao Lucas" />);

  expect(screen.getByText("Cliente")).toBeDefined();
  expect(screen.getByText("Clinica Sao Lucas").className).toContain("font-medium");
});

test("o xis da ficha diz qual filtro sai, e nao so 'Remover'", () => {
  render(<FilterChip label="Cliente" value="Clinica Sao Lucas" onRemove={() => {}} />);

  expect(
    screen.getByRole("button", { name: "Remover filtro Cliente: Clinica Sao Lucas" }),
  ).toBeDefined();
});

test("valor que nao e texto cai para o nome do campo, porque de um no nao se le de volta", () => {
  render(<FilterChip label="Cliente" value={<em>Clinica</em>} onRemove={() => {}} />);

  expect(screen.getByRole("button", { name: "Remover filtro Cliente" })).toBeDefined();
});

test("o nome do xis se troca pelo labels.remove, como no TagsInput", () => {
  render(
    <FilterChip
      label="Emissao"
      value="01/08"
      labels={{ remove: (text) => `Tirar o filtro ${text}` }}
      onRemove={() => {}}
    />,
  );

  expect(screen.getByRole("button", { name: "Tirar o filtro Emissao: 01/08" })).toBeDefined();
});

test("sem onRemove a ficha nao tem xis, que e como se mostra filtro travado", () => {
  render(<FilterChip label="Filial" value="Matriz" />);

  expect(screen.queryByRole("button")).toBeNull();
});

test("o xis estica o alvo de toque por pseudo-elemento, sem engordar a pilula", () => {
  render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} />);
  const cross = screen.getByRole("button");

  expect(cross.className).toContain("relative");
  expect(cross.className).toContain("after:absolute");
  expect(cross.className).toContain("after:-inset-1.5");
});

test("o valor corta com reticencias e leva o texto inteiro no title", () => {
  const long = "Clinica Sao Lucas Servicos Medicos e Hospitalares Ltda";
  render(<FilterChip label="Cliente" value={long} />);
  const valueNode = screen.getByText(long);

  expect(valueNode.className).toContain("truncate");
  expect(valueNode.className).toContain("max-w-40");
  expect(valueNode.getAttribute("title")).toBe(long);
});

test("a ficha nao carrega cor literal nem tom de estado", () => {
  render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} />);
  const chip = screen.getByText("Cliente").parentElement!;

  expect(chip.className).not.toMatch(/#[0-9a-f]{3,6}|rgba?\(/i);
  expect(chip.className).not.toMatch(/bg-(success|warning|danger|info)/);
  expect(chip.className).toContain("rounded-pill");
});

test("a ficha desabilitada trava o xis, para o segundo toque nao repetir a consulta", () => {
  render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} disabled />);

  expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
});

test("a fileira sai como lista, com um item por filtro", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

  expect(screen.getByRole("list").getAttribute("role")).toBe("list");
  expect(screen.getAllByRole("listitem").length).toBe(2);
});

test("o xis avisa qual filtro saiu e entrega o que sobrou", () => {
  const left = mock();
  const rest = mock();
  render(<FilterBar filters={APPLIED} onRemove={left} onFiltersChange={rest} />);

  fireEvent.click(
    screen.getByRole("button", { name: "Remover filtro Cliente: Clinica Sao Lucas" }),
  );

  expect(left).toHaveBeenCalledWith(APPLIED[1]);
  expect(rest).toHaveBeenCalledWith([APPLIED[0]]);
});

test("a peca nao guarda lista propria: sem quem mude o estado, a ficha continua la", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

  fireEvent.click(
    screen.getByRole("button", { name: "Remover filtro Cliente: Clinica Sao Lucas" }),
  );

  expect(screen.getAllByRole("listitem").length).toBe(2);
});

test("filtro com removable false aparece sem xis", () => {
  render(
    <FilterBar
      filters={[{ id: "branch", label: "Filial", value: "Matriz", removable: false }, ...APPLIED]}
      onFiltersChange={() => {}}
    />,
  );

  expect(screen.getAllByRole("listitem").length).toBe(3);
  expect(screen.queryByRole("button", { name: /Filial/ })).toBeNull();
});

test("o limpar aparece a partir de dois filtros", () => {
  const { rerender } = render(<FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} />);
  expect(screen.queryByRole("button", { name: /Limpar/ })).toBeNull();

  rerender(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  expect(screen.getByRole("button", { name: "Limpar 2 filtros" })).toBeDefined();
});

test("clearFrom troca a regua, e com 1 o limpar fica desde o primeiro", () => {
  render(<FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} clearFrom={1} />);

  expect(screen.getByRole("button", { name: "Limpar 1 filtro" })).toBeDefined();
});

test("o limpar avisa antes e entrega a lista vazia depois", () => {
  const cleared = mock();
  const rest = mock();
  render(<FilterBar filters={APPLIED} onClear={cleared} onFiltersChange={rest} />);

  fireEvent.click(screen.getByRole("button", { name: "Limpar 2 filtros" }));

  expect(cleared).toHaveBeenCalled();
  expect(rest).toHaveBeenCalledWith([]);
});

test("sem quem escute, nao ha limpar nem xis: botao que nao faz nada e mentira", () => {
  render(<FilterBar filters={APPLIED} />);

  expect(screen.queryAllByRole("button").length).toBe(0);
});

test("a linha fica guardada quando nao ha filtro, para a tela nao pular no primeiro", () => {
  render(<FilterBar filters={[]} onFiltersChange={() => {}} />);
  const row = screen.getByRole("group", { name: "Filtros aplicados" });

  expect(row.className).toContain("min-h-[var(--rc-control-sm)]");
  expect(reservedLine()).toBeDefined();
});

test("a altura guardada vem do token de densidade, e nao de numero cravado", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  const row = screen.getByRole("group", { name: "Filtros aplicados" });

  expect(row.className).toContain("--rc-control-sm");
  expect(row.className).not.toMatch(/min-h-\[\d/);
});

test("reserve false some com a linha e mantem o aviso montado", () => {
  render(<FilterBar filters={[]} onFiltersChange={() => {}} reserve={false} />);
  const row = screen.getByRole("group", { name: "Filtros aplicados" });

  expect(row.className).not.toContain("min-h-[var(--rc-control-sm)]");
  expect(reservedLine()).toBeUndefined();
  expect(screen.getByRole("status").textContent).toBe("Nenhum filtro aplicado");
});

test("a contagem sai numa regiao viva, que e onde quem ouve fica sabendo que mudou", () => {
  const { rerender } = render(<FilterBar filters={[]} onFiltersChange={() => {}} />);
  expect(screen.getByRole("status").textContent).toBe("Nenhum filtro aplicado");

  rerender(<FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} />);
  expect(screen.getByRole("status").textContent).toBe("1 filtro aplicado");

  rerender(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  expect(screen.getByRole("status").textContent).toBe("2 filtros aplicados");
});

test("a linha guardada se esconde do leitor de tela, porque a regiao viva ja a diz", () => {
  render(<FilterBar filters={[]} onFiltersChange={() => {}} />);

  expect(reservedLine()!.getAttribute("aria-hidden")).toBe("true");
});

test("estreito, a fileira rola na horizontal e nenhuma ficha encolhe", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  const list = screen.getByRole("list");

  expect(list.className).toContain("overflow-x-auto");
  expect(list.className).not.toContain("flex-wrap");
  for (const item of screen.getAllByRole("listitem")) {
    expect(item.className).toContain("shrink-0");
  }
});

test("o limpar fica fora do trecho que rola, ancorado na ponta", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
  const clear = screen.getByRole("button", { name: "Limpar 2 filtros" });

  expect(clear.closest("ul")).toBeNull();
  expect(clear.className).toContain("shrink-0");
});

test("sem nenhum xis, o trecho que rola vira parada de tabulacao", () => {
  render(
    <FilterBar
      filters={APPLIED.map((each) => ({ ...each, removable: false }))}
      onFiltersChange={() => {}}
    />,
  );

  expect(screen.getByRole("list").getAttribute("tabindex")).toBe("0");
});

test("havendo xis, o trecho que rola nao acrescenta parada de tabulacao", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

  expect(screen.getByRole("list").hasAttribute("tabindex")).toBe(false);
});

test("desabilitada, a barra trava todos os xis e o limpar de uma vez", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} disabled />);

  for (const control of screen.getAllByRole("button")) {
    expect(control.hasAttribute("disabled")).toBe(true);
  }
});

test("desabilitada e sem xis alcancavel, o trecho que rola continua chegavel pelo teclado", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} disabled />);

  expect(screen.getByRole("list").getAttribute("tabindex")).toBe("0");
});

test("classNames veste cada parte, e nao a raiz", () => {
  render(
    <FilterBar
      filters={APPLIED}
      onFiltersChange={() => {}}
      classNames={{
        list: "list-x",
        item: "item-x",
        chip: "chip-x",
        clear: "clear-x",
      }}
    />,
  );

  expect(screen.getByRole("list").className).toContain("list-x");
  expect(screen.getAllByRole("listitem")[0]!.className).toContain("item-x");
  expect(screen.getByText("Situacao").parentElement!.className).toContain("chip-x");
  expect(screen.getByRole("button", { name: "Limpar 2 filtros" }).className).toContain("clear-x");
});

test("classNames veste tambem a linha guardada", () => {
  render(<FilterBar filters={[]} onFiltersChange={() => {}} classNames={{ empty: "vazio-x" }} />);

  expect(reservedLine()!.className).toContain("vazio-x");
});

test("as partes da ficha se vestem uma a uma", () => {
  render(
    <FilterChip
      label="Cliente"
      value="Acme"
      onRemove={() => {}}
      classNames={{ label: "rotulo-x", value: "value-x", remove: "cross-x" }}
    />,
  );

  expect(screen.getByText("Cliente").className).toContain("rotulo-x");
  expect(screen.getByText("Acme").className).toContain("value-x");
  expect(screen.getByRole("button").className).toContain("cross-x");
});

test("o size da barra desce para as fichas", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} size="sm" />);

  expect(screen.getByText("Situacao").parentElement!.className).toContain("h-5");
});

test("o nome da fileira se troca, para duas barras na mesma tela nao se confundirem", () => {
  render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} label="Filtros da fila" />);

  expect(screen.getByRole("group", { name: "Filtros da fila" })).toBeDefined();
});

test("os textos da barra se trocam por inteiro", () => {
  render(
    <FilterBar
      filters={APPLIED}
      onFiltersChange={() => {}}
      labels={{
        remove: (text) => `Tirar ${text}`,
        clear: (count) => `Zerar os ${count}`,
        status: (count) => `${count} recortes`,
      }}
    />,
  );

  expect(screen.getByRole("button", { name: "Tirar Situacao: Em aberto" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Zerar os 2" })).toBeDefined();
  expect(screen.getByRole("status").textContent).toBe("2 recortes");
});
