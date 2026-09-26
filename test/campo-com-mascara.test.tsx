import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { MaskedInput } from "../src/components/masked-input";

function typeAt(input: HTMLInputElement, character: string) {
  const start = input.selectionStart ?? input.value.length;
  const next = input.value.slice(0, start) + character + input.value.slice(start);
  fireEvent.change(input, {
    target: { value: next, selectionStart: start + 1, selectionEnd: start + 1 },
  });
}

function eraseBefore(input: HTMLInputElement) {
  const start = input.selectionStart ?? input.value.length;
  const next = input.value.slice(0, start - 1) + input.value.slice(start);
  fireEvent.change(input, {
    target: { value: next, selectionStart: start - 1, selectionEnd: start - 1 },
  });
}

test("digitar no meio do cpf mantem o cursor logo depois do que foi digitado", () => {
  render(<MaskedInput aria-label="CPF" mask="cpf" defaultValue="123.456.78" />);
  const input = screen.getByLabelText("CPF") as HTMLInputElement;
  input.focus();
  input.setSelectionRange(1, 1);

  typeAt(input, "9");
  expect(input.value).toBe("192.345.678");
  expect(input.selectionStart).toBe(2);

  typeAt(input, "8");
  expect(input.value).toBe("198.234.567-8");
  expect(input.selectionStart).toBe(3);
});

test("o cursor tambem acompanha o campo controlado", () => {
  function Controlled() {
    const [value, setValue] = useState("123.456.78");
    return (
      <MaskedInput
        aria-label="CPF"
        mask="cpf"
        value={value}
        onValueChange={(masked) => setValue(masked)}
      />
    );
  }
  render(<Controlled />);
  const input = screen.getByLabelText("CPF") as HTMLInputElement;
  input.focus();
  input.setSelectionRange(3, 3);

  typeAt(input, "0");
  expect(input.value).toBe("123.045.678");
  expect(input.selectionStart).toBe(5);
});

test("apagar o telefone com backspace chega ao vazio, sem travar no fecha-parentese", () => {
  render(<MaskedInput aria-label="Telefone" mask="telefone" defaultValue="11" />);
  const input = screen.getByLabelText("Telefone") as HTMLInputElement;
  input.focus();
  typeAt(input, "9");
  expect(input.value).toBe("(11) 9");

  const seen: string[] = [];
  for (let step = 0; step < 10 && input.value !== ""; step += 1) {
    eraseBefore(input);
    seen.push(input.value);
  }
  expect(input.value).toBe("");
  expect(seen).toEqual(["(11) ", "(11)", "(11", "(1", "(", ""]);
});

test("o backspace logo depois de um literal apaga o digito anterior a ele, sem mandar o cursor para o fim", () => {
  const changes: string[] = [];
  render(
    <MaskedInput
      aria-label="Telefone"
      mask="telefone"
      defaultValue="11987654321"
      onValueChange={(_, raw) => changes.push(raw)}
    />,
  );
  const input = screen.getByLabelText("Telefone") as HTMLInputElement;
  input.focus();
  const afterHyphen = input.value.indexOf("-") + 1;
  input.setSelectionRange(afterHyphen, afterHyphen);

  fireEvent.keyDown(input, { key: "Backspace" });

  expect(changes.at(-1)).toBe("1198764321");
  expect(input.selectionStart).toBeLessThan(input.value.length);
  expect(input.value.slice(0, input.selectionStart!).replace(/\D/g, "")).toBe("119876");
});

test("o delete logo antes de um literal apaga o digito seguinte a ele", () => {
  const changes: string[] = [];
  render(
    <MaskedInput
      aria-label="CPF"
      mask="cpf"
      defaultValue="12345678901"
      onValueChange={(_, raw) => changes.push(raw)}
    />,
  );
  const input = screen.getByLabelText("CPF") as HTMLInputElement;
  input.focus();
  const beforeDot = input.value.indexOf(".");
  input.setSelectionRange(beforeDot, beforeDot);

  fireEvent.keyDown(input, { key: "Delete" });

  expect(changes.at(-1)).toBe("1235678901");
});
