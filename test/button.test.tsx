import { expect, test } from "bun:test";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/components/button";

test("renderiza o rotulo", () => {
  render(<Button>Falar no WhatsApp</Button>);
  expect(screen.getByRole("button", { name: "Falar no WhatsApp" })).toBeDefined();
});

test("a variante padrao e a primaria", () => {
  render(<Button>Enviar</Button>);
  expect(screen.getByRole("button").className).toContain("bg-accent");
});

test("a variante destrutiva usa o token de perigo, nunca um vermelho literal", () => {
  render(<Button variant="destructive">Excluir</Button>);
  const classes = screen.getByRole("button").className;
  expect(classes).toContain("bg-danger");
  expect(classes).not.toMatch(/#[0-9a-f]{3,6}/i);
});

test("a forma pilula troca o raio, e o padrao do produto nao e pilula", () => {
  const { rerender } = render(<Button>Padrao</Button>);
  expect(screen.getByRole("button").className).toContain("rounded-md");

  rerender(<Button shape="pill">Marketing</Button>);
  expect(screen.getByRole("button").className).toContain("rounded-pill");
});

test("o tamanho vem do token de densidade, nao de uma altura cravada", () => {
  render(<Button size="lg">Grande</Button>);
  expect(screen.getByRole("button").className).toContain("--rc-control-lg");
});

test("encaminha a ref para o elemento nativo", () => {
  const ref = createRef<HTMLButtonElement>();
  render(<Button ref={ref}>Ok</Button>);
  expect(ref.current?.tagName).toBe("BUTTON");
});

test("desabilitado nao dispara clique", () => {
  let cliques = 0;
  render(
    <Button
      disabled
      onClick={() => {
        cliques++;
      }}
    >
      Ok
    </Button>,
  );
  fireEvent.click(screen.getByRole("button"));
  expect(cliques).toBe(0);
});

test("carregando desabilita, anuncia ocupado e esconde o giro do leitor de tela", () => {
  render(<Button loading>Salvando</Button>);
  const botao = screen.getByRole("button");
  expect(botao.getAttribute("aria-busy")).toBe("true");
  expect((botao as HTMLButtonElement).disabled).toBe(true);
  expect(botao.querySelector('[aria-hidden="true"]')).not.toBeNull();
});

test("o tamanho de icone e quadrado, para o botao de acao da tabela", () => {
  render(
    <Button size="icon" aria-label="Mais acoes">
      .
    </Button>,
  );
  const classes = screen.getByRole("button", { name: "Mais acoes" }).className;
  expect(classes).toContain("size-[var(--rc-control-md)]");
  expect(classes).toContain("p-0");
});

test("o botao sabe virar link, porque metade dos botoes de um site e link", () => {
  render(
    <Button render={<a href="https://wa.me/55" />} shape="pill">
      Falar no WhatsApp
    </Button>,
  );
  const link = screen.getByRole("link", { name: "Falar no WhatsApp" });
  expect(link.tagName).toBe("A");
  expect(link.getAttribute("href")).toBe("https://wa.me/55");
  expect(link.className).toContain("rounded-pill");
});

test("o tamanho de chamada tem o peso de marketing, nao o de formulario", () => {
  render(<Button size="cta">Quero um diagnostico</Button>);
  const classes = screen.getByRole("button").className;
  expect(classes).toContain("font-bold");
  expect(classes).not.toContain("--rc-control-md");
});

test("a variante de contorno nao preenche, e engrossa a borda", () => {
  render(<Button variant="outline">Quero um diagnostico</Button>);
  const classes = screen.getByRole("button").className;
  expect(classes).toContain("border-2");
  expect(classes).toContain("bg-transparent");
});
