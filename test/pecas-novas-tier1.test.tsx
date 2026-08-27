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

test("copiar leva o valor e confirma no proprio botao", async () => {
  const written: string[] = [];
  // O happy-dom entrega um navigator.clipboard somente-leitura, entao a
  // dublagem entra por defineProperty em vez de atribuicao.
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (text: string) => void written.push(text) },
  });

  withTheme(<Clipboard value="35240612345678000199550010000048131234567890" />);
  const button = screen.getByRole("button", { name: "Copiar" });

  fireEvent.click(button);
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(written).toEqual(["35240612345678000199550010000048131234567890"]);
  // Copiar sem confirmacao nao existiu para quem nao ve o icone mudar: o
  // proprio nome do botao muda, e o leitor anuncia a mudanca.
  expect(screen.getByRole("button", { name: "Copiado" })).toBeDefined();
});

test("o texto copiado volta ao normal sozinho", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async () => {} },
  });

  withTheme(<Clipboard value="4813" timeout={10} />);
  fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
  await new Promise((resolve) => setTimeout(resolve, 30));

  expect(screen.getByRole("button", { name: "Copiar" })).toBeDefined();
});

const NOW = new Date("2026-08-25T12:00:00Z");

test("o tempo relativo escreve em portugues, com a data absoluta por tras", () => {
  const { container } = withTheme(
    <RelativeTime value={new Date("2026-08-25T11:58:00Z")} now={NOW} />,
  );
  const time = container.querySelector("time")!;

  expect(time.textContent).toBe("há 2 minutos");
  // A data exata continua alcancavel: o relativo e resumo, e resumo perde
  // informacao que as vezes e a que importa.
  expect(time.getAttribute("datetime")).toBe("2026-08-25T11:58:00.000Z");
  // O title leva a data por extenso, que e o que uma pessoa le em voz alta.
  expect(time.getAttribute("title")).toContain("25 de agosto de 2026");
});

test("o corte entre agora e ha um minuto e uma decisao, e nao um acaso", () => {
  const { container } = withTheme(
    <RelativeTime value={new Date("2026-08-25T11:59:30Z")} now={NOW} />,
  );

  expect(container.querySelector("time")!.textContent).toBe("agora");
});

test("passado o corte, ele mostra a data em vez de contar para sempre", () => {
  // "ha 412 dias" nao diz nada; a data diz.
  const { container } = withTheme(
    <RelativeTime value={new Date("2025-05-02T09:30:00Z")} now={NOW} cutoff="month" />,
  );

  expect(container.querySelector("time")!.textContent).toBe("02/05/2025");
});

test("o futuro tambem se escreve", () => {
  const { container } = withTheme(
    <RelativeTime value={new Date("2026-08-28T12:00:00Z")} now={NOW} />,
  );

  expect(container.querySelector("time")!.textContent).toBe("em 3 dias");
});

test("o codigo em linha sai num code, com a fonte mono do sistema", () => {
  const { container } = withTheme(<Code>npx rivocode-ui skill</Code>);
  const code = container.querySelector("code")!;

  expect(code.textContent).toBe("npx rivocode-ui skill");
  expect(code.className).toContain("font-mono");
});

test("o bloco rola sozinho, em vez de esticar a pagina", () => {
  // Painel de log e JSON na tela, e JSON nao quebra linha: sem rolagem
  // propria, a linha longa empurra a largura da pagina inteira.
  const { container } = withTheme(<CodeBlock>{'{ "numero": "4813" }'}</CodeBlock>);
  const pre = container.querySelector("pre")!;

  expect(pre.className).toContain("overflow-x-auto");
});

test("o bloco numera as linhas quando se pede", () => {
  withTheme(<CodeBlock lineNumbers>{"um\ndois\ntres"}</CodeBlock>);

  expect(screen.getByText("3")).toBeDefined();
});

test("a linha do tempo sai como lista ordenada, porque a ordem e o dado", () => {
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

test("o que ainda nao aconteceu nao se veste de acontecido", () => {
  // Preencher o marcador de um evento futuro faz a linha prometer que ele ja
  // ocorreu - o erro que uma trilha de auditoria nao pode cometer.
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
