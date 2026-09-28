import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { ColorPicker } from "../src/components/color-picker";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * The piece exists to pick a client's brand color, so what the tests demand is
 * what separates it from an <input type="color">: the value goes in and out as
 * hexadecimal, the text field accepts what the person pastes, and the grid
 * responds to the keyboard saying which swatch is chosen.
 */

const SWATCHES = ["#d4f34a", "#3ddc97", "#6aa9ff"];

function picker(
  props: Partial<React.ComponentProps<typeof ColorPicker>> = {},
  dir: "ltr" | "rtl" = "ltr",
) {
  return render(
    <RivoProvider scope="local" dir={dir}>
      <ColorPicker label="Cor da marca" swatches={SWATCHES} columns={3} {...props} />
    </RivoProvider>,
  );
}

test("each swatch has its value in the accessible name", () => {
  picker();
  for (const color of SWATCHES) {
    expect(screen.getByRole("radio", { name: new RegExp(color, "i") })).toBeTruthy();
  }
});

test("the chosen swatch is announced, and not only painted", () => {
  picker({ value: "#3ddc97" });

  const chosen = screen.getByRole("radio", { name: /#3ddc97/i });
  expect(chosen.getAttribute("aria-checked")).toBe("true");

  const other = screen.getByRole("radio", { name: /#d4f34a/i });
  expect(other.getAttribute("aria-checked")).toBe("false");
});

test("clicking a swatch reports the color in hexadecimal", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  fireEvent.click(screen.getByRole("radio", { name: /#6aa9ff/i }));
  expect(seen).toEqual(["#6aa9ff"]);
});

test("a swatch written in uppercase or with three digits reports six lowercase digits", () => {
  const seen: string[] = [];
  picker({ swatches: ["#0055FF", "#FFF"], onValueChange: (color) => seen.push(color) });

  fireEvent.click(screen.getByRole("radio", { name: /#0055FF/i }));
  fireEvent.click(screen.getByRole("radio", { name: /#FFF/i }));
  expect(seen).toEqual(["#0055ff", "#ffffff"]);
});

test("the arrow moves through the grid and picks the swatch that got focus", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  const group = screen.getByRole("radiogroup");
  fireEvent.keyDown(group, { key: "ArrowRight" });
  expect(seen).toEqual(["#3ddc97"]);

  fireEvent.keyDown(group, { key: "End" });
  expect(seen).toEqual(["#3ddc97", "#6aa9ff"]);
});

test("in rtl the arrow moves to the side the person sees, and not by index", () => {
  const seen: string[] = [];
  picker({ value: "#3ddc97", onValueChange: (color) => seen.push(color) }, "rtl");

  const group = screen.getByRole("radiogroup");
  fireEvent.keyDown(group, { key: "ArrowRight" });
  expect(seen).toEqual(["#d4f34a"]);

  fireEvent.keyDown(group, { key: "ArrowLeft" });
  expect(seen).toEqual(["#d4f34a", "#6aa9ff"]);

  fireEvent.keyDown(group, { key: "Home" });
  expect(seen).toEqual(["#d4f34a", "#6aa9ff", "#d4f34a"]);

  fireEvent.keyDown(group, { key: "End" });
  expect(seen).toEqual(["#d4f34a", "#6aa9ff", "#d4f34a", "#6aa9ff"]);
});

test("only the chosen swatch enters the tab order", () => {
  picker({ value: "#3ddc97" });

  expect(screen.getByRole("radio", { name: /#3ddc97/i }).getAttribute("tabindex")).toBe("0");
  expect(screen.getByRole("radio", { name: /#d4f34a/i }).getAttribute("tabindex")).toBe("-1");
});

test("typing a three-digit hexadecimal reports the six-digit value", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  const field = screen.getByRole("textbox");
  fireEvent.change(field, { target: { value: "#0f8" } });
  expect(seen).toEqual(["#00ff88"]);
});

test("pasting without the hash and in uppercase also works", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "  BFDD3A " } });
  expect(seen).toEqual(["#bfdd3a"]);
});

test("invalid text reports nothing, and the field goes back to the good value on blur", () => {
  const seen: string[] = [];
  picker({ value: "#d4f34a", onValueChange: (color) => seen.push(color) });

  const field = screen.getByRole("textbox") as HTMLInputElement;
  fireEvent.change(field, { target: { value: "#zz" } });
  expect(seen).toEqual([]);
  expect(field.value).toBe("#zz");

  fireEvent.blur(field);
  expect(field.value).toBe("#d4f34a");
});

test("without a controlled value the piece keeps its own choice", () => {
  picker({ value: undefined, defaultValue: "#d4f34a" });

  fireEvent.click(screen.getByRole("radio", { name: /#6aa9ff/i }));
  expect(screen.getByRole("radio", { name: /#6aa9ff/i }).getAttribute("aria-checked")).toBe("true");
  expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("#6aa9ff");
});

test("the swatch paints its own value, which is data and not decoration", () => {
  picker();
  const swatch = screen.getByRole("radio", { name: /#d4f34a/i });
  expect(swatch.style.backgroundColor).toBeTruthy();
});

test("without its own swatches, the grid brings a ready range of tones", () => {
  render(
    <RivoProvider scope="local">
      <ColorPicker label="Cor da marca" />
    </RivoProvider>,
  );
  expect(screen.getAllByRole("radio").length).toBeGreaterThan(10);
});

test("a swatch with its own name announces the name along with the value", () => {
  picker({ swatches: [{ value: "#d4f34a", label: "Lima" }] });
  const swatch = screen.getByRole("radio", { name: /lima/i });
  expect(swatch.getAttribute("aria-label")).toContain("#d4f34a");
});
