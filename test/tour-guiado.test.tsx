import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState, type ComponentProps } from "react";

import { Button } from "../src/components/button";
import { Tour, type TourStep } from "../src/components/tour";
import { RivoProvider } from "../src/provider/rivo-provider";

const STEPS: TourStep[] = [
  { target: "#novo", title: "Crie um cliente", description: "Comece pelo cadastro." },
  { target: "#busca", title: "Ache pelo CNPJ", description: "A busca aceita o número." },
  { target: "#exportar", title: "Exporte a lista", placement: "top" },
];

type Props = Partial<ComponentProps<typeof Tour>> & { withTargets?: string[] };

function Page({ withTargets = ["novo", "busca", "exportar"], ...props }: Props) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);

  return (
    <RivoProvider scope="local">
      <Button onClick={() => setOpen(true)}>Fazer o tour</Button>
      {withTargets.map((id) => (
        <button key={id} id={id} type="button">
          alvo {id}
        </button>
      ))}
      <Tour
        steps={STEPS}
        {...props}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
      />
    </RivoProvider>
  );
}

async function settle(ms = 40) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

function dialog() {
  return screen.getByRole("dialog");
}

function openTour() {
  fireEvent.click(screen.getByRole("button", { name: "Fazer o tour" }));
}

function mobile(on: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: on && query.includes("max-width: 639px"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

test("fechado, nada aparece: nem balao nem mascara", () => {
  render(<Page />);

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.querySelector("[data-tour-mask]")).toBeNull();
});

test("aberto, o balao se chama pelo titulo e se descreve pelo texto do passo", () => {
  render(<Page />);
  openTour();

  const popup = dialog();
  const title = document.getElementById(popup.getAttribute("aria-labelledby")!);
  const description = document.getElementById(popup.getAttribute("aria-describedby")!);
  expect(title?.textContent).toBe("Crie um cliente");
  expect(title?.tagName).toBe("H2");
  expect(description?.textContent).toBe("Comece pelo cadastro.");
});

test("passo sem descricao nao aponta aria-describedby para um no que nao existe", () => {
  render(<Page />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));

  expect(dialog().hasAttribute("aria-describedby")).toBe(false);
});

