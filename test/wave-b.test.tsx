import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { MaskedInput } from "../src/components/masked-input";
import { InputAction, InputGroup, InputPrefix } from "../src/components/input-group";
import { Item, ItemActions, ItemContent, ItemTitle } from "../src/components/item";
import { Breadcrumb } from "../src/components/breadcrumb";
import { Pagination } from "../src/components/pagination";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("a masked field punctuates while typing", () => {
  withTheme(<MaskedInput mask="cpf" placeholder="CPF" />);
  const field = screen.getByPlaceholderText("CPF") as HTMLInputElement;
  fireEvent.change(field, { target: { value: "12345678901" } });
  expect(field.value).toBe("123.456.789-01");
});

test("the listener receives the punctuated text and the raw one", () => {
  let masked = "";
  let raw = "";
  withTheme(
    <MaskedInput
      mask="cnpj"
      placeholder="CNPJ"
      onValueChange={(m, c) => {
        masked = m;
        raw = c;
      }}
    />,
  );
  fireEvent.change(screen.getByPlaceholderText("CNPJ"), {
    target: { value: "12345678000199" },
  });
  expect(masked).toBe("12.345.678/0001-99");
  expect(raw).toBe("12345678000199");
});

test("an alphanumeric cnpj goes into the field, and the keyboard stops being numeric", () => {
  let raw = "";
  withTheme(
    <MaskedInput
      mask="cnpj"
      placeholder="CNPJ"
      onValueChange={(_, c) => {
        raw = c;
      }}
    />,
  );
  const field = screen.getByPlaceholderText("CNPJ") as HTMLInputElement;
  expect(field.getAttribute("inputmode")).toBeNull();

  fireEvent.change(field, { target: { value: "12abc34501de35" } });
  expect(field.value).toBe("12.ABC.345/01DE-35");
  expect(raw).toBe("12ABC34501DE35");
});

test("a hand-written pattern with * does not open the numeric keyboard", () => {
  withTheme(<MaskedInput mask="***-99" placeholder="Codigo" />);
  expect(screen.getByPlaceholderText("Codigo").getAttribute("inputmode")).toBeNull();
});

test("the cpf still opens the numeric keyboard", () => {
  withTheme(<MaskedInput mask="cpf" placeholder="CPF" />);
  expect(screen.getByPlaceholderText("CPF").getAttribute("inputmode")).toBe("numeric");
});

test("the phone switches pattern between landline and mobile", () => {
  withTheme(<MaskedInput mask="telefone" placeholder="Telefone" />);
  const field = screen.getByPlaceholderText("Telefone") as HTMLInputElement;

  fireEvent.change(field, { target: { value: "8332211234" } });
  expect(field.value).toBe("(83) 3221-1234");

  fireEvent.change(field, { target: { value: "83988112233" } });
  expect(field.value).toBe("(83) 98811-2233");
});

test("a landline that arrives prefilled starts with the right pattern", () => {
  // An edit form arrives prefilled from the server, and that is where it showed:
  // onChange picked the pattern with phonePatternFor, and the initial state did not.
  // It came out as "(83) 88112-233", with mobile punctuation on an eight-digit
  // number. And it fixed itself on the first keystroke, which makes it hard to
  // reproduce.
  withTheme(<MaskedInput mask="telefone" defaultValue="8388112233" placeholder="Telefone" />);
  const field = screen.getByPlaceholderText("Telefone") as HTMLInputElement;

  expect(field.value).toBe("(83) 8811-2233");
});

test("a mobile number that arrives prefilled keeps nine digits", () => {
  withTheme(<MaskedInput mask="telefone" defaultValue="83988112233" placeholder="Celular" />);
  const field = screen.getByPlaceholderText("Celular") as HTMLInputElement;

  expect(field.value).toBe("(83) 98811-2233");
});

test("the money field fills from right to left", () => {
  withTheme(<MaskedInput mask="moeda" placeholder="Valor" />);
  const field = screen.getByPlaceholderText("Valor") as HTMLInputElement;
  fireEvent.change(field, { target: { value: "123456" } });
  expect(field.value).toBe("1.234,56");
});

test("the raw money value is the digits on screen, with the leading zero", () => {
  const onValueChange = mock((_masked: string, _raw: string) => {});
  withTheme(<MaskedInput mask="moeda" placeholder="Valor" onValueChange={onValueChange} />);
  const field = screen.getByPlaceholderText("Valor") as HTMLInputElement;

  fireEvent.change(field, { target: { value: "5" } });
  expect(onValueChange).toHaveBeenLastCalledWith("0,05", "005");

  fireEvent.change(field, { target: { value: "1200" } });
  expect(onValueChange).toHaveBeenLastCalledWith("12,00", "1200");
});

test("a masked field opens the number keyboard on mobile", () => {
  withTheme(<MaskedInput mask="cpf" placeholder="CPF" />);
  expect(screen.getByPlaceholderText("CPF").getAttribute("inputmode")).toBe("numeric");
});

