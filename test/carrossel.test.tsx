import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { Carousel, type CarouselProps } from "../src/components/carousel";
import { RivoProvider } from "../src/provider/rivo-provider";

const PLANS = ["Básico", "Profissional", "Empresa", "Contador", "Franquia"];

function carousel(props: Partial<CarouselProps> = {}, count = PLANS.length) {
  return render(
    <RivoProvider scope="local">
      <Carousel label="Planos" {...props}>
        {PLANS.slice(0, count).map((plan) => (
          <div key={plan}>{plan}</div>
        ))}
      </Carousel>
    </RivoProvider>,
  );
}

const region = () => screen.getByRole("region", { name: "Planos" });
const viewport = () => region().querySelector<HTMLElement>("[tabindex='0']")!;
const next = () => screen.getByRole("button", { name: "Próximo slide" });
const previous = () => screen.getByRole("button", { name: "Slide anterior" });

const reducedMotion = (reduce: boolean) => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
};

const wait = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

test("a regiao se anuncia como carrossel e leva o nome do label", () => {
  carousel();
  expect(region().getAttribute("aria-roledescription")).toBe("carrossel");
});

test("cada filho vira um slide com o rotulo acentuado de posicao", () => {
  carousel();
  const slides = screen.getAllByRole("group");
  expect(slides).toHaveLength(5);
  expect(slides[1]!.getAttribute("aria-roledescription")).toBe("slide");
  expect(slides[1]!.getAttribute("aria-label")).toBe("Slide 2 de 5");
  expect(slides[1]!.textContent).toBe("Profissional");
});

