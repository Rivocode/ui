import { expect, test } from "bun:test";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/components/button";

test("renders the label", () => {
  render(<Button>Falar no WhatsApp</Button>);
  expect(screen.getByRole("button", { name: "Falar no WhatsApp" })).toBeDefined();
});

test("the default variant is primary", () => {
  render(<Button>Enviar</Button>);
  expect(screen.getByRole("button").className.split(" ")).toContain("bg-accent");
});

test("the destructive variant uses the danger token, never a literal red", () => {
  render(<Button variant="danger">Excluir</Button>);
  const classes = screen.getByRole("button").className;
  expect(classes.split(" ")).toContain("bg-danger");
  expect(classes).not.toMatch(/#[0-9a-f]{3,6}/i);
});

test("the pill shape changes the radius, and the product default is not a pill", () => {
  const { rerender } = render(<Button>Padrao</Button>);
  expect(screen.getByRole("button").className).toContain("rounded-md");

  rerender(<Button shape="pill">Marketing</Button>);
  expect(screen.getByRole("button").className).toContain("rounded-pill");
});

test("the size comes from the density token, not from a hardcoded height", () => {
  render(<Button size="lg">Grande</Button>);
  expect(screen.getByRole("button").className).toContain("--rc-control-lg");
});

test("forwards the ref to the native element", () => {
  const ref = createRef<HTMLButtonElement>();
  render(<Button ref={ref}>Ok</Button>);
  expect(ref.current?.tagName).toBe("BUTTON");
});

test("disabled does not fire click", () => {
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

test("loading disables, announces busy and hides the spinner from the screen reader", () => {
  render(<Button loading>Salvando</Button>);
  const element = screen.getByRole("button");
  expect(element.getAttribute("aria-busy")).toBe("true");
  expect((element as HTMLButtonElement).disabled).toBe(true);
  expect(element.querySelector('[aria-hidden="true"]')).not.toBeNull();
});

test("while loading, the button keeps its variant instead of turning gray", () => {
  // "Excluindo..." is the moment the person most needs to see the action is
  // destructive, and that was exactly when the color vanished: the loading
  // disabled triggered the disabled gray, and a destructive in progress looked
  // identical to a switched-off secondary.
  render(
    <Button variant="danger" loading>
      Excluindo
    </Button>,
  );
  const element = screen.getByRole("button");

  expect(element.getAttribute("data-loading")).toBe("true");
  expect(element.className).toContain("not-data-loading:disabled:bg-surface-raised");
  expect(element.className.split(" ")).toContain("bg-danger");
});

test("truly disabled stays neutral, and does not look like loading", () => {
  render(
    <Button variant="danger" disabled>
      Excluir
    </Button>,
  );
  const element = screen.getByRole("button");

  expect(element.getAttribute("data-loading")).toBeNull();
  expect(element.getAttribute("aria-busy")).toBeNull();
});

test("the button does not draw an icon square: that role belongs only to IconButton", () => {
  render(
    // @ts-expect-error
    <Button size="icon" aria-label="Mais acoes">
      .
    </Button>,
  );
  const tokens = screen.getByRole("button", { name: "Mais acoes" }).className.split(" ");
  expect(tokens).not.toContain("size-[var(--rc-control-md)]");
  expect(tokens).not.toContain("p-0");
});

test("the button can become a link, because half the buttons on a site are links", () => {
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

test("xl is only size: its own measure, outside the density token, and the weight of the other three", () => {
  render(<Button size="xl">Quero um diagnostico</Button>);
  const tokens = screen.getByRole("button").className.split(" ");
  expect(tokens).toContain("px-6.5");
  expect(tokens).toContain("text-[15.5px]");
  expect(tokens).toContain("font-rc-medium");
  expect(tokens).not.toContain("font-rc-bold");
  expect(tokens.some((token) => token.includes("--rc-control-"))).toBe(false);
});

test("the outline variant does not fill, and thickens the border", () => {
  render(<Button variant="outline">Quero um diagnostico</Button>);
  const classes = screen.getByRole("button").className;
  expect(classes).toContain("border-2");
  expect(classes).toContain("bg-transparent");
});
