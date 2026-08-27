import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { ColorPicker } from "../src/components/color-picker";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * A peca existe para escolher a cor de marca de um cliente, entao o que os
 * testes cobram e o que separa ela de um <input type="color">: o valor entra e
 * sai em hexadecimal, o campo de texto aceita o que a pessoa cola, e a grade
 * responde ao teclado dizendo qual amostra esta escolhida.
 */

const SWATCHES = ["#d4f34a", "#3ddc97", "#6aa9ff"];

function picker(
  props: Partial<React.ComponentProps<typeof ColorPicker>> = {},
  dir: "ltr" | "rtl" = "ltr",
) {
  return render(
    <RivoProvider scope="local" dir={dir}>
      <ColorPicker label="Cor da marca" swatches={SWATCHES} columns={3} {...props} />
    </RivoProvider>,
  );
}

test("cada amostra tem o valor no nome acessivel", () => {
  picker();
  for (const color of SWATCHES) {
    expect(screen.getByRole("radio", { name: new RegExp(color, "i") })).toBeTruthy();
  }
});

test("a amostra escolhida e dita, e nao so pintada", () => {
  picker({ value: "#3ddc97" });

  const chosen = screen.getByRole("radio", { name: /#3ddc97/i });
  expect(chosen.getAttribute("aria-checked")).toBe("true");

  const other = screen.getByRole("radio", { name: /#d4f34a/i });
  expect(other.getAttribute("aria-checked")).toBe("false");
});

test("clicar numa amostra avisa a cor em hexadecimal", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  fireEvent.click(screen.getByRole("radio", { name: /#6aa9ff/i }));
  expect(seen).toEqual(["#6aa9ff"]);
});

test("a seta anda pela grade e escolhe a amostra que recebeu o foco", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  const group = screen.getByRole("radiogroup");
  fireEvent.keyDown(group, { key: "ArrowRight" });
  expect(seen).toEqual(["#3ddc97"]);

  fireEvent.keyDown(group, { key: "End" });
  expect(seen).toEqual(["#3ddc97", "#6aa9ff"]);
});

test("em rtl a seta anda para o lado que a pessoa ve, e nao para o indice", () => {
  const seen: string[] = [];
  picker({ value: "#3ddc97", onValueChange: (color) => seen.push(color) }, "rtl");

  const group = screen.getByRole("radiogroup");
  fireEvent.keyDown(group, { key: "ArrowRight" });
  expect(seen).toEqual(["#d4f34a"]);

  fireEvent.keyDown(group, { key: "ArrowLeft" });
  expect(seen).toEqual(["#d4f34a", "#6aa9ff"]);

  fireEvent.keyDown(group, { key: "Home" });
  expect(seen).toEqual(["#d4f34a", "#6aa9ff", "#d4f34a"]);

  fireEvent.keyDown(group, { key: "End" });
  expect(seen).toEqual(["#d4f34a", "#6aa9ff", "#d4f34a", "#6aa9ff"]);
});

test("so a amostra escolhida entra na ordem de tabulacao", () => {
  picker({ value: "#3ddc97" });

  expect(screen.getByRole("radio", { name: /#3ddc97/i }).getAttribute("tabindex")).toBe("0");
  expect(screen.getByRole("radio", { name: /#d4f34a/i }).getAttribute("tabindex")).toBe("-1");
});

test("digitar um hexadecimal de tres digitos avisa o valor de seis", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  const field = screen.getByRole("textbox");
  fireEvent.change(field, { target: { value: "#0f8" } });
  expect(seen).toEqual(["#00ff88"]);
});

test("colar sem a cerquilha e em maiuscula tambem vale", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "  BFDD3A " } });
  expect(seen).toEqual(["#bfdd3a"]);
});

test("texto invalido nao avisa ninguem, e o campo volta ao valor bom ao sair", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  const field = screen.getByRole("textbox") as HTMLInputElement;
  fireEvent.change(field, { target: { value: "#zz" } });
  expect(seen).toEqual([]);
  expect(field.value).toBe("#zz");

  fireEvent.blur(field);
  expect(field.value).toBe("#d4f34a");
});

test("sem valor controlado a peca guarda a propria escolha", () => {
  picker({ value: undefined, defaultValue: "#d4f34a" });

  fireEvent.click(screen.getByRole("radio", { name: /#6aa9ff/i }));
  expect(screen.getByRole("radio", { name: /#6aa9ff/i }).getAttribute("aria-checked")).toBe("true");
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("#6aa9ff");
});

test("a amostra pinta o proprio valor, que e dado e nao decoracao", () => {
  picker();
  const swatch = screen.getByRole("radio", { name: /#d4f34a/i });
  expect(swatch.style.backgroundColor).toBeTruthy();
});

test("sem amostras proprias, a grade traz um leque de tons pronto", () => {
  render(
    <RivoProvider scope="local">
      <ColorPicker label="Cor da marca" />
    </RivoProvider>,
  );
  expect(screen.getAllByRole("radio").length).toBeGreaterThan(10);
});

test("a amostra com nome proprio anuncia o nome junto do valor", () => {
  picker({ swatches: [{ value: "#d4f34a", label: "Lima" }] });
  const swatch = screen.getByRole("radio", { name: /lima/i });
  expect(swatch.getAttribute("aria-label")).toContain("#d4f34a");
});