test("the field frame accepts an addon and a button", () => {
  let clicks = 0;
  withTheme(
    <InputGroup>
      <InputPrefix>R$</InputPrefix>
      <MaskedInput mask="moeda" placeholder="Valor" />
      <InputAction aria-label="Limpar" onClick={() => (clicks += 1)}>
        x
      </InputAction>
    </InputGroup>,
  );
  expect(screen.getByText("R$")).toBeDefined();
  fireEvent.click(screen.getByLabelText("Limpar"));
  expect(clicks).toBe(1);
});

test("the list row arranges media, text and action", () => {
  withTheme(
    <Item>
      <ItemContent>
        <ItemTitle>Nota 4813</ItemTitle>
      </ItemContent>
      <ItemActions>
        <button>Abrir</button>
      </ItemActions>
    </Item>,
  );
  expect(screen.getByText("Nota 4813")).toBeDefined();
  expect(screen.getByText("Abrir")).toBeDefined();
});

test("the list row becomes a real link with render", () => {
  // The JSDoc said to use `render` together with `interactive` and the prop did
  // not exist: whoever followed the documentation got a div with a hover color,
  // which the keyboard cannot reach.
  withTheme(
    <Item interactive render={<a href="/notas/4813" />}>
      <ItemContent>
        <ItemTitle>Nota 4813</ItemTitle>
      </ItemContent>
    </Item>,
  );

  const link = screen.getByRole("link", { name: "Nota 4813" });
  expect(link.getAttribute("href")).toBe("/notas/4813");
  expect(link.className).toContain("cursor-pointer");
});

test("the breadcrumb marks where you are and does not let the last one become a link", () => {
  withTheme(
    <Breadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Notas", href: "/notas" },
        { label: "4813" },
      ]}
    />,
  );
  const current = screen.getByText("4813");
  expect(current.getAttribute("aria-current")).toBe("page");
  expect(current.tagName).not.toBe("A");
  expect(screen.getByRole("link", { name: "Inicio" }).tagName).toBe("A");
});

test("a long breadcrumb folds the middle into an ellipsis", () => {
  withTheme(
    <Breadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Clientes", href: "/c" },
        { label: "Clinica", href: "/c/1" },
        { label: "Notas", href: "/c/1/n" },
        { label: "4813" },
      ]}
    />,
  );
  expect(screen.getByText("...")).toBeDefined();
  expect(screen.queryByText("Clientes")).toBeNull();
  expect(screen.getByText("Inicio")).toBeDefined();
  expect(screen.getByText("4813")).toBeDefined();
});

test("the crumb clips the text in a block box, otherwise truncate does nothing", () => {
  withTheme(
    <Breadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Notas fiscais emitidas em janeiro de 2026", href: "/notas" },
        { label: "4813" },
      ]}
    />,
  );

  const boxes = [
    ["anchor", screen.getByText("Notas fiscais emitidas em janeiro de 2026")],
    ["text", screen.getByText("4813")],
  ] as const;

  for (const [kind, node] of boxes) {
    const classes = node.className.split(" ");
    expect(`${kind}: ${classes.includes("truncate")}`).toBe(`${kind}: true`);
    expect(`${kind}: ${classes.includes("block")}`).toBe(`${kind}: true`);
  }
});

test("on mobile the separator disappears along with the crumb to its left", () => {
  const { container } = withTheme(
    <Breadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Notas", href: "/notas" },
        { label: "4813" },
      ]}
    />,
  );

  const separators = [...container.querySelectorAll('li[aria-hidden="true"]')];
  expect(separators.length).toBe(2);

  expect(separators[0]!.className.split(" ")).toContain("max-sm:hidden");
  expect(separators[1]!.className.split(" ")).not.toContain("max-sm:hidden");
});

test("pagination moves and locks at the ends", () => {
  function List() {
    const [page, setPage] = useState(1);
    return <Pagination page={page} pageCount={3} onPageChange={setPage} />;
  }
  withTheme(<List />);

  const previous = screen.getByLabelText("Página anterior") as HTMLButtonElement;
  const next = screen.getByLabelText("Próxima página") as HTMLButtonElement;
  expect(previous.disabled).toBe(true);

  fireEvent.click(next);
  expect(screen.getByLabelText("Página 2").getAttribute("aria-current")).toBe("page");

  fireEvent.click(next);
  expect((screen.getByLabelText("Próxima página") as HTMLButtonElement).disabled).toBe(true);
});

test("many pages fit in the same width, with an ellipsis", () => {
  withTheme(<Pagination page={50} pageCount={100} onPageChange={() => {}} />);
  expect(screen.getAllByText("...")).toHaveLength(2);
  expect(screen.getByLabelText("Página 1")).toBeDefined();
  expect(screen.getByLabelText("Página 100")).toBeDefined();
  expect(screen.getByLabelText("Página 49")).toBeDefined();
});

test("pagination shows no ellipsis when only one number was skipped", () => {
  withTheme(<Pagination page={4} pageCount={6} onPageChange={() => {}} />);
  expect(screen.queryByText("...")).toBeNull();
  expect(screen.getByLabelText("Página 2")).toBeDefined();
});
