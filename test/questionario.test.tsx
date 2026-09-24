import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";

import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireFooter,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
  type QuestionnaireAnswers,
  type QuestionnaireProps,
} from "../src/components/questionnaire";
import { RivoProvider } from "../src/provider/rivo-provider";

type Extra = {
  onStatus?: (status: string) => void;
  disabledChannel?: boolean;
};

function Survey({ onStatus, disabledChannel, ...props }: Partial<QuestionnaireProps> & Extra) {
  return (
    <RivoProvider scope="local">
      <Questionnaire aria-label="Cadastro" {...props}>
        <QuestionnaireProgress />
        <QuestionnaireItem name="regime" required>
          <QuestionnaireTitle>Qual é o regime da empresa?</QuestionnaireTitle>
          <QuestionnaireDescription>Está no cartão do CNPJ.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="simples">Simples Nacional</QuestionnaireChoice>
            <QuestionnaireChoice value="presumido">Lucro Presumido</QuestionnaireChoice>
            <QuestionnaireChoice value="real">Lucro Real</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem
          name="canais"
          multiple
          disabled={disabledChannel}
          onStatusChange={onStatus}
        >
          <QuestionnaireTitle>Por onde a nota chega ao cliente?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="email">E-mail</QuestionnaireChoice>
            <QuestionnaireChoice value="whatsapp">WhatsApp</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireInput placeholder="Outro canal" />
        </QuestionnaireItem>
        <QuestionnaireItem name="obs">
          <QuestionnaireTitle>Algo mais?</QuestionnaireTitle>
          <QuestionnaireInput />
        </QuestionnaireItem>
        <QuestionnaireFooter>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireFooter>
      </Questionnaire>
    </RivoProvider>
  );
}

const items = (container: HTMLElement) =>
  [...container.querySelectorAll("fieldset")] as HTMLFieldSetElement[];

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");

const next = () => fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

test("mostra uma pergunta por vez: as outras ficam escondidas e inertes", () => {
  const { container } = render(<Survey />);
  const [first, second, third] = items(container);

  expect(items(container)).toHaveLength(3);
  expect(first!.hidden).toBe(false);
  expect(first!.hasAttribute("inert")).toBe(false);
  for (const other of [second!, third!]) {
    expect(other.hidden).toBe(true);
    expect(other.hasAttribute("inert")).toBe(true);
  }
});

test("a pergunta e um fieldset com legend, e a descricao a descreve", () => {
  const { container } = render(<Survey />);
  const first = items(container)[0]!;
  const legend = first.querySelector("legend")!;

  expect(first.firstElementChild).toBe(legend);
  expect(legend.textContent).toBe("Qual é o regime da empresa?");
  const description = screen.getByText("Está no cartão do CNPJ.");
  expect(first.getAttribute("aria-describedby")).toBe(description.id);
});

test("o progresso diz a posicao em texto e em valor", () => {
  render(<Survey />);
  const bar = screen.getByRole("progressbar");

  expect(screen.getByText("Pergunta 1 de 3")).toBeDefined();
  expect(bar.getAttribute("aria-valuenow")).toBe("33");
  expect(bar.getAttribute("aria-valuetext")).toBe("Pergunta 1 de 3");
});

test("as opcoes sao radio nativo com o nome do item, e cada uma tem atalho de letra", () => {
  render(<Survey />);
  const radios = screen.getAllByRole("radio") as HTMLInputElement[];

  expect(radios).toHaveLength(3);
  expect(radios.map((radio) => radio.name)).toEqual(["regime", "regime", "regime"]);
  expect(radios.map((radio) => radio.getAttribute("aria-keyshortcuts"))).toEqual(["A", "B", "C"]);
  expect(screen.getByRole("radio", { name: "Lucro Presumido" })).toBe(radios[1]!);
});

test("obrigatoria sem resposta nao avanca: mostra o erro, descreve o item e foca o primeiro controle", () => {
  const { container } = render(<Survey />);
  next();

  const first = items(container)[0]!;
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toBe("Responda esta pergunta para continuar.");
  expect(first.hidden).toBe(false);
  expect(first.dataset.invalid).toBe("");
  expect(first.getAttribute("aria-describedby")?.split(" ")).toContain(alert.id);
  expect(document.activeElement).toBe(screen.getAllByRole("radio")[0]!);
  expect(screen.getAllByRole("radio")[0]!.getAttribute("aria-invalid")).toBe("true");
});

