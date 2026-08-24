import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { MaskedInput } from "../src/components/masked-input";
import { InputAction, InputGroup, InputPrefix } from "../src/components/input-group";
import { Item, ItemActions, ItemContent, ItemTitle } from "../src/components/item";
import { Breadcrumb } from "../src/components/breadcrumb";
import { Pagination } from "../src/components/pagination";

function comTema(no: React.ReactNode) {
  return render(<RivoProvider scope="local">{no}</RivoProvider>);
}

test("o campo com mascara pontua enquanto se digita", () => {
  comTema(<MaskedInput mask="cpf" placeholder="CPF" />);
  const campo = screen.getByPlaceholderText("CPF") as HTMLInputElement;
  fireEvent.change(campo, { target: { value: "12345678901" } });
  expect(campo.value).toBe("123.456.789-01");
});

test("quem escuta recebe o texto pontuado e o cru", () => {
  let mascarado = "";
  let cru = "";
  comTema(
    <MaskedInput
      mask="cnpj"
      placeholder="CNPJ"
      onValueChange={(m, c) => {
        mascarado = m;
        cru = c;
      }}
    />,
  );
  fireEvent.change(screen.getByPlaceholderText("CNPJ"), {
    target: { value: "12345678000199" },
  });
  expect(mascarado).toBe("12.345.678/0001-99");
  expect(cru).toBe("12345678000199");
});

test("o telefone troca de molde entre o fixo e o celular", () => {
  comTema(<MaskedInput mask="telefone" placeholder="Telefone" />);
  const campo = screen.getByPlaceholderText("Telefone") as HTMLInputElement;

  fireEvent.change(campo, { target: { value: "8332211234" } });
  expect(campo.value).toBe("(83) 3221-1234");

  fireEvent.change(campo, { target: { value: "83988112233" } });
  expect(campo.value).toBe("(83) 98811-2233");
});

test("o campo de dinheiro enche da direita para a esquerda", () => {
  comTema(<MaskedInput mask="moeda" placeholder="Valor" />);
  const campo = screen.getByPlaceholderText("Valor") as HTMLInputElement;
  fireEvent.change(campo, { target: { value: "123456" } });
  expect(campo.value).toBe("1.234,56");
});

test("o campo com mascara abre o teclado de numeros no celular", () => {
  comTema(<MaskedInput mask="cpf" placeholder="CPF" />);
  expect(screen.getByPlaceholderText("CPF").getAttribute("inputmode")).toBe("numeric");
});

test("a moldura de campo aceita encosto e botao", () => {
  let cliques = 0;
  comTema(
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
  comTema(
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

test("o caminho marca onde voce esta e nao deixa a ultima virar link", () => {
  comTema(
    <Breadcrumb
      items={[
        { label: "Inicio", href: "/" },
        { label: "Notas", href: "/notas" },
        { label: "4813" },
      ]}
    />,
  );
  const atual = screen.getByText("4813");
  expect(atual.getAttribute("aria-current")).toBe("page");
  expect(atual.tagName).not.toBe("A");
  expect(screen.getByText("Inicio").tagName).toBe("A");
});

test("caminho comprido dobra o meio em reticencia", () => {
  comTema(
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

test("a paginacao anda e trava nas pontas", () => {
  function Lista() {
    const [pagina, setPagina] = useState(1);
    return <Pagination page={pagina} pageCount={3} onPageChange={setPagina} />;
  }
  comTema(<Lista />);

  const anterior = screen.getByLabelText("Página anterior") as HTMLButtonElement;
  const proxima = screen.getByLabelText("Próxima página") as HTMLButtonElement;
  expect(anterior.disabled).toBe(true);

  fireEvent.click(proxima);
  expect(screen.getByLabelText("Página 2").getAttribute("aria-current")).toBe("page");

  fireEvent.click(proxima);
  expect((screen.getByLabelText("Próxima página") as HTMLButtonElement).disabled).toBe(true);
});

test("muitas paginas cabem na mesma largura, com reticencia", () => {
  comTema(<Pagination page={50} pageCount={100} onPageChange={() => {}} />);
  expect(screen.getAllByText("...")).toHaveLength(2);
  expect(screen.getByLabelText("Página 1")).toBeDefined();
  expect(screen.getByLabelText("Página 100")).toBeDefined();
  expect(screen.getByLabelText("Página 49")).toBeDefined();
});

test("a paginacao nao mostra reticencia quando so um numero foi pulado", () => {
  comTema(<Pagination page={4} pageCount={6} onPageChange={() => {}} />);
  expect(screen.queryByText("...")).toBeNull();
  expect(screen.getByLabelText("Página 2")).toBeDefined();
});
