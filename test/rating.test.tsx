import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Heart } from "lucide-react";
import { useState } from "react";

import { Rating, type RatingProps } from "../src/components/rating";
import { RivoProvider } from "../src/provider/rivo-provider";

function rating(props: Partial<RatingProps> = {}) {
  const onValueChange = mock<(value: number) => void>(() => {});
  const view = render(
    <RivoProvider scope="local">
      <Rating onValueChange={onValueChange} {...props} />
    </RivoProvider>,
  );
  return { ...view, onValueChange };
}

function Controlled(props: Partial<RatingProps>) {
  const [value, setValue] = useState(props.defaultValue ?? 0);
  return (
    <RivoProvider scope="local">
      <Rating {...props} value={value} onValueChange={setValue} />
      <output data-testid="nota">{value}</output>
    </RivoProvider>
  );
}

const fills = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-fill]")].map((node) => node.getAttribute("data-fill"));

test("is a radiogroup named Avaliacao with one option per star", () => {
  rating();
  const group = screen.getByRole("radiogroup", { name: "Avaliação" });
  const radios = screen.getAllByRole("radio");
  expect(group).toBeDefined();
  expect(radios).toHaveLength(5);
  expect(radios.map((radio) => radio.getAttribute("aria-label"))).toEqual([
    "1 estrela",
    "2 estrelas",
    "3 estrelas",
    "4 estrelas",
    "5 estrelas",
  ]);
});

test("max changes how many stars, and the default is five", () => {
  rating({ max: 10 });
  expect(screen.getAllByRole("radio")).toHaveLength(10);
});

test("without a rating, no option is checked and focus enters at the first", () => {
  rating();
  const radios = screen.getAllByRole("radio");
  expect(radios.every((radio) => radio.getAttribute("aria-checked") === "false")).toBe(true);
  expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1, -1, -1, -1]);
});

test("clicking picks the rating, paints up to it and only the checked one stays in the tab order", () => {
  const { container } = render(<Controlled />);
  fireEvent.click(screen.getByRole("radio", { name: "3 estrelas" }));

  expect(screen.getByTestId("nota").textContent).toBe("3");
  const checked = screen.getByRole("radio", { checked: true });
  expect(checked.getAttribute("aria-label")).toBe("3 estrelas");
  expect(checked.tabIndex).toBe(0);
  expect(fills(container)).toEqual(["1", "1", "1", "0", "0"]);
});

test("arrows move one star, stop at the ends, and focus follows", () => {
  render(<Controlled defaultValue={2} />);
  const radio = screen.getByRole("radio", { name: "2 estrelas" });
  radio.focus();

  fireEvent.keyDown(radio, { key: "ArrowRight" });
  expect(screen.getByTestId("nota").textContent).toBe("3");
  expect(document.activeElement?.getAttribute("aria-label")).toBe("3 estrelas");

  fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
  fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
  fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
  expect(screen.getByTestId("nota").textContent).toBe("1");

  fireEvent.keyDown(document.activeElement!, { key: "End" });
  expect(screen.getByTestId("nota").textContent).toBe("5");
  fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
  expect(screen.getByTestId("nota").textContent).toBe("5");

  fireEvent.keyDown(document.activeElement!, { key: "Home" });
  expect(screen.getByTestId("nota").textContent).toBe("1");
});

test("allowHalf splits each star into two halves, with a half name", () => {
  const { container } = render(<Controlled allowHalf defaultValue={2.5} />);
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(10);
  expect(radios[0]!.getAttribute("aria-label")).toBe("Meia estrela");
  expect(radios[2]!.getAttribute("aria-label")).toBe("1,5 estrela");
  expect(radios[4]!.getAttribute("aria-label")).toBe("2,5 estrelas");
  expect(screen.getByRole("radio", { checked: true }).getAttribute("aria-label")).toBe(
    "2,5 estrelas",
  );
  expect(fills(container)).toEqual(["1", "1", "0.5", "0", "0"]);

  fireEvent.keyDown(screen.getByRole("radio", { checked: true }), { key: "ArrowRight" });
  expect(screen.getByTestId("nota").textContent).toBe("3");
});

