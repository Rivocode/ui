import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import { Heading } from "../src/components/heading";
import { Link } from "../src/components/link";
import { Text } from "../src/components/text";

const tokens = (element: Element) => element.className.split(" ");

describe("Heading", () => {
  test("o nivel decide a tag, e o leitor de tela ouve o nivel", () => {
    render(<Heading level={3}>Notas emitidas</Heading>);
    const heading = screen.getByRole("heading", { level: 3, name: "Notas emitidas" });

    expect(heading.tagName).toBe("H3");
  });

  test("o tamanho acompanha o nivel quando nao vem", () => {
    const cases = [
      [1, "text-2xl"],
      [2, "text-xl"],
      [3, "text-lg"],
      [4, "text-md"],
      [5, "text-base"],
      [6, "text-sm"],
    ] as const;

    for (const [level, size] of cases) {
      render(<Heading level={level}>{`Nivel ${level}`}</Heading>);
      expect(tokens(screen.getByRole("heading", { level }))).toContain(size);
    }
  });

  test("o tamanho muda sem mexer no nivel", () => {
    render(
      <Heading level={1} size="md">
        Faturamento
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading.tagName).toBe("H1");
    expect(tokens(heading)).toContain("text-md");
    expect(tokens(heading)).not.toContain("text-2xl");
  });

  test("veste a familia de titulo e a cor do texto", () => {
    render(<Heading level={2}>Clientes</Heading>);
    const heading = screen.getByRole("heading");

    expect(tokens(heading)).toContain("font-display");
    expect(tokens(heading)).toContain("text-fg");
  });

  test("truncate corta em uma linha", () => {
    render(
      <Heading level={2} truncate>
        Clínica São Lucas Serviços Médicos Ltda
      </Heading>,
    );

    expect(tokens(screen.getByRole("heading"))).toContain("truncate");
  });
});

describe("Text", () => {
  test("sai como paragrafo, e troca de elemento pelo render", () => {
    render(
      <Text>
        Emitida em <Text render={<span />}>12/08</Text>
      </Text>,
    );

    expect(screen.getByText(/Emitida em/).tagName).toBe("P");
    expect(screen.getByText("12/08").tagName).toBe("SPAN");
  });

  test("sem size, tone e weight nao pinta nada, e herda de quem cerca", () => {
    render(<Text>Herdado</Text>);
    const classes = tokens(screen.getByText("Herdado")).filter(Boolean);

    expect(classes.some((name) => name.startsWith("text-"))).toBe(false);
    expect(classes.some((name) => name.startsWith("font-"))).toBe(false);
  });

  test("o tom vira o papel de texto, e nunca o de preenchimento", () => {
    const cases = [
      ["neutral", "text-fg"],
      ["muted", "text-fg-muted"],
      ["subtle", "text-fg-subtle"],
      ["accent", "text-accent-text"],
      ["success", "text-success-text"],
      ["warning", "text-warning-text"],
      ["danger", "text-danger-text"],
      ["info", "text-info-text"],
    ] as const;

    for (const [tone, role] of cases) {
      render(<Text tone={tone}>{tone}</Text>);
      const classes = tokens(screen.getByText(tone));

      expect(classes).toContain(role);
      expect(classes).not.toContain(`text-${tone}`);
    }
  });

  test("corpo e peso saem da escala da casa", () => {
    render(
      <Text size="sm" weight="semibold">
        Total
      </Text>,
    );
    const classes = tokens(screen.getByText("Total"));

    expect(classes).toContain("text-sm");
    expect(classes).toContain("font-semibold");
  });

  test("truncate corta em uma linha, e lineClamp vence quando os dois vem", () => {
    render(<Text truncate>Uma linha</Text>);
    expect(tokens(screen.getByText("Uma linha"))).toContain("truncate");

    render(
      <Text truncate lineClamp={3}>
        Tres linhas
      </Text>,
    );
    const clamped = tokens(screen.getByText("Tres linhas"));

    expect(clamped).toContain("line-clamp-3");
    expect(clamped).not.toContain("truncate");
  });

  test("a classe de quem chama vence a do tom", () => {
    render(
      <Text tone="muted" className="text-fg">
        Por cima
      </Text>,
    );
    const classes = tokens(screen.getByText("Por cima"));

    expect(classes).toContain("text-fg");
    expect(classes).not.toContain("text-fg-muted");
  });
});

