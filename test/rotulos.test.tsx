import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Checkbox } from "../src/components/checkbox";
import { Radio, RadioGroup } from "../src/components/radio";
import { Switch } from "../src/components/switch";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/*
 * O texto passado como filho costumava sumir sem aviso: a caixa era so a
 * caixa, e quem escrevia `<Checkbox>Aceito</Checkbox>` via um quadradinho solto
 * na tela e nenhum erro em lugar nenhum. Estes testes existem para isso nao
 * voltar.
 */

test("a caixa com texto sai dentro de um label, e o clique no texto marca", () => {
  withTheme(<Checkbox>ISS retido na fonte</Checkbox>);

  const box = screen.getByRole("checkbox", { name: "ISS retido na fonte" });
  expect(box.getAttribute("data-checked")).toBeNull();

  fireEvent.click(screen.getByText("ISS retido na fonte"));
  expect(screen.getByRole("checkbox").getAttribute("data-checked")).not.toBeNull();
});

test("sem texto ela continua sendo so a caixa, para quem monta o arranjo", () => {
  const { container } = withTheme(<Checkbox aria-label="Marcar" />);
  expect(container.querySelector("label")).toBeNull();
});

test("o circulo com texto tambem marca pelo texto", () => {
  withTheme(
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
  withTheme(<Switch>Enviar o XML junto com o PDF</Switch>);

  fireEvent.click(screen.getByText("Enviar o XML junto com o PDF"));
  expect(screen.getByRole("switch").getAttribute("data-checked")).not.toBeNull();
});

/*
 * WCAG 1.4.11: o que identifica um controle precisa de 3:1 contra o fundo. Nos
 * tokens quem carrega essa promessa e o --rc-border-strong; --rc-border segue
 * sendo a divisoria decorativa, que nao identifica nada. Estes testes existem
 * para um campo nao voltar a se desenhar com a borda de divisoria.
 */

import { Input } from "../src/components/field";
import { InputGroup } from "../src/components/input-group";
import { SelectTrigger, Select } from "../src/components/select";

test("o campo se desenha com a fronteira de controle, e nao com a divisoria", () => {
  withTheme(<Input aria-label="Razao social" />);
  const field = screen.getByLabelText("Razao social");

  expect(field.className).toContain("border-border-strong");
});

test("a moldura de campo com encosto tambem", () => {
  withTheme(
    <InputGroup>
      <Input aria-label="Valor" />
    </InputGroup>,
  );
  // A moldura e quem desenha a borda; o campo dentro dela vai sem borda propria.
  const frame = screen.getByLabelText("Valor").parentElement!;

  expect(frame.className).toContain("border-border-strong");
});

test("o gatilho do select tambem", () => {
  withTheme(
    <Select>
      <SelectTrigger aria-label="Situacao" />
    </Select>,
  );

  expect(screen.getByLabelText("Situacao").className).toContain("border-border-strong");
});