test("without clearable, clicking the rating again does not clear", () => {
  const { onValueChange } = rating({ defaultValue: 4 });
  fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
  expect(onValueChange).toHaveBeenLastCalledWith(4);
});

test("with clearable, clicking the rating again returns to zero", () => {
  render(<Controlled clearable defaultValue={4} />);
  fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
  expect(screen.getByTestId("nota").textContent).toBe("0");
  expect(screen.queryByRole("radio", { checked: true })).toBeNull();
});

test("hovering shows the preview without changing the rating, and leaving erases the preview", () => {
  const { container } = render(<Controlled defaultValue={1} />);
  fireEvent.pointerEnter(screen.getByRole("radio", { name: "4 estrelas" }));
  expect(fills(container)).toEqual(["1", "1", "1", "1", "0"]);
  expect(screen.getByTestId("nota").textContent).toBe("1");

  fireEvent.pointerLeave(screen.getByRole("radiogroup"));
  expect(fills(container)).toEqual(["1", "0", "0", "0", "0"]);
});

test("the full star paints with warning and the empty one with border-strong, measured at 3:1", () => {
  const { container } = rating({ defaultValue: 1 });
  const filled = container.querySelector("[data-fill] > span")!;
  expect(filled.className.split(" ")).toContain("text-warning");
  const empty = container.querySelector("[aria-hidden='true']")!;
  expect(empty.className.split(" ")).toContain("text-border-strong");
});

test("disabled: nothing is reachable by tab, click does not change, and the colors are the disabled ones", () => {
  const { container, onValueChange } = rating({ disabled: true, defaultValue: 2 });
  expect(screen.getByRole("radiogroup").getAttribute("aria-disabled")).toBe("true");
  expect(screen.getAllByRole("radio").every((radio) => radio.tabIndex === -1)).toBe(true);

  fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
  fireEvent.keyDown(screen.getByRole("radio", { name: "2 estrelas" }), { key: "ArrowRight" });
  expect(onValueChange).not.toHaveBeenCalled();

  const filled = container.querySelector("[data-fill] > span")!;
  expect(filled.className.split(" ")).toContain("text-fg-disabled");
  expect(filled.className.split(" ")).not.toContain("text-warning");
});

test("readOnly renders as a single image, with the average said in Portuguese", () => {
  const { container } = rating({ readOnly: true, value: 4.5 });
  expect(screen.queryByRole("radiogroup")).toBeNull();
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  expect(screen.getByRole("img", { name: "4,5 de 5" })).toBeDefined();
  expect(fills(container)).toEqual(["1", "1", "1", "1", "0.5"]);
});

test("readOnly accepts any fraction and paints the part it is worth", () => {
  const { container } = rating({ readOnly: true, value: 4.3 });
  expect(screen.getByRole("img", { name: "4,3 de 5" })).toBeDefined();
  const last = container.querySelectorAll<HTMLElement>("[data-fill]")[4]!;
  expect(last.getAttribute("data-fill")).toBe("0.3");
  expect(last.style.width).toBe("30%");
});

test("labels swaps the screen reader texts", () => {
  rating({
    labels: { group: "Nota do atendimento", item: (value) => `${value} de 5` },
  });
  expect(screen.getByRole("radiogroup", { name: "Nota do atendimento" })).toBeDefined();
  expect(screen.getByRole("radio", { name: "2 de 5" })).toBeDefined();
});

test("aria-labelledby takes the place of the default name", () => {
  render(
    <RivoProvider scope="local">
      <p id="titulo">Como foi a entrega?</p>
      <Rating aria-labelledby="titulo" />
    </RivoProvider>,
  );
  expect(screen.getByRole("radiogroup", { name: "Como foi a entrega?" })).toBeDefined();
});

