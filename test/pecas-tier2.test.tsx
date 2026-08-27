import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { PasswordInput } from "../src/components/password-input";
import { Tracker } from "../src/components/tracker";
import { TagsInput } from "../src/components/tags-input";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

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

/**
 * A faixa com `count` periodos, ja com a medida que o happy-dom nao da.
 *
 * Ele devolve 0x0 em `getBoundingClientRect`, e a faixa decide o periodo lido
 * por regra de tres sobre a largura - sem largura, o ponteiro nao le nada e o
 * teste passaria por engano, com a dica fechada.
 */
function tracker(count: number, dir: "ltr" | "rtl" = "ltr") {
  const view = render(
    <RivoProvider scope="local" dir={dir}>
      <Tracker
        label="Emissões por dia"
        data={Array.from({ length: count }, (_, index) => ({
          tone: "success" as const,
          label: `Dia ${index + 1}`,
        }))}
      />
    </RivoProvider>,
  );

  const track = screen.getByRole("group", { name: "Emissões por dia" });
  track.getBoundingClientRect = () => ({ left: 0, right: 100, width: 100 }) as DOMRect;

  return { ...view, track };
}

test("a dica e uma so, com cinco periodos ou com um ano deles", () => {
  // O motivo desta peca ter sido reescrita: cada quadrado montava a propria
  // raiz de Tooltip, entao um ano de emissoes montava 365 delas para que no
  // maximo uma aparecesse. O que se prova aqui e que o numero de paineis nao
  // acompanha mais o numero de pontos - so os quadrados acompanham.
  const semana = tracker(5);
  fireEvent.pointerMove(semana.track, { clientX: 50 });

  expect(semana.container.querySelectorAll("[data-rc-track]").length).toBe(5);
  expect(semana.container.querySelectorAll("[data-rc-track-cursor]").length).toBe(1);
  expect(document.querySelectorAll('[role="tooltip"]').length).toBe(1);
  semana.unmount();

  const ano = tracker(365);
  fireEvent.pointerMove(ano.track, { clientX: 50 });

  expect(ano.container.querySelectorAll("[data-rc-track]").length).toBe(365);
  expect(ano.container.querySelectorAll("[data-rc-track-cursor]").length).toBe(1);
  expect(document.querySelectorAll('[role="tooltip"]').length).toBe(1);
});

test("o ponteiro le o periodo que esta embaixo dele", () => {
  const { track } = tracker(10);

  fireEvent.pointerMove(track, { clientX: 25 });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 3");

  fireEvent.pointerMove(track, { clientX: 95 });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 10");
});

test("a dica segue o foco, e nao so o ponteiro", () => {
  // Antes da dica unica nenhum quadrado era focavel, e ler o texto exato de um
  // periodo era coisa de quem tem mouse.
  const { track } = tracker(4);
  expect(track.tabIndex).toBe(0);

  fireEvent.focus(track);
  // Comeca no periodo mais recente, que e o da direita.
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 4");
  // O teclado tambem fala: a dica e desenho, e desenho nao chega a quem ouve.
  expect(screen.getByRole("status").textContent).toBe("Dia 4");

  fireEvent.keyDown(track, { key: "ArrowLeft" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 3");
  expect(screen.getByRole("status").textContent).toBe("Dia 3");

  fireEvent.keyDown(track, { key: "Home" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 1");

  // Fechar no Escape sem devolver o foco a lugar nenhum: a dica cobre o que
  // esta embaixo dela, e quem esta no teclado precisa de um jeito de tira-la.
  fireEvent.keyDown(track, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).toBeNull();
});

test("em rtl o ponteiro le o periodo que esta embaixo do dedo, e nao o espelhado", () => {
  const { track } = tracker(10, "rtl");

  fireEvent.pointerMove(track, { clientX: 25 });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 8");

  fireEvent.pointerMove(track, { clientX: 95 });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 1");
});

test("em rtl a seta anda para o lado que a pessoa ve, e nao para o indice", () => {
  const { track } = tracker(4, "rtl");

  fireEvent.focus(track);
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 4");

  fireEvent.keyDown(track, { key: "ArrowRight" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 3");

  fireEvent.keyDown(track, { key: "ArrowLeft" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 4");

  fireEvent.keyDown(track, { key: "Home" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 1");
});

test("a faixa sem dado nao abre balao nenhum", () => {
  // O foco cai no periodo mais recente, e numa lista vazia esse indice e -1:
  // sem guarda, focar a faixa abriria uma dica com texto nenhum dentro.
  const { track } = tracker(0);

  fireEvent.focus(track);
  fireEvent.keyDown(track, { key: "ArrowLeft" });

  expect(screen.queryByRole("tooltip")).toBeNull();
});

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