test("proximo avanca um slide, e anterior nasce desabilitado no primeiro", () => {
  const onIndexChange = mock(() => {});
  carousel({ onIndexChange });

  expect((previous() as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(next());
  expect(onIndexChange).toHaveBeenLastCalledWith(1);
  expect(region().getAttribute("data-index")).toBe("1");
  expect((previous() as HTMLButtonElement).disabled).toBe(false);
});

test("no ultimo, proximo desabilita; com loop, ele volta ao primeiro", () => {
  const { unmount } = carousel({ defaultIndex: 4 });
  expect((next() as HTMLButtonElement).disabled).toBe(true);
  unmount();

  const onIndexChange = mock(() => {});
  carousel({ defaultIndex: 4, loop: true, onIndexChange });
  expect((next() as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(next());
  expect(onIndexChange).toHaveBeenLastCalledWith(0);
});

test("setas, Home e End movem quando o foco esta no carrossel", () => {
  carousel();
  fireEvent.keyDown(viewport(), { key: "ArrowRight" });
  expect(region().getAttribute("data-index")).toBe("1");
  fireEvent.keyDown(viewport(), { key: "End" });
  expect(region().getAttribute("data-index")).toBe("4");
  fireEvent.keyDown(viewport(), { key: "ArrowLeft" });
  expect(region().getAttribute("data-index")).toBe("3");
  fireEvent.keyDown(viewport(), { key: "Home" });
  expect(region().getAttribute("data-index")).toBe("0");
});

test("a seta dentro de um campo do slide e do campo, e nao do carrossel", () => {
  render(
    <RivoProvider scope="local">
      <Carousel label="Planos">
        <input aria-label="Cupom" />
        <div>Outro</div>
      </Carousel>
    </RivoProvider>,
  );
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Cupom" }), { key: "ArrowRight" });
  expect(region().getAttribute("data-index")).toBe("0");
});

test("controlado, o slide so muda quando quem controla muda", () => {
  const onIndexChange = mock(() => {});
  carousel({ index: 2, onIndexChange });
  fireEvent.click(next());
  expect(onIndexChange).toHaveBeenLastCalledWith(3);
  expect(region().getAttribute("data-index")).toBe("2");
});

test("controlado com estado, o index segue o pai", () => {
  function Controlled() {
    const [index, setIndex] = useState(0);
    return (
      <RivoProvider scope="local">
        <Carousel label="Planos" index={index} onIndexChange={setIndex}>
          {PLANS.map((plan) => (
            <div key={plan}>{plan}</div>
          ))}
        </Carousel>
      </RivoProvider>
    );
  }
  render(<Controlled />);
  fireEvent.click(next());
  fireEvent.click(next());
  expect(region().getAttribute("data-index")).toBe("2");
});

test("os indicadores sao opcionais, um por posicao, e marcam o atual", () => {
  const { unmount } = carousel();
  expect(screen.queryByRole("button", { name: /Ir para o slide/ })).toBeNull();
  unmount();

  carousel({ indicators: true });
  const dots = screen.getAllByRole("button", { name: /Ir para o slide/ });
  expect(dots).toHaveLength(5);
  expect(dots[0]!.getAttribute("aria-current")).toBe("true");
  expect(dots[0]!.getAttribute("aria-label")).toBe("Ir para o slide 1 de 5");

  fireEvent.click(dots[3]!);
  expect(region().getAttribute("data-index")).toBe("3");
  const after = screen.getAllByRole("button", { name: /Ir para o slide/ });
  expect(after[3]!.getAttribute("aria-current")).toBe("true");
  expect(after[0]!.getAttribute("aria-current")).toBeNull();

  const active = after[3]!.querySelector("span")!.className.split(" ");
  expect(active).toContain("bg-accent-text");
  expect(active).not.toContain("bg-border-strong");
});

test("controls={false} tira os botoes", () => {
  carousel({ controls: false });
  expect(screen.queryByRole("button", { name: "Próximo slide" })).toBeNull();
});

test("um slide so, ou nenhum, nao desenha controle nenhum", () => {
  const { unmount } = carousel({ indicators: true }, 1);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(viewport()).toBeNull();
  unmount();

  carousel({ indicators: true, autoplay: true }, 0);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(screen.queryAllByRole("group")).toHaveLength(0);
});

test("a regiao viva diz o slide da frente quando ele muda", () => {
  carousel();
  const live = region().querySelector("[aria-live]")!;
  expect(live.getAttribute("aria-live")).toBe("polite");
  fireEvent.click(next());
  expect(live.textContent).toBe("Slide 2 de 5");
});

test("sem autoplay, nada anda sozinho e nao ha botao de pausa", async () => {
  carousel();
  expect(screen.queryByRole("button", { name: /rotação/ })).toBeNull();
  await wait(60);
  expect(region().getAttribute("data-index")).toBe("0");
});

test("com autoplay, anda sozinho, cala a regiao viva e mostra a pausa", async () => {
  carousel({ autoplay: 20 });
  const live = region().querySelector("[aria-live]")!;
  expect(live.getAttribute("aria-live")).toBe("off");
  await wait(70);
  expect(Number(region().getAttribute("data-index"))).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole("button", { name: "Pausar a rotação" }));
  const paused = region().getAttribute("data-index");
  await wait(60);
  expect(region().getAttribute("data-index")).toBe(paused);
  expect(screen.getByRole("button", { name: "Retomar a rotação" })).toBeDefined();
  expect(live.getAttribute("aria-live")).toBe("polite");
});

test("o ponteiro em cima e o foco dentro param a rotacao", async () => {
  carousel({ autoplay: 20 });
  fireEvent.pointerEnter(region(), { pointerType: "mouse" });
  await wait(60);
  expect(region().getAttribute("data-index")).toBe("0");
  fireEvent.pointerLeave(region(), { pointerType: "mouse" });

  fireEvent.focus(viewport());
  await wait(60);
  expect(region().getAttribute("data-index")).toBe("0");
});

test("com reduzir movimento, a rotacao nao comeca, e a pausa oferece retomar", async () => {
  const restore = reducedMotion(true);
  try {
    carousel({ autoplay: 20 });
    await wait(60);
    expect(region().getAttribute("data-index")).toBe("0");
    expect(screen.getByRole("button", { name: "Retomar a rotação" })).toBeDefined();
  } finally {
    restore();
  }
});

test("slidesPerView responsivo escreve uma variavel por ponto, herdando do menor", () => {
  carousel({ slidesPerView: { base: 1, md: 3 } });
  const style = region().style;
  expect(style.getPropertyValue("--carousel-per-base")).toBe("1");
  expect(style.getPropertyValue("--carousel-per-sm")).toBe("1");
  expect(style.getPropertyValue("--carousel-per-md")).toBe("3");
  expect(style.getPropertyValue("--carousel-per-xl")).toBe("3");
});

test("slidesPerView auto deixa a largura com a classe do slide", () => {
  carousel({ slidesPerView: "auto", classNames: { slide: "w-64" } });
  const slide = screen.getAllByRole("group")[0]!.className.split(" ");
  expect(slide).toContain("w-64");
  expect(slide.some((token) => token.startsWith("basis-"))).toBe(false);
});

test("labels troca os textos que o leitor de tela ouve", () => {
  carousel({
    labels: { next: "Next", slide: (position, total) => `${position}/${total}` },
  });
  expect(screen.getByRole("button", { name: "Next" })).toBeDefined();
  expect(screen.getAllByRole("group")[0]!.getAttribute("aria-label")).toBe("1/5");
});