test("icon swaps the drawing on both layers", () => {
  const { container } = rating({ icon: <Heart data-testid="coracao" />, max: 3 });
  expect(screen.getAllByTestId("coracao")).toHaveLength(6);
  expect(container.querySelector(".lucide-star")).toBeNull();
});

test("name carries the rating in a hidden input for the form", () => {
  const { container } = rating({ name: "nota", defaultValue: 3 });
  const input = container.querySelector<HTMLInputElement>("input[type='hidden']")!;
  expect(input.name).toBe("nota");
  expect(input.value).toBe("3");
});

function Directed({ dir, ...props }: Partial<RatingProps> & { dir: "ltr" | "rtl" }) {
  const [value, setValue] = useState(props.defaultValue ?? 0);
  return (
    <RivoProvider scope="local" dir={dir}>
      <Rating {...props} value={value} onValueChange={setValue} />
      <output data-testid="nota">{value}</output>
    </RivoProvider>
  );
}

function boxAt(element: Element, left: number, width: number) {
  element.getBoundingClientRect = () =>
    ({ left, width, right: left + width, top: 0, bottom: width, height: width }) as DOMRect;
}

test("with allowHalf the pointer target is the whole star, and the half comes from where the pointer landed", () => {
  const { container } = render(<Directed dir="ltr" allowHalf size="sm" />);
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(10);
  for (const radio of radios) {
    expect(radio.className.split(" ")).toContain("pointer-events-none");
    expect(radio.className.split(" ")).not.toContain("w-1/2");
  }

  const second = container.querySelectorAll("[role='radiogroup'] > span")[1]!;
  expect(second.className.split(" ")).toContain("size-6");
  boxAt(second, 24, 24);

  fireEvent.click(second, { clientX: 30 });
  expect(screen.getByTestId("nota").textContent).toBe("1.5");

  fireEvent.click(second, { clientX: 44 });
  expect(screen.getByTestId("nota").textContent).toBe("2");

  fireEvent.pointerMove(second, { clientX: 26 });
  expect(fills(container)).toEqual(["1", "0.5", "0", "0", "0"]);
  expect(screen.getByTestId("nota").textContent).toBe("2");

  fireEvent.click(screen.getByRole("radio", { name: "3,5 estrelas" }));
  expect(screen.getByTestId("nota").textContent).toBe("3.5");
});

test("in rtl the right arrow subtracts, the left adds, the fill starts from the start edge and the half mirrors", () => {
  const { container } = render(<Directed dir="rtl" allowHalf defaultValue={3} />);

  fireEvent.keyDown(screen.getByRole("radio", { checked: true }), { key: "ArrowRight" });
  expect(screen.getByTestId("nota").textContent).toBe("2.5");
  fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
  fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
  expect(screen.getByTestId("nota").textContent).toBe("3.5");
  fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
  expect(screen.getByTestId("nota").textContent).toBe("4");

  const painted = container.querySelector("[data-fill]")!;
  expect(painted.className.split(" ")).toContain("start-0");
  expect(painted.className.split(" ")).not.toContain("left-0");

  const first = container.querySelectorAll("[role='radiogroup'] > span")[0]!;
  boxAt(first, 0, 28);
  fireEvent.click(first, { clientX: 4 });
  expect(screen.getByTestId("nota").textContent).toBe("1");
  fireEvent.click(first, { clientX: 24 });
  expect(screen.getByTestId("nota").textContent).toBe("0.5");
});

test("each star has a target box of at least 24px in all three sizes", () => {
  for (const [size, box] of [
    ["sm", "size-6"],
    ["md", "size-7"],
    ["lg", "size-9"],
  ] as const) {
    const { container, unmount } = rating({ size });
    const item = container.querySelector("[role='radiogroup'] > span")!;
    expect(item.className.split(" ")).toContain(box);
    unmount();
  }
});