test("responder limpa o erro, e avancar abre a proxima com o foco no primeiro controle", () => {
  const { container } = render(<Survey />);
  next();
  fireEvent.click(screen.getByRole("radio", { name: "Lucro Real" }));
  expect(screen.queryByRole("alert")).toBeNull();

  next();
  const [first, second] = items(container);
  expect(first!.hidden).toBe(true);
  expect(second!.hidden).toBe(false);
  expect(screen.getByText("Pergunta 2 de 3")).toBeDefined();
  expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: "E-mail" }));
});

test("o Pular some na obrigatoria e aparece na opcional", () => {
  render(<Survey />);
  expect(screen.queryByRole("button", { name: "Pular" })).toBeNull();
  expect((screen.getByRole("button", { name: "Voltar" }) as HTMLButtonElement).disabled).toBe(true);

  fireEvent.click(screen.getByRole("radio", { name: "Simples Nacional" }));
  next();
  expect(screen.getByRole("button", { name: "Pular" })).toBeDefined();
  expect((screen.getByRole("button", { name: "Voltar" }) as HTMLButtonElement).disabled).toBe(
    false,
  );
});

test("a opcional vale por resposta ou por pular: sem nenhum dos dois, o erro pede um deles", () => {
  const onStatus = mock((_status: string) => {});
  const { container } = render(<Survey onStatus={onStatus} />);
  fireEvent.click(screen.getByRole("radio", { name: "Simples Nacional" }));
  next();
  next();

  expect(screen.getByRole("alert").textContent).toBe("Responda ou pule esta pergunta.");
  expect(items(container)[1]!.hidden).toBe(false);

  fireEvent.click(screen.getByRole("checkbox", { name: "E-mail" }));
  expect(onStatus).toHaveBeenLastCalledWith("answered");
  expect(items(container)[1]!.dataset.status).toBe("answered");

  fireEvent.click(screen.getByRole("button", { name: "Pular" }));
  expect(onStatus).toHaveBeenLastCalledWith("skipped");
  const email = screen.getByRole("checkbox", { name: "E-mail", hidden: true }) as HTMLInputElement;
  expect(email.checked).toBe(false);
  expect(items(container)[2]!.hidden).toBe(false);
});

test("o atalho de letra marca a opcao da pergunta aberta, e para enquanto se digita", () => {
  const { container } = render(<Survey />);
  const form = container.querySelector("form")!;
  const presumido = screen.getByRole("radio", { name: "Lucro Presumido" }) as HTMLInputElement;

  fireEvent.keyDown(form, { key: "b" });
  expect(presumido.checked).toBe(true);
  expect(document.activeElement).toBe(presumido);

  next();
  const other = screen.getByRole("textbox", { name: "Outra resposta" });
  fireEvent.keyDown(other, { key: "a" });
  expect((screen.getByRole("checkbox", { name: "E-mail" }) as HTMLInputElement).checked).toBe(
    false,
  );

  fireEvent.keyDown(form, { key: "a" });
  expect((screen.getByRole("checkbox", { name: "E-mail" }) as HTMLInputElement).checked).toBe(true);
  fireEvent.keyDown(form, { key: "a" });
  expect((screen.getByRole("checkbox", { name: "E-mail" }) as HTMLInputElement).checked).toBe(
    false,
  );
});

test("com shortcuts numbers o atalho e o numero, e com false nao ha atalho", () => {
  const numbers = render(<Survey shortcuts="numbers" />);
  const radios = numbers.getAllByRole("radio") as HTMLInputElement[];
  expect(radios.map((radio) => radio.getAttribute("aria-keyshortcuts"))).toEqual(["1", "2", "3"]);
  fireEvent.keyDown(numbers.container.querySelector("form")!, { key: "3" });
  expect(radios[2]!.checked).toBe(true);
  numbers.unmount();

  const off = render(<Survey shortcuts={false} />);
  const plain = off.getAllByRole("radio") as HTMLInputElement[];
  expect(plain.every((radio) => !radio.hasAttribute("aria-keyshortcuts"))).toBe(true);
  expect(off.container.querySelector("kbd")).toBeNull();
  fireEvent.keyDown(off.container.querySelector("form")!, { key: "a" });
  expect(plain[0]!.checked).toBe(false);
});

test("Ctrl+Enter e Cmd+Enter validam e avancam", () => {
  const { container } = render(<Survey />);
  const form = container.querySelector("form")!;

  fireEvent.keyDown(form, { key: "Enter", ctrlKey: true });
  expect(screen.getByRole("alert")).toBeDefined();

  fireEvent.click(screen.getByRole("radio", { name: "Lucro Real" }));
  fireEvent.keyDown(form, { key: "Enter", metaKey: true });
  expect(items(container)[1]!.hidden).toBe(false);
  expect(screen.getByRole("button", { name: "Próxima" }).getAttribute("aria-keyshortcuts")).toBe(
    "Control+Enter Meta+Enter",
  );
});

