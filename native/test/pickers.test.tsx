import { afterAll, beforeAll, describe, expect, mock, setSystemTime, test } from "bun:test";

import {
  Calendar,
  Combobox,
  DatePicker,
  DateRangePicker,
  Menu,
  Slider,
  Text,
  formatDate,
} from "../src";
import { act, byLabel, byRole, render, textOf } from "./helpers";

describe("Combobox", () => {
  const items = [
    { label: "Clínica São Lucas", value: "1" },
    { label: "Transportes Cabo Branco", value: "2" },
  ];

  test("opens with search, filters ignoring accents, and choosing closes", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Combobox items={items} value={null} onValueChange={onValueChange} label="Cliente" />,
    );

    act(() => byLabel(screen, "Cliente")[0].props.onPress());
    expect(textOf(screen)).toContain("Transportes Cabo Branco");

    const search = screen.root.findByType("TextInput" as never);
    act(() => search.props.onChangeText("clinica"));
    expect(textOf(screen)).toContain("Clínica São Lucas");
    expect(textOf(screen)).not.toContain("Transportes Cabo Branco");

    const option = byRole(screen, "button").find(
      (node) => node.props.accessibilityState?.selected === false,
    );
    act(() => option!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("1");
  });

  test("multiple: choosing checks and keeps the sheet and the search up", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Combobox
        items={items}
        multiple
        value={["1"]}
        onValueChange={onValueChange}
        label="Clientes"
      />,
    );
    act(() => byLabel(screen, "Clientes")[0].props.onPress());

    const option = byRole(screen, "checkbox").find(
      (node) => node.props.accessibilityState?.checked === false,
    );
    act(() => option!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["1", "2"]);
    // Sheet open and search in place: the next name can be typed.
    expect(textOf(screen)).toContain("Clínica São Lucas");
  });

  test("multiple: the trigger counts how many, and with only one says the name", () => {
    const two = render(
      <Combobox
        items={items}
        multiple
        value={["1", "2"]}
        onValueChange={() => {}}
        label="Clientes"
      />,
    );
    expect(textOf(two)).toContain("2 selecionados");
    expect(byLabel(two, "Clientes")[0].props.accessibilityValue.text).toBe("2 selecionados");

    const one = render(
      <Combobox items={items} multiple value={["2"]} onValueChange={() => {}} label="Clientes" />,
    );
    expect(textOf(one)).toContain("Transportes Cabo Branco");
  });

  test("a search with no result explains, instead of vanishing silently", () => {
    const screen = render(
      <Combobox items={items} value={null} onValueChange={() => {}} label="Cliente" />,
    );
    act(() => byLabel(screen, "Cliente")[0].props.onPress());
    const search = screen.root.findByType("TextInput" as never);
    act(() => search.props.onChangeText("zzz"));
    expect(textOf(screen)).toContain("Confira a grafia");
  });
});

describe("Calendar and DatePicker", () => {
  test("formatDate speaks the local format", () => {
    expect(formatDate("2026-08-25")).toBe("25/08/2026");
  });

  test("choosing a day delivers that day's ISO", () => {
    const onValueChange = mock(() => {});
    const screen = render(<Calendar value="2026-08-10" onValueChange={onValueChange} />);
    expect(textOf(screen)).toContain("Agosto de 2026");

    act(() => byLabel(screen, "25/08/2026")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("2026-08-25");
  });

  test("outside the limits the day turns off", () => {
    const screen = render(
      <Calendar value="2026-08-10" onValueChange={() => {}} min="2026-08-05" max="2026-08-20" />,
    );
    expect(byLabel(screen, "04/08/2026")[0].props.accessibilityState.disabled).toBe(true);
    expect(byLabel(screen, "12/08/2026")[0].props.accessibilityState.disabled).toBe(false);
  });

  test("DatePicker shows the formatted date and closes on choosing", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <DatePicker value="2026-08-10" onValueChange={onValueChange} label="Vencimento" />,
    );
    expect(textOf(screen)).toContain("10/08/2026");

    act(() => byLabel(screen, "Vencimento")[0].props.onPress());
    act(() => byLabel(screen, "15/08/2026")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("2026-08-15");
    // Closed: the calendar is no longer mounted.
    expect(byLabel(screen, "15/08/2026").length).toBe(0);
  });
});

