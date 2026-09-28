import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Combobox, ComboboxInput } from "../src/components/combobox";
import { Field, Input, Textarea } from "../src/components/field";
import { Select, SelectTrigger, SelectValue } from "../src/components/select";

const SIZES = ["sm", "md", "lg"] as const;

const tokens = (element: Element) => element.className.split(" ");

const OPTIONS = [{ label: "Abertas", value: "abertas" }];

function inputTokens(size: (typeof SIZES)[number]) {
  const { unmount } = render(
    <RivoProvider scope="local">
      <Field>
        <Input aria-label="Medida" size={size} />
      </Field>
    </RivoProvider>,
  );
  const found = tokens(screen.getByLabelText("Medida")).filter((token) =>
    /^(h-\[var|px-\[var|text-(sm|base|md)$)/.test(token),
  );
  unmount();
  return found;
}

test("o Select, o Combobox e o Textarea falam o size do Input, com as mesmas classes", () => {
  for (const size of SIZES) {
    const expected = inputTokens(size);
    expect(expected).toHaveLength(3);
    const [height, padding, text] = expected;

    const { unmount } = render(
      <RivoProvider scope="local">
        <Select items={OPTIONS} size={size}>
          <SelectTrigger aria-label="Status">
            <SelectValue placeholder="Escolha" />
          </SelectTrigger>
        </Select>
        <Combobox items={OPTIONS} size={size}>
          <ComboboxInput aria-label="Cliente" />
        </Combobox>
        <Field>
          <Textarea aria-label="Observacao" size={size} />
        </Field>
      </RivoProvider>,
    );

    const trigger = tokens(screen.getByLabelText("Status"));
    expect(trigger).toContain(height!);
    expect(trigger).toContain(padding!);
    expect(trigger).toContain(text!);

    const combobox = tokens(screen.getByLabelText("Cliente"));
    expect(combobox).toContain(height!);
    expect(combobox).toContain(padding!);
    expect(combobox).toContain(text!);

    const textarea = tokens(screen.getByLabelText("Observacao"));
    expect(textarea).toContain(padding!);
    expect(textarea).toContain(text!);
    expect(textarea).toContain(`min-h-[calc(var(--rc-control-${size})*2)]`);
    expect(textarea).toContain("h-auto");
    expect(textarea).not.toContain(height!);

    for (const other of SIZES.filter((one) => one !== size)) {
      expect(trigger).not.toContain(`h-[var(--rc-control-${other})]`);
      expect(combobox).not.toContain(`h-[var(--rc-control-${other})]`);
      expect(textarea).not.toContain(`min-h-[calc(var(--rc-control-${other})*2)]`);
    }

    unmount();
  }
});

test("sem size, os tres nascem no md, como o Input", () => {
  render(
    <RivoProvider scope="local">
      <Select items={OPTIONS}>
        <SelectTrigger aria-label="Status">
          <SelectValue placeholder="Escolha" />
        </SelectTrigger>
      </Select>
      <Combobox items={OPTIONS}>
        <ComboboxInput aria-label="Cliente" />
      </Combobox>
      <Field>
        <Textarea aria-label="Observacao" />
      </Field>
    </RivoProvider>,
  );
  expect(tokens(screen.getByLabelText("Status"))).toContain("h-[var(--rc-control-md)]");
  expect(tokens(screen.getByLabelText("Cliente"))).toContain("h-[var(--rc-control-md)]");
  expect(tokens(screen.getByLabelText("Observacao"))).toContain(
    "min-h-[calc(var(--rc-control-md)*2)]",
  );
});
