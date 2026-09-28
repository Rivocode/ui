import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { PasswordInput } from "../src/components/password-input";
import { Tracker } from "../src/components/tracker";
import { TagsInput } from "../src/components/tags-input";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the password starts hidden and the eye reveals it", () => {
  withTheme(<PasswordInput aria-label="Senha" defaultValue="segredo" />);
  const field = screen.getByLabelText("Senha") as HTMLInputElement;

  expect(field.type).toBe("password");

  fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(field.type).toBe("text");
  // The button says what it will do, not what is happening: whoever reads
  // through a screen reader needs to know the action, not the state.
  expect(screen.getByRole("button", { name: "Esconder senha" })).toBeDefined();
});

test("the password field does not keep the text revealed when it loses focus", () => {
  // Revealing is a momentary gesture: leaving the password visible on screen
  // after the person left the field is what gets someone read over the
  // shoulder.
  withTheme(<PasswordInput aria-label="Senha" defaultValue="segredo" />);
  const field = screen.getByLabelText("Senha") as HTMLInputElement;

  fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(field.type).toBe("text");

  fireEvent.blur(field);
  expect(field.type).toBe("password");
});

test("a disabled password does not reveal: the eye is disabled along with it", () => {
  withTheme(<PasswordInput aria-label="Senha" defaultValue="segredo" disabled />);
  const field = screen.getByLabelText("Senha") as HTMLInputElement;
  const eye = screen.getByRole("button", { name: "Mostrar senha" }) as HTMLButtonElement;

  expect(eye.disabled).toBe(true);
  fireEvent.click(eye);
  expect(field.type).toBe("password");
});

test("the tracker tells what happened, one square per period", () => {
  const { container } = withTheme(
    <Tracker
      label="Últimas 5 emissões"
      data={[
        { tone: "success", label: "4813 autorizada" },
        { tone: "success", label: "4814 autorizada" },
        { tone: "danger", label: "4815 rejeitada" },
        { tone: "warning", label: "4816 em fila" },
        { tone: "neutral", label: "sem emissão" },
      ]}
    />,
  );

  expect(container.querySelectorAll("[data-rc-track]").length).toBe(5);
  // Each square needs to say what it is: a strip of color without text does
  // not exist for screen reader users.
  expect(screen.getByText("4815 rejeitada")).toBeDefined();
});

/**
 * The tracker with `count` periods, already with the size happy-dom does not
 * give.
 *
 * It returns 0x0 from `getBoundingClientRect`, and the tracker picks the period
 * being read by a rule of three over the width - without a width, the pointer
 * reads nothing and the test would pass by mistake, with the tip closed.
 */
function tracker(count: number, dir: "ltr" | "rtl" = "ltr") {
  const view = render(
    <RivoProvider scope="local" dir={dir}>
      <Tracker
        label="Emissões por dia"
        data={Array.from({ length: count }, (_, index) => ({
          tone: "success" as const,
          label: `Dia ${index + 1}`,
        }))}
      />
    </RivoProvider>,
  );

  const track = screen.getByRole("group", { name: "Emissões por dia" });
  track.getBoundingClientRect = () => ({ left: 0, right: 100, width: 100 }) as DOMRect;

  return { ...view, track };
}

test("there is a single tip, with five periods or with a year of them", () => {
  // The reason this piece was rewritten: each square mounted its own Tooltip
  // root, so a year of issuances mounted 365 of them so that at most one would
  // show. What is proven here is that the number of panels no longer follows
  // the number of points - only the squares do.
  const week = tracker(5);
  fireEvent.pointerMove(week.track, { clientX: 50 });

  expect(week.container.querySelectorAll("[data-rc-track]").length).toBe(5);
  expect(week.container.querySelectorAll("[data-rc-track-cursor]").length).toBe(1);
  expect(document.querySelectorAll('[role="tooltip"]').length).toBe(1);
  week.unmount();

  const year = tracker(365);
  fireEvent.pointerMove(year.track, { clientX: 50 });

  expect(year.container.querySelectorAll("[data-rc-track]").length).toBe(365);
  expect(year.container.querySelectorAll("[data-rc-track-cursor]").length).toBe(1);
  expect(document.querySelectorAll('[role="tooltip"]').length).toBe(1);
});

test("the pointer reads the period underneath it", () => {
  const { track } = tracker(10);

  fireEvent.pointerMove(track, { clientX: 25 });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 3");

  fireEvent.pointerMove(track, { clientX: 95 });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 10");
});

