import { describe, expect, test } from "bun:test";

import {
  Banner,
  DataList,
  Dialog,
  Editable,
  Link,
  NumberField,
  QueryBoundary,
  SearchInput,
  Sheet,
} from "../src";
import { PromptInput } from "../src/ai";
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
});
