import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Clipboard } from "../src/components/clipboard";
import { RelativeTime } from "../src/components/relative-time";
import { Code, CodeBlock } from "../src/components/code";
import { Timeline, TimelineItem } from "../src/components/timeline";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("copying takes the value and confirms on the button itself", async () => {
  const written: string[] = [];
  // happy-dom provides a read-only navigator.clipboard, so the stub goes in
  // through defineProperty instead of assignment.
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (text: string) => void written.push(text) },
  });

  withTheme(<Clipboard value="35240612345678000199550010000048131234567890" />);
  const button = screen.getByRole("button", { name: "Copiar" });

  fireEvent.click(button);
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(written).toEqual(["35240612345678000199550010000048131234567890"]);
  // Copying without confirmation did not exist for whoever cannot see the icon
  // change: the button name itself changes, and the reader announces it.
  expect(screen.getByRole("button", { name: "Copiado" })).toBeDefined();
});

test("the type refuses aria-label on Clipboard, and the name comes only from labels", () => {
  withTheme(
    // @ts-expect-error aria-label is out of the type; the name is labels.copy
    <Clipboard value="4813" aria-label="Outro" labels={{ copy: "Copiar CNPJ" }} />,
  );
  expect(screen.getByRole("button", { name: "Copiar CNPJ" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Outro" })).toBeNull();
});

test("the copied text goes back to normal on its own", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async () => {} },
  });

  withTheme(<Clipboard value="4813" timeout={10} />);
  fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
  await new Promise((resolve) => setTimeout(resolve, 30));

  expect(screen.getByRole("button", { name: "Copiar" })).toBeDefined();
});

const CHECK_INK = [
  ["primary", "text-accent-fg"],
  ["secondary", "text-success-text"],
  ["ghost", "text-success-text"],
  ["outline", "text-success-text"],
  ["danger", "text-danger-fg"],
] as const;

for (const [variant, ink] of CHECK_INK) {
  test(`the Clipboard ${variant} check mark comes out in ${ink}`, async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => {} },
    });

    const { container } = withTheme(<Clipboard value="4813" variant={variant} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    await screen.findByRole("button", { name: "Copiado" });

    const icon = container.querySelector("svg")!;
    const tokens = (icon.getAttribute("class") ?? "").split(" ");
    expect(tokens).toContain(ink);
    for (const [, other] of CHECK_INK) if (other !== ink) expect(tokens).not.toContain(other);
  });
}

const NOW = new Date("2026-08-25T12:00:00Z");

test("relative time writes in Portuguese, with the absolute date behind it", () => {
  const { container } = withTheme(
    <RelativeTime value={new Date("2026-08-25T11:58:00Z")} now={NOW} />,
  );
  const time = container.querySelector("time")!;

  expect(time.textContent).toBe("há 2 minutos");
  // The exact date stays reachable: the relative one is a summary, and a
  // summary loses information that is sometimes the one that matters.
  expect(time.getAttribute("datetime")).toBe("2026-08-25T11:58:00.000Z");
  // The title carries the spelled-out date, which is what a person reads aloud.
  expect(time.getAttribute("title")).toContain("25 de agosto de 2026");
});

test("the cutoff between now and a minute ago is a decision, and not an accident", () => {
  const { container } = withTheme(
    <RelativeTime value={new Date("2026-08-25T11:59:30Z")} now={NOW} />,
  );

  expect(container.querySelector("time")!.textContent).toBe("agora");
});

test("past the cutoff, it shows the date instead of counting forever", () => {
  // "ha 412 dias" says nothing; the date does.
  const { container } = withTheme(
    <RelativeTime value={new Date("2025-05-02T09:30:00Z")} now={NOW} cutoff="month" />,
  );

  expect(container.querySelector("time")!.textContent).toBe("02/05/2025");
});

test("the future is written too", () => {
  const { container } = withTheme(
    <RelativeTime value={new Date("2026-08-28T12:00:00Z")} now={NOW} />,
  );

  expect(container.querySelector("time")!.textContent).toBe("em 3 dias");
});

test("inline code renders in a code element, with the system mono font", () => {
  const { container } = withTheme(<Code>npx rivocode-ui skill</Code>);
  const code = container.querySelector("code")!;

  expect(code.textContent).toBe("npx rivocode-ui skill");
  expect(code.className).toContain("font-mono");
});

test("the block scrolls on its own, instead of stretching the page", () => {
  // Log panels and JSON on screen, and JSON does not wrap: without its own
  // scroll, the long line pushes the width of the whole page.
  const { container } = withTheme(<CodeBlock>{'{ "numero": "4813" }'}</CodeBlock>);
  const pre = container.querySelector("pre")!;

  expect(pre.className).toContain("overflow-x-auto");
});

test("the block that scrolls sideways is keyboard reachable, as a named region", () => {
  const view = withTheme(<CodeBlock>{"const nota = 4813;"}</CodeBlock>);
  const region = screen.getByRole("region", { name: "Bloco de código" });

  expect(region.tagName).toBe("PRE");
  expect(region.getAttribute("tabindex")).toBe("0");
  expect(region.className.split(" ")).toContain("focus-visible:ring-2");
  view.unmount();

  const titled = withTheme(<CodeBlock title="Entrada">{"{}"}</CodeBlock>);
  expect(screen.getByRole("region", { name: "Entrada" })).toBeDefined();
  titled.unmount();

  withTheme(<CodeBlock label="Resposta da SEFAZ">{"<xml />"}</CodeBlock>);
  expect(screen.getByRole("region", { name: "Resposta da SEFAZ" })).toBeDefined();
});

test("the block numbers the lines when asked", () => {
  withTheme(<CodeBlock lineNumbers>{"um\ndois\ntres"}</CodeBlock>);

  expect(screen.getByText("3")).toBeDefined();
});

test("the timeline renders as an ordered list, because the order is the data", () => {
  const { container } = withTheme(
    <Timeline>
      <TimelineItem title="Emitida" at="12:04" by="Ana" tone="accent" />
      <TimelineItem title="Autorizada" at="12:05" tone="success" />
      <TimelineItem title="Cancelada" at="14:20" by="Carlos" tone="danger">
        Motivo: dados do destinatário
      </TimelineItem>
      <TimelineItem title="Substituição" pending />
    </Timeline>,
  );

  expect(container.querySelector("ol")).not.toBeNull();
  expect(container.querySelectorAll("li").length).toBe(4);
  expect(screen.getByText(/dados do destinatário/)).toBeDefined();
});

test("what has not happened yet does not dress as happened", () => {
  // Filling the marker of a future event makes the line promise it already
  // happened - the mistake an audit trail cannot make.
  const { container } = withTheme(
    <Timeline>
      <TimelineItem title="Paga" tone="success" />
      <TimelineItem title="Baixa no banco" pending />
    </Timeline>,
  );

  const markers = container.querySelectorAll("li > span");
  expect(markers[0]!.className.split(" ")).toContain("bg-success");
  expect(markers[1]!.className).toContain("ring-border-strong");
});
