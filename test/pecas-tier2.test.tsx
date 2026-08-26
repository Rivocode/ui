import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { PasswordInput } from "../src/components/password-input";
import { Tracker } from "../src/components/tracker";
import { TagsInput } from "../src/components/tags-input";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/* --- PasswordInput ------------------------------------------------------ */

test("a senha comeca escondida e o olho a revela", () => {
  withTheme(<PasswordInput aria-label="Senha" defaultValue="segredo" />);
  const field = screen.getByLabelText("Senha") as HTMLInputElement;

  expect(field.type).toBe("password");

  fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(field.type).toBe("text");
  // O botao diz o que vai fazer, e nao o que esta acontecendo: quem le pelo
  // leitor de tela precisa saber qual e a acao, nao o estado.
  expect(screen.getByRole("button", { name: "Esconder senha" })).toBeDefined();
});

test("o campo de senha nao guarda o texto revelado ao perder o foco", () => {
  // Revelar e um gesto momentaneo: deixar a senha visivel na tela depois que a
  // pessoa saiu do campo e o que faz alguem ser lido por cima do ombro.
  withTheme(<PasswordInput aria-label="Senha" defaultValue="segredo" />);
  const field = screen.getByLabelText("Senha") as HTMLInputElement;

  fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(field.type).toBe("text");

  fireEvent.blur(field);
  expect(field.type).toBe("password");
});

/* --- Tracker ------------------------------------------------------------ */

test("a faixa conta o que aconteceu, um quadrado por periodo", () => {
  const { container } = withTheme(
    <Tracker
      label="Últimas 5 emissões"
      data={[
        { tone: "success", label: "4813 autorizada" },
        { tone: "success", label: "4814 autorizada" },
        { tone: "danger", label: "4815 rejeitada" },
        { tone: "warning", label: "4816 em fila" },
        { tone: "neutral", label: "sem emissão" },
      ]}
    />,
  );

  expect(container.querySelectorAll("[data-rc-track]").length).toBe(5);
  // Cada quadrado precisa dizer o que e: uma faixa de cor sem texto nao existe
  // para quem usa leitor de tela.
  expect(screen.getByText("4815 rejeitada")).toBeDefined();
});

/* --- TagsInput ---------------------------------------------------------- */

test("o texto vira ficha no Enter, e a ficha sai no proprio botao", () => {
  let current: string[] = ["nf-e"];
  function Controlled() {
    return (
      <TagsInput
        aria-label="Marcadores"
        value={current}
        onValueChange={(next) => {
          current = next;
        }}
      />
    );
  }

  withTheme(<Controlled />);
  const field = screen.getByLabelText("Marcadores");

  fireEvent.change(field, { target: { value: "urgente" } });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(current).toEqual(["nf-e", "urgente"]);
});

test("apagar com o campo vazio tira a ultima ficha", () => {
  // E o gesto que todo mundo tenta primeiro, e sem ele a pessoa vai com o
  // mouse ate o x de uma ficha que ela acabou de digitar.
  let current: string[] = ["nf-e", "urgente"];
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      value={current}
      onValueChange={(next) => {
        current = next;
      }}
    />,
  );

  fireEvent.keyDown(screen.getByLabelText("Marcadores"), { key: "Backspace" });
  expect(current).toEqual(["nf-e"]);
});

test("a ficha repetida nao entra duas vezes", () => {
  let current: string[] = ["nf-e"];
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      value={current}
      onValueChange={(next) => {
        current = next;
      }}
    />,
  );

  const field = screen.getByLabelText("Marcadores");
  fireEvent.change(field, { target: { value: "nf-e" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(current).toEqual(["nf-e"]);
});
