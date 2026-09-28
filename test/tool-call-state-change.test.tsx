import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ToolCall } from "../src/ai/index";
import { RivoProvider } from "../src/provider/rivo-provider";

const tree = (node: ReactNode) => <RivoProvider scope="local">{node}</RivoProvider>;
const trigger = () => screen.getByRole("button", { name: /buscar_notas/ });

test("a call that runs and then fails opens the panel and shows the error", () => {
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

test("a call without a body that starts asking for approval opens the panel with the input", () => {
  const view = render(tree(<ToolCall name="buscar_notas" status="pending" />));
  expect(screen.queryByRole("button", { name: /buscar_notas/ })).toBeNull();

  view.rerender(
    tree(<ToolCall name="buscar_notas" status="approval" input={{ cliente: "Clínica" }} />),
  );

  expect(trigger().getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText(/Clínica/)).toBeDefined();
});

test("closed by hand, the panel stays closed while the state does not change", () => {
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

test("controlled, changing state does not open the panel on its own", () => {
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
