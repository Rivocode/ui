import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { Field, FieldLabel } from "../src/components/field";
import { RivoProvider } from "../src/provider/rivo-provider";
import { TimeField } from "../src/components/time-field";
import { TimePicker } from "../src/components/time-picker";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

function field() {
  return screen.getByPlaceholderText("hh:mm") as HTMLInputElement;
}

function open() {
  fireEvent.click(screen.getByLabelText("Abrir seletor de horário"));
}

function optionsOf(name: string) {
  const column = screen.getByRole("listbox", { name });
  return [...column.querySelectorAll('[role="option"]')].map((node) => node.textContent);
}

test("typing inserts the colon by itself", () => {
  withTheme(<TimeField aria-label="Entrada" />);

  fireEvent.change(field(), { target: { value: "1430" } });

  expect(field().value).toBe("14:30");
});

test("a half-typed time notifies no one yet", () => {
  let calls = 0;
  withTheme(<TimeField aria-label="Entrada" onValueChange={() => calls++} />);

  fireEvent.change(field(), { target: { value: "14" } });

  expect(calls).toBe(0);
});

test("a complete time reaches the listener, and always with two digits", () => {
  let received = "";
  withTheme(<TimeField aria-label="Entrada" onValueChange={(hora) => (received = hora)} />);

  fireEvent.change(field(), { target: { value: "0805" } });

  expect(received).toBe("08:05");
});

test("25:99 becomes no value at all, and the field marks itself invalid right away", () => {
  let calls = 0;
  withTheme(<TimeField aria-label="Entrada" onValueChange={() => calls++} />);

  fireEvent.change(field(), { target: { value: "2599" } });

  expect(field().value).toBe("25:99");
  expect(field().getAttribute("aria-invalid")).toBe("true");
  expect(calls).toBe(0);
});

test("impossible text reverts to the last valid time on leaving the field", () => {
  withTheme(<TimeField aria-label="Entrada" defaultValue="08:00" />);

  fireEvent.change(field(), { target: { value: "2599" } });
  fireEvent.blur(field());

  expect(field().value).toBe("08:00");
  expect(field().getAttribute("aria-invalid")).toBeNull();
});

test("clearing the field clears the value", () => {
  let received = "08:00";
  withTheme(
    <TimeField
      aria-label="Entrada"
      defaultValue="08:00"
      onValueChange={(hora) => (received = hora)}
    />,
  );

  fireEvent.change(field(), { target: { value: "" } });

  expect(received).toBe("");
});

test("arrow up lands on the step grid, and does not add the raw step", () => {
  withTheme(<TimeField aria-label="Entrada" defaultValue="14:07" step={15} />);

  fireEvent.keyDown(field(), { key: "ArrowUp" });

  expect(field().value).toBe("14:15");
});

test("arrow down stops at the first time of the window", () => {
  withTheme(<TimeField aria-label="Entrada" defaultValue="08:10" step={15} min="08:00" />);

  fireEvent.keyDown(field(), { key: "ArrowDown" });

  expect(field().value).toBe("08:00");
});

test("with the field empty, arrow up starts at the window opening", () => {
  withTheme(<TimeField aria-label="Entrada" min="09:30" max="18:00" />);

  fireEvent.keyDown(field(), { key: "ArrowUp" });

  expect(field().value).toBe("09:30");
});

test("a time outside the window reaches the listener, and the field says it is outside", () => {
  let received = "";
  withTheme(
    <TimeField
      aria-label="Entrada"
      min="08:00"
      max="18:00"
      onValueChange={(hora) => (received = hora)}
    />,
  );

  fireEvent.change(field(), { target: { value: "0700" } });

  expect(received).toBe("07:00");
  expect(field().getAttribute("aria-invalid")).toBe("true");
});

test("a typed time off the step grid is still valid", () => {
  let received = "";
  withTheme(
    <TimeField aria-label="Entrada" step={30} onValueChange={(hora) => (received = hora)} />,
  );

  fireEvent.change(field(), { target: { value: "1407" } });

  expect(received).toBe("14:07");
  expect(field().getAttribute("aria-invalid")).toBeNull();
});

