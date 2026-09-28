import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RelativeTime } from "../src/components/relative-time";
import { Timeline, TimelineItem } from "../src/components/timeline";

test("data invalida sai como travessao, sem dateTime, sem title e sem derrubar a arvore", () => {
  const { container } = render(<RelativeTime value="ontem a tarde" />);

  const time = container.querySelector("time")!;
  expect(time.textContent).toBe("—");
  expect(time.hasAttribute("datetime")).toBe(false);
  expect(time.hasAttribute("title")).toBe(false);
});

test("NaN tambem sai como travessao, com o agora fixado", () => {
  const { container } = render(<RelativeTime value={Number.NaN} now={new Date(2026, 0, 1)} />);
  expect(container.querySelector("time")!.textContent).toBe("—");
});

test("o pendente e o tom sao ditos em texto, e nao so pintados", () => {
  render(
    <Timeline>
      <TimelineItem title="Boleto emitido" tone="success" />
      <TimelineItem title="Pagamento" pending />
      <TimelineItem title="Nota cancelada" tone="danger" labels={{ tone: { danger: "Falha" } }} />
      <TimelineItem title="Comentario" />
    </Timeline>,
  );

  expect(screen.getByText("Boleto emitido").textContent).toBe("Sucesso: Boleto emitido");
  expect(screen.getByText("Pagamento").textContent).toBe("Pendente: Pagamento");
  expect(screen.getByText("Nota cancelada").textContent).toBe("Falha: Nota cancelada");
  expect(screen.getByText("Comentario").textContent).toBe("Comentario");

  const hint = screen.getByText("Sucesso:", { exact: false });
  expect(hint.className.split(" ")).toContain("sr-only");
});

test("o fio da trilha se prende pelo lado logico, e acompanha o marcador no rtl", () => {
  const { container } = render(
    <Timeline>
      <TimelineItem title="Um" />
    </Timeline>,
  );

  const tokens = container.querySelector("li")!.className.split(" ");
  expect(tokens).toContain("before:start-[0.3125rem]");
  expect(tokens.some((token) => token.startsWith("before:left-"))).toBe(false);
});
