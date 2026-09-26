import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/components/button";

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");

test("o botao como link desabilitado perde o href, se anuncia desabilitado e nao chama o onClick", () => {
  const onClick = mock(() => {});
  render(
    <Button render={<a href="/notas" />} disabled onClick={onClick}>
      Ver notas
    </Button>,
  );
  const link = screen.getByText("Ver notas").closest("a")!;

  expect(link.hasAttribute("href")).toBe(false);
  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(tokens(link)).toContain("pointer-events-none");

  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  link.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(onClick).not.toHaveBeenCalled();
});

test("o botao como link carregando tambem deixa de navegar", () => {
  const onClick = mock(() => {});
  render(
    <Button render={<a href="/notas" onClick={onClick} />} loading>
      Ver notas
    </Button>,
  );
  const link = screen.getByText("Ver notas").closest("a")!;

  expect(link.hasAttribute("href")).toBe(false);
  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(link.getAttribute("aria-busy")).toBe("true");
  fireEvent.click(link);
  expect(onClick).not.toHaveBeenCalled();
});

test("o botao como link habilitado continua navegando e chamando o onClick", () => {
  const onClick = mock(() => {});
  render(
    <Button render={<a href="/notas" />} onClick={onClick}>
      Ver notas
    </Button>,
  );
  const link = screen.getByText("Ver notas").closest("a")!;

  expect(link.getAttribute("href")).toBe("/notas");
  expect(link.hasAttribute("aria-disabled")).toBe(false);
  expect(tokens(link)).not.toContain("pointer-events-none");
  fireEvent.click(link);
  expect(onClick).toHaveBeenCalledTimes(1);
});