test("with name, the native form receives the complete time and never the half-typed text", () => {
  const { container } = withTheme(<TimeField aria-label="Entrada" name="entrada" />);

  fireEvent.change(field(), { target: { value: "08" } });
  const hidden = container.querySelector('input[type="hidden"][name="entrada"]');
  expect((hidden as HTMLInputElement).value).toBe("");

  fireEvent.change(field(), { target: { value: "0830" } });
  expect((hidden as HTMLInputElement).value).toBe("08:30");
});

test("the field mirrors a time changed from outside", () => {
  function Controlled() {
    const [hora, setHora] = useState("08:00");
    return (
      <RivoProvider scope="local">
        <TimeField aria-label="Entrada" value={hora} onValueChange={setHora} />
        <button onClick={() => setHora("19:45")}>Fechamento</button>
      </RivoProvider>
    );
  }
  render(<Controlled />);

  fireEvent.click(screen.getByText("Fechamento"));

  expect(field().value).toBe("19:45");
});

test("a disabled field does not accept typing", () => {
  withTheme(<TimeField aria-label="Entrada" disabled />);

  expect(field().disabled).toBe(true);
});

test("the panel opens from the field's clock, with both columns", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();

  expect(screen.getByRole("listbox", { name: "Hora" })).toBeDefined();
  expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();
});

test("the step decides how many minutes the column offers", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" step={15} />);

  open();

  expect(optionsOf("Minuto")).toEqual(["00", "15", "30", "45"]);
});

test("the window trims the offered hours, instead of only warning afterwards", () => {
  withTheme(<TimePicker aria-label="Entrega" min="08:00" max="10:00" step={30} />);

  open();

  expect(optionsOf("Hora")).toEqual(["08", "09", "10"]);
});

test("the last hour of the window only offers the minutes that fit in it", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="10:00" min="08:00" max="10:00" />);

  open();

  expect(optionsOf("Minuto")).toEqual(["00"]);
});

test("picking the hour keeps the already chosen minute", () => {
  let received = "";
  withTheme(
    <TimePicker
      aria-label="Entrega"
      defaultValue="14:30"
      onValueChange={(hora) => (received = hora)}
    />,
  );

  open();
  fireEvent.click(screen.getByRole("option", { name: "16" }));

  expect(received).toBe("16:30");
});

test("the hour does not close the panel, and the minute does", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  fireEvent.click(screen.getByRole("option", { name: "16" }));
  expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();

  fireEvent.click(screen.getByRole("option", { name: "45" }));
  expect(screen.queryByRole("listbox", { name: "Minuto" })).toBeNull();
});

test("the time picked in the panel comes back written in the field", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  fireEvent.click(screen.getByRole("option", { name: "45" }));

  expect(field().value).toBe("14:45");
});

test("with the field empty, the chosen minute lands on the first hour of the window", () => {
  let received = "";
  withTheme(
    <TimePicker
      aria-label="Entrega"
      min="09:00"
      max="18:00"
      onValueChange={(hora) => (received = hora)}
    />,
  );

  open();
  fireEvent.click(screen.getByRole("option", { name: "30" }));

  expect(received).toBe("09:30");
});

test("the arrow in the column moves focus without committing any value", () => {
  let calls = 0;
  withTheme(
    <TimePicker aria-label="Entrega" defaultValue="14:30" onValueChange={() => calls++} />,
  );

  open();
  const column = screen.getByRole("listbox", { name: "Minuto" });
  fireEvent.keyDown(column, { key: "ArrowDown" });

  expect(calls).toBe(0);
  expect(field().value).toBe("14:30");
  expect(document.activeElement?.textContent).toBe("45");
  expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();
});

test("moving from 08 to 18 in the hours column fires no query at all", () => {
  let calls = 0;
  withTheme(
    <TimePicker aria-label="Entrega" defaultValue="08:00" onValueChange={() => calls++} />,
  );

  open();
  const column = screen.getByRole("listbox", { name: "Hora" });
  for (let presses = 0; presses < 10; presses += 1) fireEvent.keyDown(column, { key: "ArrowDown" });

  expect(calls).toBe(0);
  expect(document.activeElement?.textContent).toBe("18");
});