function RouterLink({ to, ...props }: ComponentProps<"a"> & { to: string }) {
  return <a {...props} href={to} data-router="sim" />;
}

describe("Link", () => {
  test("e ancora sublinhada no tom de acento", () => {
    render(<Link href="/notas">Ver notas</Link>);
    const link = screen.getByRole("link", { name: "Ver notas" });

    expect(link.getAttribute("href")).toBe("/notas");
    expect(tokens(link)).toContain("underline");
    expect(tokens(link)).toContain("text-accent-text");
    expect(link.getAttribute("target")).toBeNull();
  });

  test("tem foco visivel pelo anel, e nao pelo contorno do navegador", () => {
    render(<Link href="/notas">Foco</Link>);
    const classes = tokens(screen.getByRole("link"));

    expect(classes).toContain("focus-visible:ring-2");
    expect(classes).toContain("focus-visible:ring-ring");
    expect(classes).toContain("outline-none");
  });

  test("underline hover so sublinha ao passar", () => {
    render(
      <Link href="/ajuda" underline="hover" tone="muted">
        Ajuda
      </Link>,
    );
    const classes = tokens(screen.getByRole("link"));

    expect(classes).toContain("no-underline");
    expect(classes).toContain("hover:underline");
    expect(classes).not.toContain("underline");
    expect(classes).toContain("text-fg-muted");
  });

  test("inherit nao pinta cor nenhuma", () => {
    render(
      <Link href="/x" tone="inherit">
        Herdado
      </Link>,
    );
    const classes = tokens(screen.getByRole("link"));

    expect(classes.some((name) => /^text-(fg|accent)/.test(name))).toBe(false);
  });

  test("external abre em outra aba, com rel seguro e aviso para quem ouve", () => {
    render(
      <Link href="https://www.gov.br/nfse" external>
        Portal da NFS-e
      </Link>,
    );
    const link = screen.getByRole("link", { name: /Portal da NFS-e/ });

    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")?.split(" ")).toEqual(
      expect.arrayContaining(["noopener", "noreferrer"]),
    );
    expect(link.textContent).toContain("(abre em nova aba)");
    expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("external guarda o rel de quem chama e troca o aviso", () => {
    render(
      <Link href="https://exemplo.com" external rel="nofollow" externalLabel="(nova janela)">
        Parceiro
      </Link>,
    );
    const link = screen.getByRole("link");

    expect(link.getAttribute("rel")?.split(" ").sort()).toEqual([
      "nofollow",
      "noopener",
      "noreferrer",
    ]);
    expect(link.textContent).toContain("(nova janela)");
    expect(link.textContent).not.toContain("(abre em nova aba)");
  });

  test("sem external nao ha seta, nem aviso, nem aba nova", () => {
    render(<Link href="/notas">Interno</Link>);
    const link = screen.getByRole("link");

    expect(link.querySelector("svg")).toBeNull();
    expect(link.textContent).toBe("Interno");
    expect(link.getAttribute("rel")).toBeNull();
  });

  test("compoe com o link do router pelo render, e mantem o desenho", () => {
    render(<Link render={<RouterLink to="/clientes" />}>Clientes</Link>);
    const link = screen.getByRole("link", { name: "Clientes" });

    expect(link.getAttribute("data-router")).toBe("sim");
    expect(link.getAttribute("href")).toBe("/clientes");
    expect(tokens(link)).toContain("underline");
    expect(tokens(link)).toContain("text-accent-text");
  });
});
