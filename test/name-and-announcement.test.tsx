import { expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Field, FieldDescription, FieldError, FieldLabel } from "../src/components/field";
import { TagsInput } from "../src/components/tags-input";
import { Command, type CommandGroup } from "../src/components/command";
import { PageHeader } from "../src/components/page-header";
import { Slider } from "../src/components/slider";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/* --- TagsInput: the label and the ring ---------------------------------- */

/*
 * `TagsInput` was not a `Field.Control`, and the `FieldLabel` next to it
 * emitted `<label for="...">` pointing at an id that existed nowhere on the
 * page - the only orphan label across the 94 routes of the site. The field
 * name fell back to the `placeholder`, which vanishes the moment the person
 * types: the screen reader announced "Escreva e tecle Enter" instead of
 * "Marcadores", the `FieldDescription` was never announced and clicking the
 * label focused nothing.
 */

function Marcadores({ invalid }: { invalid?: boolean } = {}) {
  const [tags, setTags] = useState(["nf-e"]);

  return (
    <Field invalid={invalid}>
      <FieldLabel>Marcadores</FieldLabel>
      <TagsInput value={tags} onValueChange={setTags} placeholder="Escreva e tecle Enter" />
      <FieldDescription>Enter fecha a ficha.</FieldDescription>
      <FieldError match>Escolha ao menos um</FieldError>
    </Field>
  );
}

test("the tags field name is the label, and not the placeholder", () => {
  withTheme(<Marcadores />);

  const field = screen.getByRole("textbox", { name: "Marcadores" });
  expect(field.tagName).toBe("INPUT");
  expect(field.getAttribute("placeholder")).toBe("Escreva e tecle Enter");
});

test("the label `for` finds the field, so clicking the label focuses it", () => {
  const { container } = withTheme(<Marcadores />);

  const target = container.querySelector("label")!.getAttribute("for");
  expect(target).toBeTruthy();
  expect(document.getElementById(target!)).toBe(
    screen.getByRole("textbox", { name: "Marcadores" }),
  );
});

test("the help and the error follow the tags field", () => {
  withTheme(<Marcadores invalid />);
  const field = screen.getByRole("textbox", { name: "Marcadores" });

  const described = field.getAttribute("aria-describedby")!.split(" ");
  const lido = described.map((id) => document.getElementById(id)?.textContent).join(" ");

  expect(lido).toContain("Enter fecha a ficha.");
  expect(lido).toContain("Escolha ao menos um");
  expect(field.getAttribute("aria-invalid")).toBe("true");
});

test("an own `aria-label` still works outside a Field", () => {
  withTheme(<TagsInput aria-label="Palavras do filtro" value={[]} onValueChange={() => {}} />);

  expect(screen.getByRole("textbox", { name: "Palavras do filtro" })).toBeDefined();
});

/*
 * The chip frame is a `div`, and it got the `focus-visible:ring-2` from
 * `inputVariants` - which a non-focusable `div` never matches. The inner field
 * had `outline-none` and no ring: it was the only control in the library left
 * without visible focus.
 */
test("the frame lights up through the inner field, which is the one that gets focus", () => {
  const { container } = withTheme(<Marcadores />);
  const frame = container.querySelector<HTMLElement>("div.rounded-md")!;

  expect(frame.className).toContain("has-[input:focus-visible]:ring-2");
  expect(frame.className).toContain("has-[input:focus-visible]:ring-ring");
});

test("the chip x has its own ring, so the two never light up together", () => {
  withTheme(<Marcadores />);

  expect(screen.getByRole("button", { name: "Remover nf-e" }).className).toContain(
    "focus-visible:ring-2",
  );
});

/* --- Command: the name, the expanded state and the announcement --------- */

const GROUPS: CommandGroup[] = [
  {
    label: "Ir para",
    items: [
      { id: "notas", label: "Notas fiscais", onSelect: () => {} },
      { id: "clientes", label: "Clientes", onSelect: () => {} },
    ],
  },
];

test("the palette field has a name, and it is not the placeholder", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);

  const field = screen.getByRole("combobox", { name: "Paleta de comandos" });
  expect(field.getAttribute("placeholder")).toBe("Buscar comando");
});

test("the field name follows the `title` given by whoever builds the palette", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} title="Ações da nota" />);

  expect(screen.getByRole("combobox", { name: "Ações da nota" })).toBeDefined();
});

/*
 * `aria-expanded` was fixed at "true": a search with no result left focus
 * sitting on a combobox that claimed to be expanded with an empty list.
 */
test("expanded follows the list, and is not stuck at true", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);
  const field = screen.getByRole("combobox");

  expect(field.getAttribute("aria-expanded")).toBe("true");

  fireEvent.change(field, { target: { value: "zzz" } });
  expect(field.getAttribute("aria-expanded")).toBe("false");
});

/*
 * The empty message was a plain `<p>` inside the `role="listbox"`. Typing a
 * search that finds nothing produced silence: the listbox does not announce a
 * new child, and nothing else changed on screen for the screen reader to tell.
 */
test("finding nothing goes out in a live region, outside the list", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });

  const empty = screen.getByText("Nada com esse nome");
  expect(empty.closest("[role=status]")).not.toBeNull();
  expect(empty.closest("[role=listbox]")).toBeNull();
});

test("finding is announced too: the count goes into the same region", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);
  const field = screen.getByRole("combobox");

  expect(within(screen.getByRole("status")).getByText("2 resultados")).toBeDefined();

  fireEvent.change(field, { target: { value: "clientes" } });
  expect(within(screen.getByRole("status")).getByText("1 resultado")).toBeDefined();
});

/* --- Slider: the label names the thumb ----------------------------------- */

test("the slider label names the control, without needing thumbLabel", () => {
  withTheme(<Slider defaultValue={30} max={90} label="Prazo" showValue />);

  expect(screen.getByRole("slider", { name: "Prazo" })).toBeDefined();
});

test("in a two-thumb range, each thumb keeps its own name", () => {
  withTheme(
    <Slider
      defaultValue={[20, 60]}
      label="Faixa de valor"
      thumbLabel={["Valor mínimo", "Valor máximo"]}
    />,
  );

  expect(screen.getByRole("slider", { name: "Valor mínimo" })).toBeDefined();
  expect(screen.getByRole("slider", { name: "Valor máximo" })).toBeDefined();
  expect(screen.queryAllByRole("slider", { name: "Faixa de valor" })).toHaveLength(0);
});

/* --- PageHeader: the title level ----------------------------------------- */

test("saying nothing, the title stays an h1", () => {
  withTheme(<PageHeader title="Notas fiscais" />);

  expect(screen.getByRole("heading", { level: 1, name: "Notas fiscais" })).toBeDefined();
});

/*
 * `/componentes/page-header` was the only one of the 94 routes with more than
 * one `h1`: the page title and the two from the examples. Whoever navigates by
 * level 1 heading landed inside an example instead of the component.
 */
test("`titleAs` lowers the level without touching the look", () => {
  withTheme(<PageHeader title="Notas fiscais" titleAs="h2" />);

  const heading = screen.getByRole("heading", { level: 2, name: "Notas fiscais" });
  expect(heading.tagName).toBe("H2");
  expect(heading.className).toContain("text-2xl");
  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
});

test("`titleAs` also reaches h3, for the header that lives deep", () => {
  withTheme(<PageHeader title="Ajustes" titleAs="h3" />);

  expect(screen.getByRole("heading", { level: 3, name: "Ajustes" })).toBeDefined();
});