test("o contador diz em que passo se esta, e o primeiro passo nao tem Voltar", () => {
  render(<Page />);
  openTour();

  expect(dialog().textContent).toContain("Passo 1 de 3");
  expect(screen.queryByRole("button", { name: "Voltar" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));

  expect(dialog().textContent).toContain("Passo 2 de 3");
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Ache pelo CNPJ");
  expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
});

test("Voltar recua um passo e avisa quem escuta a troca", () => {
  const onStepChange = mock((_: number) => {});
  render(<Page onStepChange={onStepChange} />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

  expect(onStepChange.mock.calls.map(([step]) => step)).toEqual([1, 0]);
  expect(dialog().textContent).toContain("Passo 1 de 3");
});

test("no ultimo passo o botao principal vira Concluir, que fecha e chama onFinish", () => {
  const onFinish = mock(() => {});
  const onSkip = mock((_: number) => {});
  render(<Page onFinish={onFinish} onSkip={onSkip} />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));

  expect(screen.queryByRole("button", { name: "Próximo" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Concluir" }));

  expect(onFinish).toHaveBeenCalledTimes(1);
  expect(onSkip).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.querySelector("[data-tour-mask]")).toBeNull();
});

test("Pular tour fecha com o passo em que a pessoa desistiu, e nao conta como concluido", () => {
  const onFinish = mock(() => {});
  const onSkip = mock((_: number) => {});
  const onOpenChange = mock((_: boolean) => {});
  render(<Page onFinish={onFinish} onSkip={onSkip} onOpenChange={onOpenChange} />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  fireEvent.click(screen.getByRole("button", { name: "Pular tour" }));

  expect(onSkip).toHaveBeenCalledWith(1);
  expect(onFinish).not.toHaveBeenCalled();
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("Esc pula o tour", () => {
  const onSkip = mock((_: number) => {});
  render(<Page onSkip={onSkip} />);
  openTour();

  fireEvent.keyDown(dialog(), { key: "Escape" });

  expect(onSkip).toHaveBeenCalledWith(0);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("clicar na mascara nao fecha: o tour so sai por Pular, Esc ou Concluir", () => {
  const onSkip = mock((_: number) => {});
  render(<Page onSkip={onSkip} />);
  openTour();

  const mask = document.querySelector("[data-tour-mask]")!;
  const blocker = mask.querySelector(".pointer-events-auto")!;
  fireEvent.pointerDown(blocker);
  fireEvent.mouseDown(blocker);
  fireEvent.click(blocker);

  expect(onSkip).not.toHaveBeenCalled();
  expect(dialog()).toBeTruthy();
});

test("as setas andam entre os passos com o foco no balao", () => {
  render(<Page />);
  openTour();

  fireEvent.keyDown(dialog(), { key: "ArrowRight" });
  expect(dialog().textContent).toContain("Passo 2 de 3");

  fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
  expect(dialog().textContent).toContain("Passo 1 de 3");
});

test("o foco comeca no Proximo, e volta a quem abriu o tour quando ele acaba", async () => {
  render(<Page />);
  const opener = screen.getByRole("button", { name: "Fazer o tour" });
  opener.focus();
  openTour();
  await settle();

  expect(document.activeElement?.textContent).toBe("Próximo");

  fireEvent.click(screen.getByRole("button", { name: "Pular tour" }));
  await settle();

  expect(document.activeElement === opener).toBe(true);
});

test("recuar ate o primeiro passo some com o Voltar focado, e o foco cai no Proximo", async () => {
  render(<Page />);
  openTour();
  await settle();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  const back = screen.getByRole("button", { name: "Voltar" });
  back.focus();
  fireEvent.click(back);
  await settle();

  expect(document.activeElement?.textContent).toBe("Próximo");
});

test("a troca de passo e anunciada, e a abertura nao repete o que o dialogo ja diz", () => {
  render(<Page />);
  openTour();

  const status = dialog().querySelector("[role='status']")!;
  expect(status.textContent).toBe("");

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));

  expect(status.textContent).toBe("Passo 2 de 3. Ache pelo CNPJ");
});

test("alvo que nao existe pula o passo, com aviso em desenvolvimento", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  render(<Page withTargets={["novo", "exportar"]} />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));

  expect(dialog().textContent).toContain("Passo 3 de 3");
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Exporte a lista");
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain('"#busca"');
  warn.mockRestore();
});

test("recuando sobre um alvo que sumiu, o tour pula para tras e nao para frente", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  render(<Page withTargets={["novo", "exportar"]} defaultStep={2} />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

  expect(dialog().textContent).toContain("Passo 1 de 3");
  warn.mockRestore();
});

test("o primeiro alvo ausente abre o tour no primeiro que existe", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  render(<Page withTargets={["busca", "exportar"]} />);
  openTour();

  expect(dialog().textContent).toContain("Passo 2 de 3");
  warn.mockRestore();
});

test("sem nenhum alvo na pagina o tour fecha sozinho, sem chamar onFinish nem onSkip", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  const onFinish = mock(() => {});
  const onSkip = mock((_: number) => {});
  const onOpenChange = mock((_: boolean) => {});
  render(
    <Page withTargets={[]} onFinish={onFinish} onSkip={onSkip} onOpenChange={onOpenChange} />,
  );
  openTour();

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(onFinish).not.toHaveBeenCalled();
  expect(onSkip).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledTimes(3);
  warn.mockRestore();
});

test("o alvo pode vir por ref", () => {
  function WithRef() {
    const ref = useRef<HTMLButtonElement>(null);
    return (
      <RivoProvider scope="local">
        <button ref={ref} type="button">
          Salvar
        </button>
        <Tour defaultOpen steps={[{ target: ref, title: "Salve quando quiser" }]} />
      </RivoProvider>
    );
  }
  render(<WithRef />);

  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Salve quando quiser");
  expect(screen.getByRole("button", { name: "Concluir" })).toBeTruthy();
});

test("sem interactive, uma camada so cobre a tela inteira, alvo incluido", () => {
  render(<Page />);
  openTour();

  const blockers = document.querySelectorAll("[data-tour-mask] .pointer-events-auto");
  expect(blockers.length).toBe(1);
  expect((blockers[0] as HTMLElement).style.inset).toBe("0");
});

test("com interactive, quatro faixas cercam o recorte e deixam o alvo clicavel", () => {
  render(<Page interactive />);
  openTour();

  const blockers = document.querySelectorAll("[data-tour-mask] .pointer-events-auto");
  expect(blockers.length).toBe(4);
  const spotlight = document.querySelector<HTMLElement>("[data-tour-spotlight]")!;
  expect(spotlight.className.split(" ")).toContain("shadow-[0_0_0_200vmax_var(--rc-overlay)]");
});

test("a mascara empilha abaixo do balao, pelos tokens de z", () => {
  render(<Page />);
  openTour();

  const mask = document.querySelector<HTMLElement>("[data-tour-mask]")!;
  expect(mask.className.split(" ")).toContain("z-[var(--rc-z-overlay)]");
  const positioner = dialog().parentElement!;
  expect(positioner.className.split(" ")).toContain("z-[var(--rc-z-popover)]");
});

test("o alvo fora da vista rola para o centro, sem animacao quando o sistema pede", () => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  restore = () => {
    window.matchMedia = original;
  };

  render(<Page />);
  const target = document.getElementById("novo")!;
  const scroll = mock((_: ScrollIntoViewOptions) => {});
  target.scrollIntoView = scroll as unknown as typeof target.scrollIntoView;
  target.getBoundingClientRect = () =>
    ({ top: 2000, bottom: 2040, left: 0, right: 100, width: 100, height: 40 }) as DOMRect;
  openTour();

  expect(scroll).toHaveBeenCalledTimes(1);
  expect(scroll.mock.calls[0]?.[0]).toMatchObject({ block: "center", behavior: "auto" });
});

test("o alvo ja visivel nao rola a pagina", () => {
  render(<Page />);
  const target = document.getElementById("novo")!;
  const scroll = mock(() => {});
  target.scrollIntoView = scroll as unknown as typeof target.scrollIntoView;
  target.getBoundingClientRect = () =>
    ({ top: 10, bottom: 50, left: 0, right: 100, width: 100, height: 40 }) as DOMRect;
  openTour();

  expect(scroll).not.toHaveBeenCalled();
});

test("labels troca os textos dos botoes e do contador", () => {
  render(
    <Page
      labels={{
        next: "Next",
        skip: "Skip",
        counter: (position, total) => `${position}/${total}`,
      }}
    />,
  );
  openTour();

  expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
  expect(dialog().textContent).toContain("1/3");
});

test("reabrir sem controlar o passo recomeca do defaultStep", () => {
  render(<Page />);
  openTour();
  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  fireEvent.click(screen.getByRole("button", { name: "Pular tour" }));

  openTour();

  expect(dialog().textContent).toContain("Passo 1 de 3");
});

test("controlado, o passo e o do pai", () => {
  function Controlled() {
    const [step, setStep] = useState(1);
    return (
      <RivoProvider scope="local">
        <button id="novo" type="button">a</button>
        <button id="busca" type="button">b</button>
        <button id="exportar" type="button">c</button>
        <Tour defaultOpen steps={STEPS} step={step} onStepChange={setStep} />
        <output data-testid="passo">{step}</output>
      </RivoProvider>
    );
  }
  render(<Controlled />);

  expect(dialog().textContent).toContain("Passo 2 de 3");
  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  expect(screen.getByTestId("passo").textContent).toBe("2");
  expect(dialog().textContent).toContain("Passo 3 de 3");
});

test("no celular o balao vira folha de baixo, e a mascara continua destacando o alvo", () => {
  restore = mobile(true);
  render(<Page />);
  openTour();

  const popup = dialog();
  expect(popup.className.split(" ")).toContain("w-screen");
  expect(popup.className.split(" ")).toContain("rounded-t-xl");
  expect(document.querySelector("[data-tour-spotlight]")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Próximo" }).className.split(" ")).toContain(
    "h-[var(--rc-control-md)]",
  );
});

test("na mesa o balao e flutuante e os botoes sao os compactos", () => {
  render(<Page />);
  openTour();

  expect(dialog().className.split(" ")).not.toContain("w-screen");
  expect(screen.getByRole("button", { name: "Próximo" }).className.split(" ")).toContain(
    "h-[var(--rc-control-sm)]",
  );
});

function Vanishing() {
  const [show, setShow] = useState(true);
  return (
    <div>
      {show && (
        <button id="novo" type="button">
          alvo novo
        </button>
      )}
      <button type="button" onClick={() => setShow(false)}>
        sumir
      </button>
    </div>
  );
}

test("o alvo que some com o passo aberto pula o passo, sem o tour re-renderizar", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  render(
    <RivoProvider scope="local">
      <Vanishing />
      <button id="busca" type="button">
        alvo busca
      </button>
      <Tour defaultOpen steps={STEPS.slice(0, 2)} />
    </RivoProvider>,
  );
  await settle();
  expect(dialog().textContent).toContain("Passo 1 de 2");

  fireEvent.click(screen.getByText("sumir"));
  await settle();

  expect(dialog().textContent).toContain("Passo 2 de 2");
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Ache pelo CNPJ");
  expect(warn).toHaveBeenCalledTimes(1);
  warn.mockRestore();
});

test("as setas nao trocam de passo com o foco num campo posto em action", () => {
  const withField: TourStep[] = [
    { ...STEPS[0]!, action: <input aria-label="Apelido" /> },
    STEPS[1]!,
    STEPS[2]!,
  ];
  render(<Page steps={withField} />);
  openTour();

  const field = screen.getByLabelText("Apelido");
  field.focus();
  fireEvent.keyDown(field, { key: "ArrowRight" });
  expect(dialog().textContent).toContain("Passo 1 de 3");

  fireEvent.keyDown(dialog(), { key: "ArrowRight" });
  expect(dialog().textContent).toContain("Passo 2 de 3");
});

test("palavra longa sem espaco quebra dentro do balao, e nao vaza", () => {
  render(<Page />);
  openTour();
  expect(dialog().className.split(" ")).toContain("wrap-anywhere");
});
