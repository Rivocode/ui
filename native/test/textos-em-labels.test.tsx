import { describe, expect, test } from "bun:test";

import {
  Autocomplete,
  Banner,
  Calendar,
  Combobox,
  DataList,
  DateRangePicker,
  Dialog,
  Editable,
  Field,
  Link,
  Menu,
  NumberField,
  QueryBoundary,
  Rating,
  RelativeTime,
  SearchInput,
  Select,
  Sheet,
  Slider,
  Steps,
  Tracker,
  Tree,
  TreeSelect,
} from "../src";
import { PromptInput } from "../src/ai";
import { ChartContainer } from "../src/chart/chart";
import { ColorPicker } from "../src/color-picker";
import { act, byLabel, byRole, render, textOf } from "./helpers";

describe("o texto que a peca escreve sozinha sai de labels", () => {
  test("Dialog e Sheet: o fundo que fecha se chama labels.close", () => {
    const dialog = render(
      <Dialog open onOpenChange={() => {}} title="Nota" labels={{ close: "Close" }} />,
    );
    expect(byLabel(dialog, "Close")).toHaveLength(1);
    expect(byLabel(dialog, "Fechar")).toHaveLength(0);

    const sheet = render(
      <Sheet open onOpenChange={() => {}} title="Filtros" labels={{ close: "Close sheet" }} />,
    );
    expect(byLabel(sheet, "Close sheet")).toHaveLength(1);
  });

  test("SearchInput: o xis que limpa se chama labels.clear", () => {
    const screen = render(
      <SearchInput value="acme" onValueChange={() => {}} labels={{ clear: "Clear search" }} />,
    );
    expect(byLabel(screen, "Clear search")).toHaveLength(1);
    expect(byLabel(screen, "Limpar a busca")).toHaveLength(0);
  });

  test("NumberField: os botoes de passo recebem o label e devolvem o nome", () => {
    const screen = render(
      <NumberField
        value={2}
        onValueChange={() => {}}
        label="Installments"
        labels={{
          decrement: (label) => `Decrease ${label}`,
          increment: (label) => `Increase ${label}`,
        }}
      />,
    );
    expect(byLabel(screen, "Decrease Installments")).toHaveLength(1);
    expect(byLabel(screen, "Increase Installments")).toHaveLength(1);
    expect(byLabel(screen, "Diminuir Installments")).toHaveLength(0);
  });

  test("Editable: a acao, a dica, o vazio e o cancelar saem de labels", () => {
    const screen = render(
      <Editable
        value=""
        onValueChange={() => {}}
        label="Name"
        labels={{ edit: "Edit", hint: "Long press to edit", empty: "empty", cancel: "Cancel" }}
      />,
    );
    const [preview] = byLabel(screen, "Name: empty");
    expect(preview!.props.accessibilityHint).toBe("Long press to edit");
    expect(preview!.props.accessibilityActions).toEqual([{ name: "longpress", label: "Edit" }]);

    act(() => preview!.props.onLongPress());
    expect(textOf(screen)).toContain("Cancel");
    expect(textOf(screen)).not.toContain("Cancelar");
  });

  test("DataList: a nova tentativa e a caixa de cada linha saem de labels", () => {
    const failed = render(
      <DataList
        data={undefined}
        isError
        onRetry={() => {}}
        renderItem={() => null}
        keyExtractor={(row: { id: string }) => row.id}
        labels={{ retry: "Try again" }}
      />,
    );
    expect(textOf(failed)).toContain("Try again");

    const selectable = render(
      <DataList
        data={[{ id: "1" }]}
        renderItem={() => null}
        keyExtractor={(row) => row.id}
        selectable
        value={[]}
        onValueChange={() => {}}
        labels={{ selectRow: "Select row" }}
      />,
    );
    expect(byLabel(selectable, "Select row")).toHaveLength(1);
  });

  test("QueryBoundary: a espera generica se chama labels.loading", () => {
    const screen = render(
      <QueryBoundary data={undefined} isLoading labels={{ loading: "Loading" }}>
        {() => null}
      </QueryBoundary>,
    );
    expect(byLabel(screen, "Loading")).toHaveLength(1);
    expect(byLabel(screen, "Carregando")).toHaveLength(0);
  });

  test("ColorPicker: o conjunto e o campo de texto saem de labels", () => {
    const screen = render(
      <ColorPicker
        value="#112233"
        onValueChange={() => {}}
        labels={{ swatches: "Swatches", hex: "Hex code" }}
      />,
    );
    expect(byLabel(screen, "Swatches")).toHaveLength(1);
    expect(byLabel(screen, "Hex code").length).toBeGreaterThan(0);
  });

  test("Link e Banner: a dica de saida e o xis saem de labels", () => {
    const link = render(
      <Link href="https://exemplo.com" external labels={{ external: "Opens outside the app." }}>
        Portal
      </Link>,
    );
    const [anchor] = byRole(link, "link");
    expect(anchor!.props.accessibilityHint).toBe("Opens outside the app.");

    const banner = render(
      <Banner description="Manutencao" onDismiss={() => {}} labels={{ dismiss: "Dismiss" }} />,
    );
    expect(byLabel(banner, "Dismiss")).toHaveLength(1);
  });

  test("PromptInput: os botoes de enviar e parar saem de labels", () => {
    const idle = render(
      <PromptInput
        value="oi"
        onValueChange={() => {}}
        onSubmit={() => {}}
        labels={{ submit: "Send" }}
      />,
    );
    expect(byLabel(idle, "Send")).toHaveLength(1);

    const streaming = render(
      <PromptInput
        value=""
        onValueChange={() => {}}
        onSubmit={() => {}}
        streaming
        labels={{ stop: "Stop" }}
      />,
    );
    expect(byLabel(streaming, "Stop")).toHaveLength(1);
  });


  test("ColorPicker: cada amostra em texto puro se chama labels.swatch", () => {
    const screen = render(
      <ColorPicker
        value=""
        onValueChange={() => {}}
        swatches={["#112233", { value: "#445566", label: "Marca" }]}
        labels={{ swatch: (value) => `Color ${value}` }}
      />,
    );
    expect(byLabel(screen, "Color #112233")).toHaveLength(1);
    expect(byLabel(screen, "Marca, #445566")).toHaveLength(1);
    expect(byLabel(screen, "Cor #112233")).toHaveLength(0);
  });

  test("ColorPicker: dentro de um Field o label so nomeia, e o rotulo na tela e um so", () => {
    const loose = render(<ColorPicker value="" onValueChange={() => {}} label="Brand color" />);
    expect(textOf(loose).split("Brand color").length - 1).toBe(1);

    const inside = render(
      <Field label="Brand color">
        <ColorPicker value="" onValueChange={() => {}} label="Brand color" />
      </Field>,
    );
    expect(textOf(inside).split("Brand color").length - 1).toBe(1);
    expect(byLabel(inside, "Brand color")).toHaveLength(1);
  });

  test("Calendar: as setas, o mes e as iniciais saem de labels", () => {
    const screen = render(
      <Calendar
        value="2026-09-10"
        onValueChange={() => {}}
        labels={{
          previous: "Previous month",
          next: "Next month",
          caption: (year, month) => `${month + 1}/${year}`,
          weekdays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        }}
      />,
    );
    expect(byLabel(screen, "Previous month")).toHaveLength(1);
    expect(byLabel(screen, "Next month")).toHaveLength(1);
    expect(textOf(screen)).toContain("9/2026");
    expect(textOf(screen)).toContain("Mo");
    expect(textOf(screen)).not.toContain("Setembro");
  });

  test("DateRangePicker: os botoes e o aviso da folha saem de labels", () => {
    const screen = render(
      <DateRangePicker
        value={null}
        onValueChange={() => {}}
        label="Period"
        labels={{
          clear: "Clear",
          apply: "Apply",
          pickFirst: "Tap the first day.",
          previous: "Previous month",
        }}
      />,
    );
    act(() => byRole(screen, "button")[0]!.props.onPress());
    const text = textOf(screen);
    expect(text).toContain("Clear");
    expect(text).toContain("Apply");
    expect(text).toContain("Tap the first day.");
    expect(text).not.toContain("Limpar");
    expect(byLabel(screen, "Previous month")).toHaveLength(1);
  });

  test("Select, Combobox e TreeSelect: o resumo e o botao da folha saem de labels", () => {
    const items = [
      { label: "Norte", value: "n" },
      { label: "Sul", value: "s" },
    ];
    const select = render(
      <Select
        multiple
        items={items}
        value={["n", "s"]}
        onValueChange={() => {}}
        label="Regions"
        labels={{ selected: (count) => `${count} chosen`, done: "Done" }}
      />,
    );
    expect(textOf(select)).toContain("2 chosen");
    act(() => byRole(select, "button")[0]!.props.onPress());
    expect(textOf(select)).toContain("Done");
    expect(textOf(select)).not.toContain("Concluir");

    const combobox = render(
      <Combobox
        multiple
        items={items}
        value={["n", "s"]}
        onValueChange={() => {}}
        label="Regions"
        labels={{ selected: (count) => `${count} picked` }}
      />,
    );
    expect(textOf(combobox)).toContain("2 picked");

    const tree = render(
      <TreeSelect
        items={[{ id: "a", label: "A" }, { id: "b", label: "B" }]}
        value={["a", "b"]}
        onValueChange={() => {}}
        label="Cost center"
        labels={{ selected: (count) => `${count} leaves`, empty: "Nothing", apply: "Apply" }}
      />,
    );
    expect(textOf(tree)).toContain("2 leaves");
    act(() => byRole(tree, "button")[0]!.props.onPress());
    expect(textOf(tree)).toContain("Apply");
    expect(textOf(tree)).not.toContain("Aplicar");
  });

  test("Autocomplete: a dica, a contagem falada e o botao saem de labels", () => {
    const screen = render(
      <Autocomplete
        items={["Recife", "Olinda"]}
        value=""
        onValueChange={() => {}}
        label="City"
        labels={{ hint: "Opens suggestions.", count: (count) => `${count} hits`, done: "Done" }}
      />,
    );
    const [field] = byRole(screen, "combobox");
    expect(field!.props.accessibilityHint).toBe("Opens suggestions.");
    act(() => field!.props.onPress());
    expect(byLabel(screen, "2 hits")).toHaveLength(1);
    expect(textOf(screen)).toContain("Done");
  });

  test("Tree: voltar, marcar tudo, o galho e a dica saem de labels", () => {
    const screen = render(
      <Tree
        multiple
        items={[{ id: "g", label: "Group", children: [{ id: "a", label: "A" }] }]}
        value={[]}
        onValueChange={() => {}}
        label="Root"
        labels={{
          back: (name) => `Back to ${name}`,
          selectAll: (name) => `Select all in ${name}`,
          branch: (name, total) => `${name}, ${total} leaves`,
          enter: "Opens the level",
        }}
      />,
    );
    expect(byLabel(screen, "Select all in Group")).toHaveLength(1);
    const [branch] = byLabel(screen, "Group, 1 leaves");
    expect(branch!.props.accessibilityHint).toBe("Opens the level");
    act(() => branch!.props.onPress());
    expect(byLabel(screen, "Back to Root")).toHaveLength(1);
  });

  test("Slider, Rating e Tracker: as acoes de ajuste saem de labels", () => {
    const actionsOf = (screen: ReturnType<typeof render>) =>
      byRole(screen, "adjustable")[0]!.props.accessibilityActions.map(
        (action: { label: string }) => action.label,
      );

    const slider = render(
      <Slider
        value={10}
        onValueChange={() => {}}
        label="Volume"
        labels={{ increment: "Up", decrement: "Down" }}
      />,
    );
    expect(actionsOf(slider)).toEqual(["Up", "Down"]);

    const rating = render(
      <Rating value={3} onValueChange={() => {}} labels={{ increment: "More", decrement: "Less" }} />,
    );
    expect(actionsOf(rating)).toEqual(["More", "Less"]);

    const tracker = render(
      <Tracker
        data={[{ label: "ok" }, { label: "falhou" }]}
        label="Uptime"
        labels={{ next: "Next day", previous: "Previous day" }}
      />,
    );
    expect(actionsOf(tracker)).toEqual(["Next day", "Previous day"]);
  });

  test("Menu: a acao e a dica do toque longo saem de labels", () => {
    const screen = render(
      <Menu
        open={false}
        onOpenChange={() => {}}
        title="Nota 4813"
        actions={[{ label: "Cancelar", onSelect: () => {} }]}
        labels={{ open: "Open actions", hint: (title) => `Long press for ${title}` }}
      >
        <></>
      </Menu>,
    );
    const [trigger] = byRole(screen, "button");
    expect(trigger!.props.accessibilityHint).toBe("Long press for Nota 4813");
    expect(trigger!.props.accessibilityActions).toEqual([
      { name: "longpress", label: "Open actions" },
    ]);
  });

  test("Steps e RelativeTime: a contagem e a distancia saem de labels", () => {
    const steps = render(
      <Steps
        steps={[
          { id: "a", title: "Dados" },
          { id: "b", title: "Pagamento" },
        ]}
        step={1}
        labels={{ position: (step, total) => `Step ${step} of ${total}` }}
      />,
    );
    expect(textOf(steps)).toContain("Step 2 of 2");
    expect(textOf(steps)).not.toContain("Passo");

    const now = new Date(2026, 8, 25, 12);
    const time = render(
      <RelativeTime
        value={new Date(2026, 8, 25, 9)}
        now={now}
        labels={{ past: (amount, unit) => `${amount} ${unit}s ago` }}
      />,
    );
    expect(textOf(time)).toContain("3 hours ago");
  });

  test("ChartContainer: o nome montado das series sai de labels.name", () => {
    const chart = render(
      <ChartContainer
        config={{ total: { label: "Revenue" } }}
        labels={{ name: (series) => `Chart of ${series.join(", ")}` }}
      >
        {() => null}
      </ChartContainer>,
    );
    expect(byLabel(chart, "Chart of Revenue")).toHaveLength(1);
  });
});