test("o campo livre ao lado de opcao unica e a resposta outra: um apaga o outro", () => {
  render(
    <Questionnaire>
      <QuestionnaireItem name="como" required>
        <QuestionnaireTitle>Como nos conheceu?</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="busca">Busca</QuestionnaireChoice>
          <QuestionnaireChoice value="indicacao">Indicação</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireInput />
      </QuestionnaireItem>
    </Questionnaire>,
  );
  const search = screen.getByRole("radio", { name: "Busca" }) as HTMLInputElement;
  const other = screen.getByRole("textbox", { name: "Outra resposta" }) as HTMLInputElement;

  fireEvent.click(search);
  fireEvent.change(other, { target: { value: "Evento" } });
  expect(search.checked).toBe(false);

  fireEvent.click(search);
  expect(other.value).toBe("");
});

test("o campo livre sozinho leva o nome da pergunta", () => {
  render(
    <Questionnaire>
      <QuestionnaireItem name="obs">
        <QuestionnaireTitle>Algo mais?</QuestionnaireTitle>
        <QuestionnaireInput />
      </QuestionnaireItem>
    </Questionnaire>,
  );
  expect(screen.getByRole("textbox", { name: /Algo mais\?/ })).toBeDefined();
  expect(screen.getByText("Opcional")).toBeDefined();
});