test("Enter on the focused option is what commits, and then the minute closes the panel", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  const column = screen.getByRole("listbox", { name: "Minuto" });
  fireEvent.keyDown(column, { key: "ArrowDown" });
  fireEvent.click(document.activeElement as HTMLElement);

  expect(field().value).toBe("14:45");
  expect(screen.queryByRole("listbox", { name: "Minuto" })).toBeNull();
});

test("an option that is only focused does not announce itself as chosen", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  fireEvent.keyDown(screen.getByRole("listbox", { name: "Minuto" }), { key: "ArrowDown" });

  expect(document.activeElement?.getAttribute("aria-selected")).toBe("false");
  expect(screen.getByRole("option", { name: "30" }).getAttribute("aria-selected")).toBe("true");
});

test("the column says which option is chosen, and does not just paint it", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  const marked = screen
    .getAllByRole("option")
    .filter((node) => node.getAttribute("aria-selected") === "true")
    .map((node) => node.textContent);

  expect(marked).toEqual(["14", "30"]);
});

test("a disabled clock does not open the panel", () => {
  withTheme(<TimePicker aria-label="Entrega" disabled />);

  open();

  expect(screen.queryByRole("listbox", { name: "Hora" })).toBeNull();
});

test("a time from outside without the leading zero shows with two digits", () => {
  withTheme(<TimeField aria-label="Entrada" value="8:00" />);

  expect(field().value).toBe("08:00");
});

test("an inverted window is ignored, and the field accepts the whole day", () => {
  withTheme(<TimeField aria-label="Entrada" min="22:00" max="06:00" />);

  fireEvent.change(field(), { target: { value: "1400" } });

  expect(field().getAttribute("aria-invalid")).toBeNull();
});

test("on a narrow screen the panel rises as a sheet, with the same columns", () => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);
    open();

    expect(screen.getByLabelText("Escolher horário")).toBeDefined();
    expect(screen.getByRole("listbox", { name: "Hora" })).toBeDefined();
    expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();
  } finally {
    window.matchMedia = original;
  }
});

test("an impossible time from outside also marks the field, without anyone typing", () => {
  withTheme(<TimeField aria-label="Entrada" value="25:99" />);

  expect(field().getAttribute("aria-invalid")).toBe("true");
});

test("changing the hour keeps a minute typed off the grid", () => {
  let received = "";
  withTheme(
    <TimePicker
      aria-label="Entrega"
      defaultValue="14:07"
      step={15}
      onValueChange={(hora) => (received = hora)}
    />,
  );

  open();
  fireEvent.click(screen.getByRole("option", { name: "16" }));

  expect(received).toBe("16:07");
});

test("a time outside the window does not leave the minutes column empty", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="07:00" min="08:00" max="18:00" />);

  open();

  expect(optionsOf("Minuto").length).toBeGreaterThan(0);
});

test("picking the hour at the end of the window does not exceed the maximum", () => {
  let received = "";
  withTheme(
    <TimePicker
      aria-label="Entrega"
      defaultValue="09:30"
      min="08:00"
      max="10:00"
      onValueChange={(hora) => (received = hora)}
    />,
  );

  open();
  fireEvent.click(screen.getByRole("option", { name: "10" }));

  expect(received).toBe("10:00");
});

async function onPhoneWaiting(body: () => Promise<void>) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    await body();
  } finally {
    window.matchMedia = original;
  }
}

function onPhone(body: () => void) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    body();
  } finally {
    window.matchMedia = original;
  }
}

function stepper(name: string) {
  return screen.getByRole("button", { name });
}

test("on a narrow screen the field gets both step buttons, since the arrow cannot be reached by finger", () => {
  onPhone(() => {
    withTheme(<TimeField aria-label="Entrada" defaultValue="14:07" step={15} />);

    fireEvent.click(stepper("Aumentar Entrada"));

    expect(field().value).toBe("14:15");
  });
});

test("the minus button lands on the step grid, and does not subtract the raw step", () => {
  onPhone(() => {
    withTheme(<TimeField aria-label="Entrada" defaultValue="14:07" step={15} />);

    fireEvent.click(stepper("Diminuir Entrada"));

    expect(field().value).toBe("14:00");
  });
});

