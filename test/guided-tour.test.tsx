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

test("closed, nothing shows: neither bubble nor mask", () => {
  render(<Page />);

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.querySelector("[data-tour-mask]")).toBeNull();
});

test("open, the bubble is named by the title and described by the step text", () => {
  render(<Page />);
  openTour();

  const popup = dialog();
  const title = document.getElementById(popup.getAttribute("aria-labelledby")!);
  const description = document.getElementById(popup.getAttribute("aria-describedby")!);
  expect(title?.textContent).toBe("Crie um cliente");
  expect(title?.tagName).toBe("H2");
  expect(description?.textContent).toBe("Comece pelo cadastro.");
});

test("a step without description does not point aria-describedby to a node that does not exist", () => {
  render(<Page />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));

  expect(dialog().hasAttribute("aria-describedby")).toBe(false);
});

test("the counter says which step you are on, and the first step has no Voltar", () => {
  render(<Page />);
  openTour();

  expect(dialog().textContent).toContain("Passo 1 de 3");
  expect(screen.queryByRole("button", { name: "Voltar" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));

  expect(dialog().textContent).toContain("Passo 2 de 3");
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Ache pelo CNPJ");
  expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
});

test("Voltar goes back one step and notifies whoever listens to the change", () => {
  const onStepChange = mock((_: number) => {});
  render(<Page onStepChange={onStepChange} />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

  expect(onStepChange.mock.calls.map(([step]) => step)).toEqual([1, 0]);
  expect(dialog().textContent).toContain("Passo 1 de 3");
});

test("on the last step the main button becomes Concluir, which closes and calls onFinish", () => {
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

test("Pular tour closes with the step where the person gave up, and does not count as finished", () => {
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

test("Esc skips the tour", () => {
  const onSkip = mock((_: number) => {});
  render(<Page onSkip={onSkip} />);
  openTour();

  fireEvent.keyDown(dialog(), { key: "Escape" });

  expect(onSkip).toHaveBeenCalledWith(0);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("clicking the mask does not close: the tour only leaves through Pular, Esc or Concluir", () => {
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

test("the arrows move between steps with focus on the bubble", () => {
  render(<Page />);
  openTour();

  fireEvent.keyDown(dialog(), { key: "ArrowRight" });
  expect(dialog().textContent).toContain("Passo 2 de 3");

  fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
  expect(dialog().textContent).toContain("Passo 1 de 3");
});

test("focus starts on Proximo, and returns to whoever opened the tour when it ends", async () => {
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

test("going back to the first step removes the focused Voltar, and focus falls on Proximo", async () => {
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

test("the step change is announced, and opening does not repeat what the dialog already says", () => {
  render(<Page />);
  openTour();

  const status = dialog().querySelector("[role='status']")!;
  expect(status.textContent).toBe("");

  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));

  expect(status.textContent).toBe("Passo 2 de 3. Ache pelo CNPJ");
});

test("a target that does not exist skips the step, with a warning in development", () => {
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

test("going back over a target that vanished, the tour skips backwards and not forwards", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  render(<Page withTargets={["novo", "exportar"]} defaultStep={2} />);
  openTour();

  fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

  expect(dialog().textContent).toContain("Passo 1 de 3");
  warn.mockRestore();
});

test("a missing first target opens the tour on the first one that exists", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  render(<Page withTargets={["busca", "exportar"]} />);
  openTour();

  expect(dialog().textContent).toContain("Passo 2 de 3");
  warn.mockRestore();
});

test("with no target on the page the tour closes on its own, calling neither onFinish nor onSkip", () => {
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

test("the target can come through a ref", () => {
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

test("without interactive, a single layer covers the whole screen, target included", () => {
  render(<Page />);
  openTour();

  const blockers = document.querySelectorAll("[data-tour-mask] .pointer-events-auto");
  expect(blockers.length).toBe(1);
  expect((blockers[0] as HTMLElement).style.inset).toBe("0");
});

test("with interactive, four strips surround the cutout and leave the target clickable", () => {
  render(<Page interactive />);
  openTour();

  const blockers = document.querySelectorAll("[data-tour-mask] .pointer-events-auto");
  expect(blockers.length).toBe(4);
  const spotlight = document.querySelector<HTMLElement>("[data-tour-spotlight]")!;
  expect(spotlight.className.split(" ")).toContain("shadow-[0_0_0_200vmax_var(--rc-overlay)]");
});

test("the mask stacks below the bubble, through the z tokens", () => {
  render(<Page />);
  openTour();

  const mask = document.querySelector<HTMLElement>("[data-tour-mask]")!;
  expect(mask.className.split(" ")).toContain("z-[var(--rc-z-overlay)]");
  const positioner = dialog().parentElement!;
  expect(positioner.className.split(" ")).toContain("z-[var(--rc-z-popover)]");
});

test("an off-screen target scrolls to the center, without animation when the system asks", () => {
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

test("an already visible target does not scroll the page", () => {
  render(<Page />);
  const target = document.getElementById("novo")!;
  const scroll = mock(() => {});
  target.scrollIntoView = scroll as unknown as typeof target.scrollIntoView;
  target.getBoundingClientRect = () =>
    ({ top: 10, bottom: 50, left: 0, right: 100, width: 100, height: 40 }) as DOMRect;
  openTour();

  expect(scroll).not.toHaveBeenCalled();
});

test("labels replaces the button and counter texts", () => {
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

test("reopening without controlling the step starts again from defaultStep", () => {
  render(<Page />);
  openTour();
  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  fireEvent.click(screen.getByRole("button", { name: "Pular tour" }));

  openTour();

  expect(dialog().textContent).toContain("Passo 1 de 3");
});

test("controlled, the step is the parent's", () => {
  function Controlled() {
    const [step, setStep] = useState(1);
    return (
      <RivoProvider scope="local">
        <button id="novo" type="button">a</button>
        <button id="busca" type="button">b</button>
        <button id="exportar" type="button">c</button>
        <Tour defaultOpen steps={STEPS} step={step} onStepChange={setStep} />
        <output data-testid="step">{step}</output>
      </RivoProvider>
    );
  }
  render(<Controlled />);

  expect(dialog().textContent).toContain("Passo 2 de 3");
  fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  expect(screen.getByTestId("step").textContent).toBe("2");
  expect(dialog().textContent).toContain("Passo 3 de 3");
});

test("on mobile the bubble becomes a bottom sheet, and the mask keeps highlighting the target", () => {
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

test("on desktop the bubble floats and the buttons are the compact ones", () => {
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

test("a target that vanishes with the step open skips the step, without the tour re-rendering", async () => {
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

test("the arrows do not change step with focus in a field placed in action", () => {
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

test("a long word without spaces breaks inside the bubble, and does not overflow", () => {
  render(<Page />);
  openTour();
  expect(dialog().className.split(" ")).toContain("wrap-anywhere");
});