test("o envio entrega as respostas e o FormData, e o item pulado fica ausente dos dois", () => {
  const onSubmit = mock((_answers: QuestionnaireAnswers, _data: FormData) => {});
  const { container } = render(<Survey onSubmit={onSubmit} />);

  fireEvent.click(screen.getByRole("radio", { name: "Lucro Presumido" }));
  next();
  fireEvent.click(screen.getByRole("checkbox", { name: "E-mail" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Outra resposta" }), {
    target: { value: "Correio" },
  });
  next();
  expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Pular" }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  const [answers, data] = onSubmit.mock.calls[0]!;
  expect(answers).toEqual({ regime: "presumido", canais: ["email", "Correio"] });
  expect(data.get("regime")).toBe("presumido");
  expect(data.getAll("canais")).toEqual(["email", "Correio"]);
  expect(data.has("obs")).toBe(false);
  expect(items(container)[2]!.dataset.status).toBe("skipped");
});

test("o Enviar valida tudo e volta para a primeira pergunta invalida", () => {
  const onSubmit = mock(() => {});
  const { container } = render(<Survey defaultItem="obs" onSubmit={onSubmit} />);
  expect(items(container)[2]!.hidden).toBe(false);

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Nada" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

  expect(onSubmit).not.toHaveBeenCalled();
  expect(items(container)[0]!.hidden).toBe(false);
  expect(screen.getByRole("alert").textContent).toBe("Responda esta pergunta para continuar.");
  expect(document.activeElement).toBe(screen.getAllByRole("radio")[0]!);
});

test("item desabilitado aparece, nao responde, nao trava e nao entra nas respostas", () => {
  const onSubmit = mock((_answers: QuestionnaireAnswers, _data: FormData) => {});
  const { container } = render(<Survey disabledChannel onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole("radio", { name: "Simples Nacional" }));
  next();

  const second = items(container)[1]!;
  expect(second.hidden).toBe(false);
  expect(second.disabled).toBe(true);
  expect((screen.getByRole("checkbox", { name: "E-mail" }) as HTMLInputElement).disabled).toBe(
    true,
  );
  fireEvent.keyDown(container.querySelector("form")!, { key: "a" });
  expect((screen.getByRole("checkbox", { name: "E-mail" }) as HTMLInputElement).checked).toBe(
    false,
  );

  next();
  expect(items(container)[2]!.hidden).toBe(false);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Nada" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
  expect(onSubmit.mock.calls[0]![0]).toEqual({ regime: "simples", obs: "Nada" });
});

test("controlado: item decide a pergunta aberta e onItemChange pede a troca", () => {
  const onItemChange = mock((_item: string) => {});

  function Controlled() {
    const [item, setItem] = useState("regime");
    return (
      <Survey
        item={item}
        onItemChange={(next) => {
          onItemChange(next);
          setItem(next);
        }}
      />
    );
  }

  const { container } = render(<Controlled />);
  fireEvent.click(screen.getByRole("radio", { name: "Lucro Real" }));
  next();
  expect(onItemChange).toHaveBeenCalledWith("canais");
  expect(items(container)[1]!.hidden).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
  expect(onItemChange).toHaveBeenLastCalledWith("regime");
  expect(items(container)[0]!.hidden).toBe(false);
});

test("controlado sem atender o pedido, a pergunta nao muda", () => {
  const { container } = render(<Survey item="regime" />);
  fireEvent.click(screen.getByRole("radio", { name: "Lucro Real" }));
  next();
  expect(items(container)[0]!.hidden).toBe(false);
});

test("a troca anima pela direcao, com os tokens de movimento e sem movimento no reduzido", () => {
  const { container } = render(<Survey />);
  const [first, second] = items(container);
  expect(tokens(first!)).not.toContain("motion-safe:animate-shift-in-next");

  fireEvent.click(screen.getByRole("radio", { name: "Lucro Real" }));
  next();
  expect(tokens(second!)).toContain("motion-safe:animate-shift-in-next");
  expect(tokens(second!)).toContain("motion-reduce:animate-none");

  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
  expect(tokens(first!)).toContain("motion-safe:animate-shift-in-previous");
  expect(tokens(first!)).not.toContain("motion-safe:animate-shift-in-next");
});

test("labels troca todos os textos", () => {
  render(
    <Survey
      labels={{
        progress: (current, total) => `${current}/${total}`,
        next: "Seguir",
        previous: "Anterior",
        required: "Obrigatória.",
      }}
    />,
  );
  expect(screen.getByText("1/3")).toBeDefined();
  expect(screen.getByRole("button", { name: "Anterior" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
  expect(screen.getByRole("alert").textContent).toBe("Obrigatória.");
});

test("o erro sem QuestionnaireError sai sozinho no fim do item", () => {
  render(
    <Questionnaire>
      <QuestionnaireItem name="a" required>
        <QuestionnaireTitle>Primeira</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="x">X</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="b">
        <QuestionnaireTitle>Segunda</QuestionnaireTitle>
        <QuestionnaireInput />
      </QuestionnaireItem>
      <QuestionnaireFooter>
        <QuestionnaireNext />
      </QuestionnaireFooter>
    </Questionnaire>,
  );
  next();
  const alert = screen.getByRole("alert");
  expect(alert.closest("fieldset")?.getAttribute("aria-describedby")).toBe(alert.id);
});

test("Enter no campo livre avanca, como o botao", () => {
  const onSubmit = mock(() => {});
  render(
    <Questionnaire onSubmit={onSubmit}>
      <QuestionnaireItem name="nome" required>
        <QuestionnaireTitle>Seu nome</QuestionnaireTitle>
        <QuestionnaireInput />
      </QuestionnaireItem>
    </Questionnaire>,
  );
  const input = screen.getByRole("textbox");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toBeDefined();

  fireEvent.change(input, { target: { value: "Ana" } });
  act(() => {
    fireEvent.keyDown(input, { key: "Enter" });
  });
  expect(onSubmit).toHaveBeenCalledWith({ nome: "Ana" }, expect.any(FormData));
});

test("parte fora do questionario reclama pelo nome", () => {
  const quiet = mock(() => {});
  const original = console.error;
  console.error = quiet;
  try {
    expect(() => render(<QuestionnaireTitle>Solta</QuestionnaireTitle>)).toThrow(
      "QuestionnaireTitle precisa estar dentro de <Questionnaire>.",
    );
  } finally {
    console.error = original;
  }
  expect(within(document.body).queryByText("Solta")).toBeNull();
});

test("pular com o campo livre CONTROLADO limpa a tela, o estado de quem controla e o envio", () => {
  const onSubmit = mock((_answers: QuestionnaireAnswers, _data: FormData) => {});
  function Controlled() {
    const [text, setText] = useState("");
    return (
      <Questionnaire onSubmit={onSubmit}>
        <QuestionnaireItem name="a">
          <QuestionnaireTitle>A?</QuestionnaireTitle>
          <QuestionnaireInput value={text} onChange={(event) => setText(event.target.value)} />
        </QuestionnaireItem>
        <QuestionnaireItem name="b">
          <QuestionnaireTitle>B?</QuestionnaireTitle>
          <QuestionnaireInput />
        </QuestionnaireItem>
        <QuestionnaireFooter>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireFooter>
        <output>{text}</output>
      </Questionnaire>
    );
  }
  const { container } = render(<Controlled />);
  const first = container.querySelectorAll("input")[0] as HTMLInputElement;

  fireEvent.change(first, { target: { value: "resposta" } });
  expect(screen.getByRole("status").textContent).toBe("resposta");

  fireEvent.click(screen.getByRole("button", { name: "Pular" }));
  expect(first.value).toBe("");
  expect(screen.getByRole("status").textContent).toBe("");

  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
  expect(first.value).toBe("");
  expect(items(container)[0]!.dataset.status).toBe("skipped");

  fireEvent.click(screen.getByRole("button", { name: "Pular" }));
  fireEvent.click(screen.getByRole("button", { name: "Pular" }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0]![0]).toEqual({});
});

test("marcar a opcao com o campo livre CONTROLADO ao lado limpa o estado de quem controla", () => {
  function Controlled() {
    const [text, setText] = useState("");
    return (
      <Questionnaire>
        <QuestionnaireItem name="como">
          <QuestionnaireTitle>Como nos conheceu?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="busca">Busca</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireInput value={text} onChange={(event) => setText(event.target.value)} />
        </QuestionnaireItem>
        <output>{text}</output>
      </Questionnaire>
    );
  }
  render(<Controlled />);
  const other = screen.getByRole("textbox", { name: "Outra resposta" }) as HTMLInputElement;

  fireEvent.change(other, { target: { value: "Evento" } });
  fireEvent.click(screen.getByRole("radio", { name: "Busca" }));
  expect(other.value).toBe("");
  expect(screen.getByRole("status").textContent).toBe("");
});

test("no servidor, a primeira pergunta ja sai aberta e com os botoes", () => {
  const survey = (props: Partial<QuestionnaireProps> = {}) =>
    renderToString(
      <Questionnaire {...props}>
        <QuestionnaireItem name="a">
          <QuestionnaireTitle>A?</QuestionnaireTitle>
          <QuestionnaireInput />
        </QuestionnaireItem>
        <QuestionnaireItem name="b">
          <QuestionnaireTitle>B?</QuestionnaireTitle>
          <QuestionnaireInput />
        </QuestionnaireItem>
        <QuestionnaireFooter>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireFooter>
      </Questionnaire>,
    );
  const open = (html: string) => {
    const page = document.createElement("div");
    page.innerHTML = html;
    return [...page.querySelectorAll("fieldset")]
      .filter((fieldset) => !fieldset.hidden)
      .map((fieldset) => fieldset.getAttribute("name"));
  };

  const plain = survey();
  expect(open(plain)).toEqual(["a"]);
  expect(plain).toContain("Próxima");
  expect(plain).toContain("Pular");
  expect(plain).not.toContain("Enviar");

  const last = survey({ defaultItem: "b" });
  expect(open(last)).toEqual(["b"]);
  expect(last).toContain("Enviar");
  expect(last).not.toContain("Próxima");

  expect(open(survey({ item: "b", onItemChange: () => {} }))).toEqual(["b"]);
});

test("o nome do campo livre da pergunta opcional separa o titulo do Opcional", () => {
  render(
    <Questionnaire>
      <QuestionnaireItem name="obs">
        <QuestionnaireTitle>Outra?</QuestionnaireTitle>
        <QuestionnaireInput />
      </QuestionnaireItem>
    </Questionnaire>,
  );
  expect(screen.getByRole("textbox", { name: /^Outra\?\s*,\s*Opcional$/ })).toBeDefined();
});

test("toda parte leva ao DOM o className de quem a chama", () => {
  const { container } = render(
    <Questionnaire className="c-root">
      <QuestionnaireProgress className="c-progress" />
      <QuestionnaireItem name="a" className="c-item">
        <QuestionnaireTitle className="c-title">Primeira</QuestionnaireTitle>
        <QuestionnaireDescription className="c-description">Ajuda</QuestionnaireDescription>
        <QuestionnaireChoices className="c-choices">
          <QuestionnaireChoice value="x" className="c-choice" classNames={{ key: "c-key" }}>
            X
          </QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireInput className="c-input" />
        <QuestionnaireError className="c-error" />
      </QuestionnaireItem>
      <QuestionnaireFooter className="c-footer">
        <QuestionnairePrevious className="c-previous" />
        <QuestionnaireSkip className="c-skip" />
        <QuestionnaireSubmit className="c-submit" />
      </QuestionnaireFooter>
    </Questionnaire>,
  );
  fireEvent.keyDown(container.querySelector("form")!, { key: "Enter", ctrlKey: true });

  const marks = [
    "root",
    "progress",
    "item",
    "title",
    "description",
    "choices",
    "choice",
    "key",
    "input",
    "error",
    "footer",
    "previous",
    "skip",
    "submit",
  ];
  expect(marks.filter((mark) => !container.querySelector(`.c-${mark}`))).toEqual([]);
});
