import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Checkbox } from "../src/components/checkbox";
import { Radio, RadioGroup } from "../src/components/radio";
import { Switch } from "../src/components/switch";

function comTema(no: React.ReactNode) {
  return render(<RivoProvider scope="local">{no}</RivoProvider>);
}

/*
 * O texto passado como filho costumava sumir sem aviso: a caixa era so a
 * caixa, e quem escrevia `<Checkbox>Aceito</Checkbox>` via um quadradinho solto
 * na tela e nenhum erro em lugar nenhum. Estes testes existem para isso nao
 * voltar.
 */

test("a caixa com texto sai dentro de um label, e o clique no texto marca", () => {
  comTema(<Checkbox>ISS retido na fonte</Checkbox>);

  const caixa = screen.getByRole("checkbox", { name: "ISS retido na fonte" });
  expect(caixa.getAttribute("data-checked")).toBeNull();

  fireEvent.click(screen.getByText("ISS retido na fonte"));
  expect(screen.getByRole("checkbox").getAttribute("data-checked")).not.toBeNull();
});

test("sem texto ela continua sendo so a caixa, para quem monta o arranjo", () => {
  const { container } = comTema(<Checkbox aria-label="Marcar" />);
  expect(container.querySelector("label")).toBeNull();
});

test("o circulo com texto tambem marca pelo texto", () => {
  comTema(
    <RadioGroup defaultValue="produto">
      <Radio value="servico">Prestação de serviço</Radio>
      <Radio value="produto">Venda de produto</Radio>
    </RadioGroup>,
  );

  fireEvent.click(screen.getByText("Prestação de serviço"));
  expect(screen.getByRole("radio", { name: "Prestação de serviço" }).getAttribute("data-checked"))
    .not.toBeNull();
});

test("a chave com texto liga pelo texto", () => {
  comTema(<Switch>Enviar o XML junto com o PDF</Switch>);

  fireEvent.click(screen.getByText("Enviar o XML junto com o PDF"));
  expect(screen.getByRole("switch").getAttribute("data-checked")).not.toBeNull();
});
