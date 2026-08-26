import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../src/components/tooltip";

function Example() {
  return (
    <Tooltip defaultOpen>
      <TooltipTrigger aria-label="Excluir">x</TooltipTrigger>
      <TooltipContent>Excluir nota</TooltipContent>
    </Tooltip>
  );
}

test("a dica aparece e diz o que o botao de icone faz", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByText("Excluir nota")).toBeDefined();
});

test("a dica nao precisa de provedor proprio, o RivoProvider ja carrega", () => {
  expect(() =>
    render(
      <RivoProvider>
        <Example />
      </RivoProvider>,
    ),
  ).not.toThrow();
});

test("a dica abre dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Example />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Excluir nota");
});

/* ---------------------------------------------------------------------------
 * A dica tambem para quem nao ve
 *
 * Medido com a dica aberta no navegador: `aria-describedby` no gatilho era
 * `null` e nao havia nenhum `[role=tooltip]` no documento - o popup existia,
 * com o texto dentro, e sem papel. A Base UI 1.7.0 nao faz essa fiacao por
 * decisao propria: a documentacao dela trata a dica como elemento visual e
 * manda rotular o gatilho. So que o alcance disso e maior do que a peca: o
 * `hint` do `Stat` e uma dica e existe so para explicar o numero, e a barra
 * lateral encolhida usa o mesmo mecanismo para dizer o nome de cada destino.
 *
 * O que estes testes nao alcancam: o happy-dom nao tem arvore de
 * acessibilidade, entao aqui se prova a fiacao no DOM - o papel no popup e o
 * `aria-describedby` do gatilho apontando para o `id` dele - e nao que o
 * leitor de tela leia a descricao junto com o nome.
 * ------------------------------------------------------------------------- */

test("a dica aberta se apresenta como dica e o gatilho aponta para ela", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );

  const tip = document.querySelector('[role="tooltip"]');
  expect(tip).not.toBeNull();
  expect(tip!.textContent).toBe("Excluir nota");

  const trigger = screen.getByRole("button", { name: "Excluir" });
  expect(tip!.id).not.toBe("");
  expect(trigger.getAttribute("aria-describedby")).toBe(tip!.id);
});

test("fechada, o gatilho nao aponta para um id que nao existe mais", () => {
  render(
    <RivoProvider>
      <Tooltip>
        <TooltipTrigger aria-label="Excluir">x</TooltipTrigger>
        <TooltipContent>Excluir nota</TooltipContent>
      </Tooltip>
    </RivoProvider>,
  );

  const trigger = screen.getByRole("button", { name: "Excluir" });
  expect(trigger.getAttribute("aria-describedby")).toBeNull();
});

test("o aria-describedby de quem chama continua valendo junto com o nosso", () => {
  render(
    <RivoProvider>
      <p id="ajuda">A nota some da listagem.</p>
      <Tooltip defaultOpen>
        <TooltipTrigger aria-label="Excluir" aria-describedby="ajuda">
          x
        </TooltipTrigger>
        <TooltipContent>Excluir nota</TooltipContent>
      </Tooltip>
    </RivoProvider>,
  );

  const tip = document.querySelector('[role="tooltip"]')!;
  const described = screen.getByRole("button", { name: "Excluir" }).getAttribute("aria-describedby");
  expect(described!.split(" ")).toEqual(["ajuda", tip.id]);
});
