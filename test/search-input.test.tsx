import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { SearchInput } from "../src/components/search-input";
import { RivoProvider } from "../src/provider/rivo-provider";

function query(props: Partial<React.ComponentProps<typeof SearchInput>> = {}) {
  return render(
    <RivoProvider scope="local">
      <SearchInput aria-label="Buscar nota" {...props} />
    </RivoProvider>,
  );
}

test("is a search field with an accessible name", () => {
  query();
  expect(screen.getByRole("searchbox", { name: "Buscar nota" })).toBeDefined();
});

test("notifies whoever typed", () => {
  let text = "";
  query({ onChange: (event) => (text = event.target.value) });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clinica" } });
  expect(text).toBe("clinica");
});

test("onValueChange delivers the text, and onChange is still called", () => {
  let value = "";
  let changed = "";
  query({ onValueChange: (next) => (value = next), onChange: (event) => (changed = event.target.value) });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "clinica" } });
  expect(value).toBe("clinica");
  expect(changed).toBe("clinica");
});

test("without onClear, esc clears and notifies onValueChange with empty text", () => {
  let value = "algo";
  query({ defaultValue: "algo", onValueChange: (next) => (value = next) });
  const box = screen.getByRole("searchbox") as HTMLInputElement;
  fireEvent.keyDown(box, { key: "Escape" });
  expect(box.value).toBe("");
  expect(value).toBe("");
});

test("the shortcut shows when asked, and hidden from the screen reader", () => {
  const { container } = query({ shortcut: "mod+k" });
  const kbd = container.querySelector("kbd");
  expect(kbd).not.toBeNull();
  expect(kbd?.closest("[aria-hidden='true']")).not.toBeNull();
});

test("without shortcut there is no kbd", () => {
  const { container } = query();
  expect(container.querySelector("kbd")).toBeNull();
});

test("esc clears the field when controlled from outside", () => {
  let text = "algo";
  query({
    value: text,
    onChange: (event) => (text = event.target.value),
    onClear: () => (text = ""),
  });
  fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
  expect(text).toBe("");
});

test("controlled with onChange only, esc clears the consumer's state, and not just the screen", () => {
  function Controlled() {
    const [text, setText] = useState("clinica");
    return (
      <RivoProvider scope="local">
        <SearchInput aria-label="Buscar nota" value={text} onChange={(event) => setText(event.target.value)} />
        <output>{`[${text}]`}</output>
      </RivoProvider>
    );
  }
  render(<Controlled />);
  const box = screen.getByRole("searchbox") as HTMLInputElement;

  fireEvent.keyDown(box, { key: "Escape" });
  expect(screen.getByText("[]")).toBeDefined();
  expect(box.value).toBe("");
});

test("controlled and refusing the change, esc does not leave the screen different from the state", () => {
  render(
    <RivoProvider scope="local">
      <SearchInput aria-label="Buscar nota" value="fixo" onChange={() => {}} />
    </RivoProvider>,
  );
  const box = screen.getByRole("searchbox") as HTMLInputElement;

  fireEvent.keyDown(box, { key: "Escape" });
  expect(box.value).toBe("fixo");
});

test("follows the three sizes, to line up with its siblings in the filter bar", () => {
  // It hardcoded the medium height and had no `size`. Next to a small Select
  // in a filter bar, the search came out taller and the bar crooked.
  query({ size: "sm" });
  expect(screen.getByRole("searchbox").className).toContain("--rc-control-sm");
});

test("the shortcut padding beats the size padding", () => {
  // The Kbd sits inside the field, so the shortcut pr must come after the size
  // pr in cn - otherwise the typed text runs underneath it.
  query({ size: "sm", shortcut: "mod+k" });
  expect(screen.getByRole("searchbox").className).toContain("pr-16");
});