describe("Slider", () => {
  test("announces role and value, and responds to the screen reader actions", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Slider value={40} onValueChange={onValueChange} min={0} max={100} step={10} label="Meta" />,
    );

    const [slider] = byRole(screen, "adjustable");
    expect(slider.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });

    act(() => slider.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
    expect(onValueChange).toHaveBeenCalledWith(50);
    act(() => slider.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
    expect(onValueChange).toHaveBeenCalledWith(30);
  });
});

describe("Menu", () => {
  test("acting closes before acting, and the danger tone wears red", () => {
    const calls: string[] = [];
    const screen = render(
      <Menu
        open
        onOpenChange={(next) => calls.push(`open:${next}`)}
        title="Nota 4813"
        actions={[
          { label: "Baixar o PDF", onSelect: () => calls.push("pdf") },
          { label: "Cancelar nota", tone: "danger", onSelect: () => calls.push("cancelar") },
        ]}
      />,
    );

    expect(textOf(screen)).toContain("Baixar o PDF");
    const danger = byRole(screen, "button").find((node) =>
      /text-danger-text/.test(String(node.children?.[0]?.props?.className ?? "")),
    );

    const [first] = byRole(screen, "button").filter((node) => node.props.onPress);
    act(() => first.props.onPress());
    expect(calls[0]).toBe("open:false");
    expect(danger).toBeDefined();
  });

  const acoes = [{ label: "Baixar o PDF", onSelect: () => {} }];

  test("children becomes the long-press area, and the long press opens", () => {
    const calls: string[] = [];
    const screen = render(
      <Menu
        open={false}
        onOpenChange={(next) => calls.push(`open:${next}`)}
        title="Nota 4813"
        actions={acoes}
        classNames={{ trigger: "flex-1" }}
      >
        <Text>Nota 4813</Text>
      </Menu>,
    );

    const trigger = byRole(screen, "button").find((node) => node.props.onLongPress);
    expect(trigger).toBeDefined();
    expect(String(trigger!.props.className).split(" ")).toContain("flex-1");
    expect(textOf(screen)).toContain("Nota 4813");
    expect(textOf(screen)).not.toContain("Baixar o PDF");

    act(() => trigger!.props.onLongPress());
    expect(calls).toEqual(["open:true"]);
  });

  test("the screen reader has the same door, through the longpress action", () => {
    const calls: string[] = [];
    const screen = render(
      <Menu
        open={false}
        onOpenChange={(next) => calls.push(`open:${next}`)}
        title="Nota 4813"
        actions={acoes}
      >
        <Text>Nota 4813</Text>
      </Menu>,
    );

    const trigger = byRole(screen, "button").find((node) => node.props.onLongPress)!;
    const names = (trigger.props.accessibilityActions as { name: string }[]).map((one) => one.name);
    expect(names).toContain("longpress");
    expect(String(trigger.props.accessibilityHint)).toContain("segure");

    act(() => trigger.props.onAccessibilityAction({ nativeEvent: { actionName: "longpress" } }));
    expect(calls).toEqual(["open:true"]);

    act(() => trigger.props.onAccessibilityAction({ nativeEvent: { actionName: "activate" } }));
    expect(calls).toEqual(["open:true"]);
  });

  test("without children no long-press area is created", () => {
    const screen = render(
      <Menu open onOpenChange={() => {}} title="Nota 4813" actions={acoes} />,
    );

    expect(byRole(screen, "button").filter((node) => node.props.onLongPress)).toHaveLength(0);
  });
});