test("the button moves exactly where the arrow would", () => {
  onPhone(() => {
    withTheme(<TimeField aria-label="Entrada" defaultValue="09:20" step={30} />);
    fireEvent.click(stepper("Aumentar Entrada"));
    const byButtons = field().value;

    withTheme(<TimeField aria-label="Saída" defaultValue="09:20" step={30} />);
    const second = screen.getAllByPlaceholderText("hh:mm")[1] as HTMLInputElement;
    fireEvent.keyDown(second, { key: "ArrowUp" });

    expect(second.value).toBe(byButtons);
  });
});

test("the step button respects the window, as the arrow does", () => {
  onPhone(() => {
    withTheme(<TimeField aria-label="Entrada" defaultValue="08:10" step={15} min="08:00" />);

    fireEvent.click(stepper("Diminuir Entrada"));

    expect(field().value).toBe("08:00");
  });
});

test("with the field empty, the plus button starts at the window opening", () => {
  onPhone(() => {
    withTheme(<TimeField aria-label="Entrada" min="09:30" max="18:00" />);

    fireEvent.click(stepper("Aumentar Entrada"));

    expect(field().value).toBe("09:30");
  });
});

test("the buttons carry the field name, so two times on screen do not become two Aumentar", () => {
  onPhone(() => {
    withTheme(
      <>
        <TimeField aria-label="Entrada" defaultValue="08:00" />
        <TimeField aria-label="Saída" defaultValue="17:00" />
      </>,
    );

    fireEvent.click(stepper("Aumentar Saída"));

    expect(screen.getAllByPlaceholderText("hh:mm")[0]).toHaveProperty("value", "08:00");
    expect(screen.getAllByPlaceholderText("hh:mm")[1]).toHaveProperty("value", "17:15");
  });
});

test("the step button is finger-wide, and the frame never shrinks below the target", () => {
  onPhone(() => {
    withTheme(<TimeField aria-label="Entrada" size="sm" defaultValue="08:00" />);

    const minus = stepper("Diminuir Entrada");
    expect(minus.className).toContain("w-11");
    expect(minus.parentElement?.className).toContain("min-h-11");
  });
});

test("a disabled field does not move through the buttons", () => {
  onPhone(() => {
    withTheme(<TimeField aria-label="Entrada" defaultValue="08:00" disabled />);

    const plus = stepper("Aumentar Entrada") as HTMLButtonElement;
    expect(plus.disabled).toBe(true);

    fireEvent.click(plus);
    expect(field().value).toBe("08:00");
  });
});

test("typing still governs the value with the buttons on screen", () => {
  onPhone(() => {
    let received = "";
    withTheme(
      <TimeField aria-label="Entrada" onValueChange={(hora) => (received = hora)} name="entrada" />,
    );

    fireEvent.change(field(), { target: { value: "2599" } });
    expect(received).toBe("");
    expect(field().getAttribute("aria-invalid")).toBe("true");

    fireEvent.change(field(), { target: { value: "0830" } });
    expect(received).toBe("08:30");
  });
});

test("an impossible time paints the whole frame, and not a borderless field inside it", () => {
  onPhone(() => {
    withTheme(<TimeField aria-label="Entrada" value="25:99" />);

    expect(stepper("Diminuir Entrada").parentElement?.className).toContain("border-danger");
  });
});

test("on desktop the field stays without buttons, and the arrow is still the way", () => {
  withTheme(<TimeField aria-label="Entrada" defaultValue="14:07" step={15} />);

  expect(screen.queryByRole("button", { name: "Aumentar Entrada" })).toBeNull();

  fireEvent.keyDown(field(), { key: "ArrowUp" });
  expect(field().value).toBe("14:15");
});

test("inside the picker the field gets no buttons: the panel is already the finger's way to step", () => {
  onPhone(() => {
    withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

    expect(screen.queryByRole("button", { name: /Aumentar/ })).toBeNull();

    open();
    expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();
  });
});

test("the column name comes from the text on screen, and not from a copy of it", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();

  for (const name of ["Hora", "Minuto"]) {
    const column = screen.getByRole("listbox", { name });
    expect(column.getAttribute("aria-label")).toBeNull();

    const source = document.getElementById(column.getAttribute("aria-labelledby")!)!;
    expect(source.textContent).toBe(name);
    expect(source.getAttribute("aria-hidden")).toBe("true");
  }
});

