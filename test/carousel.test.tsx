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

test("the region announces itself as a carousel and takes the label as its name", () => {
  carousel();
  expect(region().getAttribute("aria-roledescription")).toBe("carrossel");
});

test("each child becomes a slide with the accented position label", () => {
  carousel();
  const slides = screen.getAllByRole("group");
  expect(slides).toHaveLength(5);
  expect(slides[1]!.getAttribute("aria-roledescription")).toBe("slide");
  expect(slides[1]!.getAttribute("aria-label")).toBe("Slide 2 de 5");
  expect(slides[1]!.textContent).toBe("Profissional");
});

test("next advances one slide, and previous starts disabled on the first", () => {
  const onIndexChange = mock(() => {});
  carousel({ onIndexChange });

  expect((previous() as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(next());
  expect(onIndexChange).toHaveBeenLastCalledWith(1);
  expect(region().getAttribute("data-index")).toBe("1");
  expect((previous() as HTMLButtonElement).disabled).toBe(false);
});

test("on the last one, next disables; with loop, it goes back to the first", () => {
  const { unmount } = carousel({ defaultIndex: 4 });
  expect((next() as HTMLButtonElement).disabled).toBe(true);
  unmount();

  const onIndexChange = mock(() => {});
  carousel({ defaultIndex: 4, loop: true, onIndexChange });
  expect((next() as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(next());
  expect(onIndexChange).toHaveBeenLastCalledWith(0);
});

test("arrows, Home and End move when focus is on the carousel", () => {
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

test("an arrow inside a field in the slide belongs to the field, and not to the carousel", () => {
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

test("controlled, the slide only changes when the controller changes it", () => {
  const onIndexChange = mock(() => {});
  carousel({ index: 2, onIndexChange });
  fireEvent.click(next());
  expect(onIndexChange).toHaveBeenLastCalledWith(3);
  expect(region().getAttribute("data-index")).toBe("2");
});

test("controlled with state, the index follows the parent", () => {
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

test("the indicators are optional, one per position, and mark the current one", () => {
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

test("controls={false} removes the buttons", () => {
  carousel({ controls: false });
  expect(screen.queryByRole("button", { name: "Próximo slide" })).toBeNull();
});

test("a single slide, or none, draws no controls", () => {
  const { unmount } = carousel({ indicators: true }, 1);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(viewport()).toBeNull();
  unmount();

  carousel({ indicators: true, autoplay: true }, 0);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(screen.queryAllByRole("group")).toHaveLength(0);
});

test("the live region states the front slide when it changes", () => {
  carousel();
  const live = region().querySelector("[aria-live]")!;
  expect(live.getAttribute("aria-live")).toBe("polite");
  fireEvent.click(next());
  expect(live.textContent).toBe("Slide 2 de 5");
});

test("without autoplay, nothing moves by itself and there is no pause button", async () => {
  carousel();
  expect(screen.queryByRole("button", { name: /rotação/ })).toBeNull();
  await wait(60);
  expect(region().getAttribute("data-index")).toBe("0");
});

test("with autoplay, it moves by itself, silences the live region and shows the pause", async () => {
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

test("pointer hover and focus inside stop the rotation", async () => {
  carousel({ autoplay: 20 });
  fireEvent.pointerEnter(region(), { pointerType: "mouse" });
  await wait(60);
  expect(region().getAttribute("data-index")).toBe("0");
  fireEvent.pointerLeave(region(), { pointerType: "mouse" });

  fireEvent.focus(viewport());
  await wait(60);
  expect(region().getAttribute("data-index")).toBe("0");
});

test("with reduced motion, rotation does not start, and the pause offers to resume", async () => {
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

test("with reduced motion, whoever presses resume sees the rotation run, and the slide swaps without sliding", async () => {
  const restore = reducedMotion(true);
  try {
    carousel({ autoplay: 20 });
    fireEvent.click(screen.getByRole("button", { name: "Retomar a rotação" }));
    expect(screen.getByRole("button", { name: "Pausar a rotação" })).toBeDefined();
    await wait(70);
    expect(Number(region().getAttribute("data-index"))).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Pausar a rotação" }));
    const paused = region().getAttribute("data-index");
    await wait(60);
    expect(region().getAttribute("data-index")).toBe(paused);
  } finally {
    restore();
  }
});

function withLayout() {
  const width = 300;
  const calls: ScrollToOptions[] = [];
  const box = Object.getOwnPropertyDescriptors(HTMLElement.prototype);
  const scrollTo = Element.prototype.scrollTo;
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return width;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return width * Math.max(1, this.children.length);
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
    configurable: true,
    get(this: HTMLElement) {
      const siblings = this.parentElement ? [...this.parentElement.children] : [this];
      return siblings.indexOf(this) * width;
    },
  });
  Element.prototype.scrollTo = function (options?: ScrollToOptions | number) {
    if (typeof options === "object") calls.push(options);
  } as typeof Element.prototype.scrollTo;

  return {
    calls,
    restore() {
      for (const name of ["clientWidth", "scrollWidth", "offsetLeft"] as const) {
        if (box[name]) Object.defineProperty(HTMLElement.prototype, name, box[name]);
      }
      Element.prototype.scrollTo = scrollTo;
    },
  };
}

test("with defaultIndex, the carousel mounts on the requested slide, without sliding from the first", () => {
  const layout = withLayout();
  try {
    carousel({ defaultIndex: 2 });
    expect(layout.calls[0]).toEqual({ left: 600, behavior: "auto" });

    fireEvent.click(next());
    expect(layout.calls.at(-1)).toEqual({ left: 900, behavior: "smooth" });
  } finally {
    layout.restore();
  }
});

test("responsive slidesPerView writes one variable per breakpoint, inheriting from the smaller", () => {
  carousel({ slidesPerView: { base: 1, md: 3 } });
  const style = region().style;
  expect(style.getPropertyValue("--carousel-per-base")).toBe("1");
  expect(style.getPropertyValue("--carousel-per-sm")).toBe("1");
  expect(style.getPropertyValue("--carousel-per-md")).toBe("3");
  expect(style.getPropertyValue("--carousel-per-xl")).toBe("3");
});

test("slidesPerView auto leaves the width to the slide class", () => {
  carousel({ slidesPerView: "auto", classNames: { slide: "w-64" } });
  const slide = screen.getAllByRole("group")[0]!.className.split(" ");
  expect(slide).toContain("w-64");
  expect(slide.some((token) => token.startsWith("basis-"))).toBe(false);
});

test("labels replaces the texts the screen reader hears", () => {
  carousel({
    labels: { next: "Next", slide: (position, total) => `${position}/${total}` },
  });
  expect(screen.getByRole("button", { name: "Next" })).toBeDefined();
  expect(screen.getAllByRole("group")[0]!.getAttribute("aria-label")).toBe("1/5");
});
