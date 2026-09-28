import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ToolCall } from "../src/ai/index";
import { RivoProvider } from "../src/provider/rivo-provider";

const tree = (node: ReactNode) => <RivoProvider scope="local">{node}</RivoProvider>;
const trigger = () => screen.getByRole("button", { name: /buscar_notas/ });

test("a chamada que roda e depois falha abre o painel e mostra o erro", () => {
  const view = render(tree(<ToolCall name="buscar_notas" status="running" input={{ mes: 8 }} />));
  expect(trigger().getAttribute("aria-expanded")).toBe("false");

  view.rerender(
    tree(
      <ToolCall
        name="buscar_notas"
        status="error"
        input={{ mes: 8 }}
        error="A prefeitura não respondeu."
      />,
    ),
  );

  expect(trigger().getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("A prefeitura não respondeu.")).toBeDefined();
});

test("a chamada sem corpo que passa a pedir aprovacao abre o painel com a entrada", () => {
  const view = render(tree(<ToolCall name="buscar_notas" status="pending" />));
  expect(screen.queryByRole("button", { name: /buscar_notas/ })).toBeNull();

  view.rerender(
    tree(<ToolCall name="buscar_notas" status="approval" input={{ cliente: "Clínica" }} />),
  );

  expect(trigger().getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText(/Clínica/)).toBeDefined();
});

test("fechado a mao, o painel continua fechado enquanto o estado nao muda", () => {
  const view = render(
    tree(<ToolCall name="buscar_notas" status="error" error="Falhou." input={{ mes: 8 }} />),
  );
  act(() => {
    fireEvent.click(trigger());
  });
  expect(trigger().getAttribute("aria-expanded")).toBe("false");

  view.rerender(
    tree(<ToolCall name="buscar_notas" status="error" error="Falhou de novo." input={{ mes: 8 }} />),
  );
  expect(trigger().getAttribute("aria-expanded")).toBe("false");
});

test("controlado, mudar de estado nao abre o painel por conta propria", () => {
  const onOpenChange = mock((open: boolean) => void open);
  const view = render(
    tree(
      <ToolCall
        name="buscar_notas"
        status="running"
        input={{ mes: 8 }}
        open={false}
        onOpenChange={onOpenChange}
      />,
    ),
  );
  view.rerender(
    tree(
      <ToolCall
        name="buscar_notas"
        status="error"
        error="Falhou."
        input={{ mes: 8 }}
        open={false}
        onOpenChange={onOpenChange}
      />,
    ),
  );
  expect(trigger().getAttribute("aria-expanded")).toBe("false");

  act(() => {
    fireEvent.click(trigger());
  });
  expect(onOpenChange).toHaveBeenLastCalledWith(true);
});
