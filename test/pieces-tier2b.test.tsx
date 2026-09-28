import { expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Splitter } from "../src/components/splitter";
import { Editable } from "../src/components/editable";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the divider is a separator the keyboard moves", () => {
  // Dragging with the mouse is half the piece: without a keyboard, whoever
  // does not use a pointer is stuck with the ratio the developer chose.
  let size = 40;
  withTheme(
    <Splitter
      defaultSize={40}
      onSizeChange={(next) => {
        size = next;
      }}
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  const handle = screen.getByRole("separator", { name: "Lista e detalhe" });
  expect(handle.getAttribute("aria-valuenow")).toBe("40");

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(size).toBeGreaterThan(40);
});

test("the divider respects the minimum on both sides", () => {
  let size = 20;
  withTheme(
    <Splitter
      defaultSize={20}
      min={20}
      onSizeChange={(next) => {
        size = next;
      }}
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowLeft" });
  expect(size).toBe(20);
});

test("on mobile the two sides stack, instead of squeezing", () => {
  // Two 190px columns are not two columns: they are two unreadable lists.
  withTheme(<Splitter start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />);

  // The first child is the provider's container; the piece is the next one.
  const splitter = screen.getByRole("separator").parentElement!;
  expect(splitter.className).toContain("max-md:flex-col");
  expect(screen.getByRole("separator").className).toContain("max-md:hidden");
});

function splitter(dir: "ltr" | "rtl") {
  const measure = { size: 50 };
  const view = render(
    <RivoProvider scope="local" dir={dir}>
      <Splitter
        defaultSize={50}
        min={10}
        onSizeChange={(next) => {
          measure.size = next;
        }}
        start={<p>Lista</p>}
        end={<p>Detalhe</p>}
        label="Lista e detalhe"
      />
    </RivoProvider>,
  );

  const handle = within(view.container).getByRole("separator", { name: "Lista e detalhe" });
  handle.setPointerCapture = () => {};
  handle.parentElement!.getBoundingClientRect = () =>
    ({ left: 0, right: 600, width: 600, top: 0, bottom: 300, height: 300 }) as DOMRect;

  return { ...view, handle, measure };
}

test("in rtl the drag measures from the edge where reading starts, not always from the left", () => {
  const { handle, measure } = splitter("rtl");

  fireEvent.pointerDown(handle, { clientX: 300, clientY: 150, pointerId: 1 });
  fireEvent.pointerMove(window, { clientX: 420, clientY: 150, pointerId: 1 });

  expect(measure.size).toBe(30);
  expect(handle.getAttribute("aria-valuenow")).toBe("30");

  const mirror = splitter("ltr");
  fireEvent.pointerDown(mirror.handle, { clientX: 300, clientY: 150, pointerId: 1 });
  fireEvent.pointerMove(window, { clientX: 420, clientY: 150, pointerId: 1 });

  expect(mirror.measure.size).toBe(70);
});

test("in rtl the arrow moves the divider toward the side the person sees, not by the number", () => {
  const { handle, measure } = splitter("rtl");

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(measure.size).toBe(48);

  fireEvent.keyDown(handle, { key: "ArrowLeft" });
  fireEvent.keyDown(handle, { key: "ArrowLeft" });
  expect(measure.size).toBe(52);

  fireEvent.keyDown(handle, { key: "Home" });
  expect(measure.size).toBe(10);

  fireEvent.keyDown(handle, { key: "End" });
  expect(measure.size).toBe(90);
});

test("the divider target reaches the 24px that WCAG 2.5.8 asks for", () => {
  withTheme(<Splitter start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />);

  const handle = screen.getByRole("separator");
  expect(handle.className).toContain("relative");
  expect(handle.className).toContain("after:absolute");
  expect(handle.className).toContain("after:-inset-x-3");
});

test("the horizontal divider stretches the target along the other dimension", () => {
  withTheme(
    <Splitter
      orientation="vertical"
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  const handle = screen.getByRole("separator");
  expect(handle.className).toContain("after:-inset-y-3");
});

test("the divider states its size with a unit, not a bare number", () => {
  withTheme(
    <Splitter defaultSize={50} start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />,
  );

  const handle = screen.getByRole("separator");
  expect(handle.getAttribute("aria-valuetext")).toBe("50%");

  fireEvent.keyDown(handle, { key: "End" });
  expect(handle.getAttribute("aria-valuetext")).toBe("85%");
});

test("the divider points to the side it measures", () => {
  withTheme(<Splitter start={<p>Lista</p>} end={<p>Detalhe</p>} label="Lista e detalhe" />);

  const handle = screen.getByRole("separator");
  const controlled = document.getElementById(handle.getAttribute("aria-controls")!)!;

  expect(controlled.textContent).toBe("Lista");
});

test("the caller's aria-label lands on the node that has a role, not on a loose div", () => {
  const { container } = withTheme(
    <Splitter
      aria-label="Divisória entre lista e detalhe"
      start={<p>Lista</p>}
      end={<p>Detalhe</p>}
      label="Lista e detalhe"
    />,
  );

  const root = container.firstElementChild!.firstElementChild!;
  expect(root.getAttribute("aria-label")).toBeNull();
  expect(screen.getByRole("separator", { name: "Divisória entre lista e detalhe" })).toBeDefined();
});

test("the text becomes a field on click and comes back on Enter", () => {
  let saved = "";
  withTheme(
    <Editable
      value="Clínica São Lucas"
      label="Cliente"
      onValueChange={(next) => {
        saved = next;
      }}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente") as HTMLInputElement;

  fireEvent.change(field, { target: { value: "Clínica Aurora" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(saved).toBe("Clínica Aurora");
});

test("Escape undoes, and does not save halfway", () => {
  // Leaving sideways is the gesture of someone who changed their mind: saving
  // there turns a wrong click into an edit nobody asked for.
  let saved = "unchanged";
  withTheme(
    <Editable
      value="Clínica São Lucas"
      label="Cliente"
      onValueChange={(next) => {
        saved = next;
      }}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente");

  fireEvent.change(field, { target: { value: "outra coisa" } });
  fireEvent.keyDown(field, { key: "Escape" });

  expect(saved).toBe("unchanged");
  expect(screen.getByRole("button", { name: /Clínica São Lucas/ })).toBeDefined();
});

test("leaving the field with Enter or Escape returns focus to the text, not to the page body", () => {
  withTheme(<Editable defaultValue="Clínica São Lucas" label="Cliente" />);

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente");
  fireEvent.change(field, { target: { value: "Clínica Aurora" } });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: /Clínica Aurora/ }));

  fireEvent.click(screen.getByRole("button", { name: /Clínica Aurora/ }));
  fireEvent.keyDown(screen.getByLabelText("Cliente"), { key: "Escape" });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: /Clínica Aurora/ }));
});

test("leaving the field by clicking outside does not pull focus back to the text", () => {
  withTheme(
    <>
      <Editable defaultValue="Clínica São Lucas" label="Cliente" />
      <button type="button">Outro</button>
    </>,
  );

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const other = screen.getByRole("button", { name: "Outro" });
  other.focus();
  fireEvent.blur(screen.getByLabelText("Cliente"));
  expect(document.activeElement).toBe(other);
});