test("the button inherits the label's name, and not only aria-label's", async () => {
  await onPhoneWaiting(async () => {
    withTheme(
      <Field>
        <FieldLabel htmlFor="entrada">Entrada</FieldLabel>
        <TimeField id="entrada" defaultValue="08:00" />
      </Field>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Aumentar Entrada" }));

    expect(field().value).toBe("08:15");
  });
});

test("a loose label element also reaches the button, with no Field around", () => {
  onPhone(() => {
    withTheme(
      <>
        <label htmlFor="almoco">Almoço</label>
        <TimeField id="almoco" defaultValue="12:00" />
      </>,
    );

    expect(stepper("Diminuir Almoço")).toBeDefined();
  });
});

test("two labeled times on screen do not become four buttons with two names", async () => {
  await onPhoneWaiting(async () => {
    withTheme(
      <>
        <Field>
          <FieldLabel htmlFor="entrada">Entrada</FieldLabel>
          <TimeField id="entrada" defaultValue="08:00" />
        </Field>
        <Field>
          <FieldLabel htmlFor="saida">Saída</FieldLabel>
          <TimeField id="saida" defaultValue="17:00" />
        </Field>
      </>,
    );

    const later = await screen.findByRole("button", { name: "Aumentar Saída" });
    const names = screen.getAllByRole("button").map((node) => node.getAttribute("aria-label"));
    expect(new Set(names).size).toBe(4);

    fireEvent.click(later);
    const fields = screen.getAllByPlaceholderText("hh:mm") as HTMLInputElement[];
    expect(fields[0]!.value).toBe("08:00");
    expect(fields[1]!.value).toBe("17:15");
  });
});

test("a field with no label at all invents no name for the button", () => {
  onPhone(() => {
    withTheme(<TimeField defaultValue="08:00" />);

    expect(stepper("Aumentar")).toBeDefined();
  });
});

test("the live region exists before the time changes, otherwise the first step is silent", () => {
  onPhone(() => {
    const { container } = withTheme(<TimeField aria-label="Entrada" defaultValue="08:00" />);

    const region = container.querySelector('[role="status"][aria-live="polite"]')!;
    expect(region).not.toBeNull();
    expect(region.textContent).toBe("");
  });
});

test("a step by button says out loud the time it stopped at", () => {
  onPhone(() => {
    const { container } = withTheme(<TimeField aria-label="Entrada" defaultValue="08:00" />);

    fireEvent.click(stepper("Aumentar Entrada"));

    expect(container.querySelector('[role="status"]')!.textContent).toBe("08:15");
  });
});

test("the keyboard arrow announces as the button does, and focus stays where it was", () => {
  const { container } = withTheme(
    <TimeField aria-label="Entrada" defaultValue="14:07" step={15} />,
  );

  fireEvent.keyDown(field(), { key: "ArrowUp" });

  expect(container.querySelector('[role="status"]')!.textContent).toBe("14:15");
});

test("typing announces nothing: whoever types already hears their own keyboard", () => {
  const { container } = withTheme(<TimeField aria-label="Entrada" />);

  fireEvent.change(field(), { target: { value: "0830" } });

  expect(container.querySelector('[role="status"]')!.textContent).toBe("");
});

test("inside a Field with name, the native form receives only the complete time, and never the screen text", () => {
  const { container } = withTheme(
    <form>
      <Field name="entrada">
        <FieldLabel>Entrada</FieldLabel>
        <TimeField name="entrada" defaultValue="08:30" />
      </Field>
      <Field name="saida">
        <FieldLabel>Saída</FieldLabel>
        <TimeField defaultValue="18:00" />
      </Field>
    </form>,
  );
  const data = new FormData(container.querySelector("form")!);
  expect(data.getAll("entrada")).toEqual(["08:30"]);
  expect(data.getAll("saida")).toEqual(["18:00"]);
  expect(screen.getByLabelText("Entrada").hasAttribute("name")).toBe(false);
});

test("disabled, the time field stays out of the native form", () => {
  const { container } = withTheme(
    <form>
      <TimeField aria-label="Entrada" name="entrada" defaultValue="08:30" disabled />
    </form>,
  );
  const data = new FormData(container.querySelector("form")!);
  expect(data.has("entrada")).toBe(false);
});