describe("DateRangePicker", () => {
  beforeAll(() => setSystemTime(new Date("2026-08-15T12:00:00")));
  afterAll(() => setSystemTime());

  const open = (screen: ReturnType<typeof render>) =>
    act(() => byLabel(screen, "Período")[0].props.onPress());

  /* The native Button carries no accessibilityLabel: its name is the inner
     Text, as on the device. So the test locator looks for it. */
  const buttonWith = (screen: ReturnType<typeof render>, text: string) =>
    byRole(screen, "button").find(
      (node) =>
        node.findAll((child) => child.type === "Text" && child.props.children === text).length > 0,
    )!;

  test("the trigger shows the range spelled out, and empty falls back to the placeholder", () => {
    const vazio = render(<DateRangePicker value={null} onValueChange={() => {}} label="Período" />);
    expect(textOf(vazio)).toContain("Escolha o período");

    const cheio = render(
      <DateRangePicker
        value={{ from: "2026-08-05", to: "2026-08-20" }}
        onValueChange={() => {}}
        label="Período"
      />,
    );
    expect(textOf(cheio)).toContain("05/08/2026 – 20/08/2026");
    expect(byLabel(cheio, "Período")[0].props.accessibilityValue.text).toBe(
      "05/08/2026 – 20/08/2026",
    );
  });

  test("both ends come from the same grid, and the piece orders the taps", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <DateRangePicker value={null} onValueChange={onValueChange} label="Período" />,
    );

    open(screen);
    expect(textOf(screen)).toContain("Toque no primeiro dia");

    // End before start: the finger taps 20 and then 5.
    act(() => byLabel(screen, "20/08/2026")[0].props.onPress());
    expect(textOf(screen)).toContain("20/08/2026 – toque no último dia.");

    act(() => byLabel(screen, "05/08/2026")[0].props.onPress());
    // It comes out ordered: the end-before-start validation is no longer the app's job.
    expect(textOf(screen)).toContain("05/08/2026 – 20/08/2026");

    // The middle of the range also announces itself as chosen: the painted
    // band does not exist for whoever listens to the grid.
    expect(byLabel(screen, "12/08/2026")[0].props.accessibilityState.selected).toBe(true);
    expect(byLabel(screen, "25/08/2026")[0].props.accessibilityState.selected).toBe(false);

    // Nothing went out yet: the button is what applies.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("Aplicar only turns on with both ends, and delivers the closed range", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <DateRangePicker value={null} onValueChange={onValueChange} label="Período" />,
    );

    open(screen);
    const aplicar = () => buttonWith(screen, "Aplicar");
    expect(aplicar().props.disabled).toBe(true);

    act(() => byLabel(screen, "05/08/2026")[0].props.onPress());
    // With half a choice it stays off: the listing never gets a period that
    // starts and does not end.
    expect(aplicar().props.disabled).toBe(true);

    act(() => byLabel(screen, "09/08/2026")[0].props.onPress());
    expect(aplicar().props.disabled).toBe(false);

    act(() => aplicar().props.onPress());
    expect(onValueChange).toHaveBeenCalledWith({ from: "2026-08-05", to: "2026-08-09" });
    // Closed: the grid is no longer mounted.
    expect(byLabel(screen, "09/08/2026").length).toBe(0);
  });

  test("Limpar delivers null, and the limits keep turning the day off", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <DateRangePicker
        value={{ from: "2026-08-05", to: "2026-08-20" }}
        onValueChange={onValueChange}
        label="Período"
        min="2026-08-03"
      />,
    );

    open(screen);
    expect(byLabel(screen, "02/08/2026")[0].props.accessibilityState.disabled).toBe(true);

    act(() => buttonWith(screen, "Limpar").props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  test("the third tap restarts the range instead of stretching the previous one", () => {
    const screen = render(
      <DateRangePicker value={null} onValueChange={() => {}} label="Período" />,
    );

    open(screen);
    act(() => byLabel(screen, "05/08/2026")[0].props.onPress());
    act(() => byLabel(screen, "09/08/2026")[0].props.onPress());
    act(() => byLabel(screen, "15/08/2026")[0].props.onPress());

    expect(textOf(screen)).toContain("15/08/2026 – toque no último dia.");
  });
});
