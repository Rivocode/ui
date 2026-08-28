import { expect, test } from "bun:test";
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

test("o campo com mascara pontua enquanto se digita", () => {
  withTheme(<MaskedInput mask="cpf" placeholder="CPF" />);
  const field = screen.getByPlaceholderText("CPF") as HTMLInputElement;
  fireEvent.change(field, { target: { value: "12345678901" } });
  expect(field.value).toBe("123.456.789-01");
});

test("quem escuta recebe o texto pontuado e o cru", () => {
  let masked = "";
  let cru = "";
  withTheme(
    <MaskedInput
      mask="cnpj"
      placeholder="CNPJ"
      onValueChange={(m, c) => {
        masked = m;
        cru = c;
      }}
    />,
  );
  fireEvent.change(screen.getByPlaceholderText("CNPJ"), {
    target: { value: "12345678000199" },
  });
  expect(masked).toBe("12.345.678/0001-99");
  expect(cru).toBe("12345678000199");
});

test("o telefone troca de molde entre o fixo e o celular", () => {
  withTheme(<MaskedInput mask="telefone" placeholder="Telefone" />);
  const field = screen.getByPlaceholderText("Telefone") as HTMLInputElement;

  fireEvent.change(field, { target: { value: "8332211234" } });
  expect(field.value).toBe("(83) 3221-1234");

  fireEvent.change(field, { target: { value: "83988112233" } });
  expect(field.value).toBe("(83) 98811-2233");
});

test("o telefone fixo que chega pronto ja entra com o molde certo", () => {
  // Formulario de edicao chega preenchido do servidor, e era ai que aparecia:
  // o onChange escolhia o molde com phonePatternFor, e o estado inicial nao.
  // Saia "(83) 88112-233", com a pontuacao do celular num numero de oito
  // casas. E se corrigia sozinho na primeira tecla, o que torna dificil
  // reproduzir.
  withTheme(<MaskedInput mask="telefone" defaultValue="8388112233" placeholder="Telefone" />);
  const field = screen.getByPlaceholderText("Telefone") as HTMLInputElement;

  expect(field.value).toBe("(83) 8811-2233");
});

test("o celular que chega pronto continua com nove casas", () => {
  withTheme(<MaskedInput mask="telefone" defaultValue="83988112233" placeholder="Celular" />);
  const field = screen.getByPlaceholderText("Celular") as HTMLInputElement;

  expect(field.value).toBe("(83) 98811-2233");
});

test("o campo de dinheiro enche da direita para a esquerda", () => {
  withTheme(<MaskedInput mask="moeda" placeholder="Valor" />);
  const field = screen.getByPlaceholderText("Valor") as HTMLInputElement;
  fireEvent.change(field, { target: { value: "123456" } });
  expect(field.value).toBe("1.234,56");
});

test("o campo com mascara abre o teclado de numeros no celular", () => {
  withTheme(<MaskedInput mask="cpf" placeholder="CPF" />);
  expect(screen.getByPlaceholderText("CPF").getAttribute("inputmode")).toBe("numeric");
});

test("a moldura de campo aceita encosto e botao", () => {
  let cliques = 0;
  withTheme(
    <InputGroup>
      <InputPrefix>R$</InputPrefix>
      <MaskedInput mask="moeda" placeholder="Valor" />
      <InputAction aria-label="Limpar" onClick={() => (cliques += 1)}>
        x
      </InputAction>
    </InputGroup>,
  );
  expect(screen.getByText("R$")).toBeDefined();
  fireEvent.click(screen.getByLabelText("Limpar"));
  expect(cliques).toBe(1);
});

test("a linha de lista arruma media, texto e acao", () => {
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

test("a linha de lista vira link de verdade com render", () => {
  // O JSDoc mandava usar `render` junto com `interactive` e a prop nao
  // existia: quem seguiu a documentacao recebeu uma div com cor de passagem,
  // que o teclado nao alcanca.
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

test("o caminho marca onde voce esta e nao deixa a ultima virar link", () => {
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
  expect(screen.getByText("Inicio").tagName).toBe("A");
});

test("caminho comprido dobra o meio em reticencia", () => {
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

test("a migalha corta o texto numa caixa de bloco, senao o truncate nao faz nada", () => {
  withTheme(
    <Breadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Notas fiscais emitidas em janeiro de 2026", href: "/notas" },
        { label: "4813" },
      ]}
    />,
  );

  const caixas = [
    ["ancora", screen.getByText("Notas fiscais emitidas em janeiro de 2026")],
    ["texto", screen.getByText("4813")],
  ] as const;

  for (const [nome, node] of caixas) {
    const classes = node.className.split(" ");
    expect(`${nome}: ${classes.includes("truncate")}`).toBe(`${nome}: true`);
    expect(`${nome}: ${classes.includes("block")}`).toBe(`${nome}: true`);
  }
});

test("no celular o separador some junto com a migalha a esquerda dele", () => {
  const { container } = withTheme(
    <Breadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Notas", href: "/notas" },
        { label: "4813" },
      ]}
    />,
  );

  const separadores = [...container.querySelectorAll('li[aria-hidden="true"]')];
  expect(separadores.length).toBe(2);

  expect(separadores[0]!.className.split(" ")).toContain("max-sm:hidden");
  expect(separadores[1]!.className.split(" ")).not.toContain("max-sm:hidden");
});

test("a paginacao anda e trava nas pontas", () => {
  function List() {
    const [page, setPage] = useState(1);
    return <Pagination page={page} pageCount={3} onPageChange={setPage} />;
  }
  withTheme(<List />);

  const anterior = screen.getByLabelText("Página anterior") as HTMLButtonElement;
  const proxima = screen.getByLabelText("Próxima página") as HTMLButtonElement;
  expect(anterior.disabled).toBe(true);

  fireEvent.click(proxima);
  expect(screen.getByLabelText("Página 2").getAttribute("aria-current")).toBe("page");

  fireEvent.click(proxima);
  expect((screen.getByLabelText("Próxima página") as HTMLButtonElement).disabled).toBe(true);
});

test("muitas paginas cabem na mesma largura, com reticencia", () => {
  withTheme(<Pagination page={50} pageCount={100} onPageChange={() => {}} />);
  expect(screen.getAllByText("...")).toHaveLength(2);
  expect(screen.getByLabelText("Página 1")).toBeDefined();
  expect(screen.getByLabelText("Página 100")).toBeDefined();
  expect(screen.getByLabelText("Página 49")).toBeDefined();
});

test("a paginacao nao mostra reticencia quando so um numero foi pulado", () => {
  withTheme(<Pagination page={4} pageCount={6} onPageChange={() => {}} />);
  expect(screen.queryByText("...")).toBeNull();
  expect(screen.getByLabelText("Página 2")).toBeDefined();
});