test("the tip follows focus, not just the pointer", () => {
  // Before the single tip no square was focusable, and reading the exact text
  // of a period was only for mouse users.
  const { track } = tracker(4);
  expect(track.tabIndex).toBe(0);

  fireEvent.focus(track);
  // It starts on the most recent period, which is the one on the right.
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 4");
  // The keyboard speaks too: the tip is drawing, and drawing does not reach
  // screen reader users.
  expect(screen.getByRole("status").textContent).toBe("Dia 4");

  fireEvent.keyDown(track, { key: "ArrowLeft" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 3");
  expect(screen.getByRole("status").textContent).toBe("Dia 3");

  fireEvent.keyDown(track, { key: "Home" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 1");

  // Close on Escape without sending focus anywhere: the tip covers what is
  // underneath it, and keyboard users need a way to remove it.
  fireEvent.keyDown(track, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).toBeNull();
});

test("in rtl the pointer reads the period under the finger, not the mirrored one", () => {
  const { track } = tracker(10, "rtl");

  fireEvent.pointerMove(track, { clientX: 25 });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 8");

  fireEvent.pointerMove(track, { clientX: 95 });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 1");
});

test("in rtl the arrow moves toward the side the person sees, not toward the index", () => {
  const { track } = tracker(4, "rtl");

  fireEvent.focus(track);
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 4");

  fireEvent.keyDown(track, { key: "ArrowRight" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 3");

  fireEvent.keyDown(track, { key: "ArrowLeft" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 4");

  fireEvent.keyDown(track, { key: "Home" });
  expect(screen.getByRole("tooltip").textContent).toBe("Dia 1");
});

test("the tracker without data opens no tip at all", () => {
  // Focus lands on the most recent period, and in an empty list that index is
  // -1: without a guard, focusing the tracker would open a tip with no text in
  // it.
  const { track } = tracker(0);

  fireEvent.focus(track);
  fireEvent.keyDown(track, { key: "ArrowLeft" });

  expect(screen.queryByRole("tooltip")).toBeNull();
});

test("the tracker name is said once, and comes from the text the piece itself writes", () => {
  const { track } = tracker(3);

  expect(track.getAttribute("aria-label")).toBeNull();

  const source = document.getElementById(track.getAttribute("aria-labelledby")!)!;
  expect(source.tagName).toBe("P");
  expect(source.textContent).toBe("Emissões por dia");
  expect(source.getAttribute("aria-hidden")).toBe("true");
});

test("the text that names the tracker is still what classNames.label dresses", () => {
  withTheme(
    <Tracker
      label="Emissões por dia"
      classNames={{ label: "text-fg-subtle" }}
      data={[{ tone: "success", label: "Dia 1" }]}
    />,
  );

  const track = screen.getByRole("group", { name: "Emissões por dia" });
  const source = document.getElementById(track.getAttribute("aria-labelledby")!)!;

  expect(source.className).toContain("text-fg-subtle");
});

test("the caller's aria-label lands on the node that has a role, not on a loose div", () => {
  const { container } = withTheme(
    <Tracker
      aria-label="Faixa de disponibilidade"
      label="Emissões por dia"
      data={[{ tone: "success", label: "Dia 1" }]}
    />,
  );

  const root = container.firstElementChild!.firstElementChild!;
  expect(root.getAttribute("aria-label")).toBeNull();

  const track = screen.getByRole("group", { name: "Faixa de disponibilidade" });
  expect(track.getAttribute("aria-labelledby")).toBeNull();
});

test("the text becomes a chip on Enter, and the chip leaves through its own button", () => {
  let current: string[] = ["nf-e"];
  function Controlled() {
    return (
      <TagsInput
        aria-label="Marcadores"
        value={current}
        onValueChange={(next) => {
          current = next;
        }}
      />
    );
  }

  withTheme(<Controlled />);
  const field = screen.getByLabelText("Marcadores");

  fireEvent.change(field, { target: { value: "urgente" } });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(current).toEqual(["nf-e", "urgente"]);
});

test("deleting with the field empty removes the last chip", () => {
  // It is the gesture everyone tries first, and without it the person goes
  // with the mouse to the x of a chip they just typed.
  let current: string[] = ["nf-e", "urgente"];
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      value={current}
      onValueChange={(next) => {
        current = next;
      }}
    />,
  );

  fireEvent.keyDown(screen.getByLabelText("Marcadores"), { key: "Backspace" });
  expect(current).toEqual(["nf-e"]);
});

test("a repeated chip does not go in twice", () => {
  let current: string[] = ["nf-e"];
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      value={current}
      onValueChange={(next) => {
        current = next;
      }}
    />,
  );

  const field = screen.getByLabelText("Marcadores");
  fireEvent.change(field, { target: { value: "nf-e" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(current).toEqual(["nf-e"]);
});

test("at the chip cap the field stays focused, and Backspace still removes the last one", () => {
  withTheme(<TagsInput aria-label="Marcadores" defaultValue={["nf-e"]} max={2} />);
  const field = screen.getByLabelText("Marcadores") as HTMLInputElement;
  field.focus();

  fireEvent.change(field, { target: { value: "urgente" } });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(screen.getByText("urgente")).toBeDefined();
  expect(field.disabled).toBe(false);
  expect(field.readOnly).toBe(true);
  expect(document.activeElement).toBe(field);

  fireEvent.keyDown(field, { key: "Backspace" });
  expect(screen.queryByText("urgente")).toBeNull();
  expect(field.readOnly).toBe(false);
});

test("pasting a comma-separated list becomes one chip per item, without going past the cap", () => {
  let current: string[] = [];
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      defaultValue={["a"]}
      max={3}
      onValueChange={(next) => {
        current = next;
      }}
    />,
  );
  const field = screen.getByLabelText("Marcadores") as HTMLInputElement;

  fireEvent.paste(field, { clipboardData: { getData: () => "a, b, c, d" } });
  expect(current).toEqual(["a", "b", "c"]);
  expect(field.value).toBe("");
});

test("pasting text without a separator follows the field's usual path", () => {
  withTheme(<TagsInput aria-label="Marcadores" />);
  const field = screen.getByLabelText("Marcadores");

  const event = fireEvent.paste(field, { clipboardData: { getData: () => "urgente" } });
  expect(event).toBe(true);
});

test("with name, the native form receives the chips, not the draft", () => {
  const { container } = withTheme(
    <form>
      <TagsInput aria-label="Marcadores" name="marcadores" defaultValue={["nf-e", "urgente"]} />
    </form>,
  );
  fireEvent.change(screen.getByLabelText("Marcadores"), { target: { value: "meio" } });

  const data = new FormData(container.querySelector("form")!);
  expect(data.getAll("marcadores")).toEqual(["nf-e", "urgente"]);
});
