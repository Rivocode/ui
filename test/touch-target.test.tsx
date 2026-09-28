import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Breadcrumb } from "../src/components/breadcrumb";
import { Checkbox } from "../src/components/checkbox";
import { Radio, RadioGroup } from "../src/components/radio";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxInput,
  ComboboxValue,
} from "../src/components/combobox";
import { Slider } from "../src/components/slider";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * The 24x24 target of WCAG 2.5.8 (AA).
 *
 * An external bench counted 30 targets below 24 CSS px across 12 screens at
 * 390px, not counting Base UI's hidden inputs and inline text links, which the
 * standard exempts. Four drawings were left: the unlabeled Checkbox mark (the
 * --rc-box, 18px, which is exactly the DataTable selection column, where the
 * finger aims most), the Slider thumb, the remove button on the Combobox chip -
 * the smallest in the library, the size of the icon - and the Breadcrumb link,
 * which fails on height because it is a line of small text.
 *
 * The fix does not touch the drawing: a transparent pseudo-element stretches
 * the touch area beyond the visible box. Growing the real box would fatten the
 * selection column, the chip and the range track, which is exactly what the
 * house density does not want.
 *
 * Where the label already exists, nothing changes: the whole `<label>` is
 * already the target, and hanging a halo on the little box would only put a
 * layer over the text. That is why the Checkbox only stretches when it stands
 * alone, and the test below guards both sides.
 *
 * There is no real layout in happy-dom - none of these elements has a
 * measurable width here -, so the test asserts the classes that produce the
 * area, as test/classnames.test.tsx does with the classes that produce the
 * appearance. The pixel count is checked by the bench; what this file prevents
 * is the area vanishing in a refactor.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/** The target stretched by a pseudo-element, and not by the drawn box. */
function hasTouchTarget(element: Element, ...insets: string[]) {
  expect(element.className).toContain("relative");
  expect(element.className).toContain("after:absolute");
  for (const inset of insets) expect(element.className).toContain(inset);
}

test("an unlabeled checkbox stretches the target beyond the little box", () => {
  // The DataTable selection column case: 18x18 drawn, with no text beside it
  // to lend area.
  withTheme(<Checkbox aria-label="Selecionar linha" />);
  hasTouchTarget(screen.getByRole("checkbox"), "after:-inset-1.5");
});

test("with a label the target is still the whole label, with no halo over the text", () => {
  withTheme(<Checkbox>ISS retido na fonte</Checkbox>);

  const box = screen.getByRole("checkbox", { name: "ISS retido na fonte" });
  const label = box.closest("label");
  expect(label).not.toBeNull();
  expect(label!.textContent).toContain("ISS retido na fonte");

  // No halo: here it would add no target at all and would still lay a layer
  // over the label's own text.
  expect(box.className).not.toContain("after:absolute");

  fireEvent.click(screen.getByText("ISS retido na fonte"));
  expect(box.getAttribute("data-checked")).not.toBeNull();
});

test("the range thumb stretches the target, and so do both thumbs of a dual range", () => {
  const { container } = withTheme(
    <Slider
      defaultValue={[10, 40]}
      thumbLabel={["Mínimo", "Máximo"]}
      classNames={{ thumb: "thumb-mark" }}
    />,
  );

  const thumbs = container.querySelectorAll(".thumb-mark");
  expect(thumbs.length).toBe(2);
  for (const thumb of thumbs) hasTouchTarget(thumb, "after:-inset-1.5");
});

test("the chip remove button stretches the target, which is the smallest drawing in the library", () => {
  withTheme(
    <Combobox items={["Clinica Sao Lucas"]} multiple defaultValue={["Clinica Sao Lucas"]}>
      <ComboboxChips>
        <ComboboxValue>
          {(chosen: string[]) =>
            chosen.map((customer) => (
              <ComboboxChip key={customer} aria-label={customer}>
                {customer}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxInput aria-label="Cliente" />
      </ComboboxChips>
    </Combobox>,
  );

  // The x's name now carries the chip: a hardcoded "Remover" did not tell one
  // chip from its neighbor.
  hasTouchTarget(
    screen.getByRole("button", { name: "Remover Clinica Sao Lucas" }),
    "after:-inset-1.5",
  );
});

test("the crumb link stretches the target only in height, so it does not catch the neighbor's click", () => {
  // The width already passed; what fails is the height of a line of small
  // text. Stretching horizontally too would put the halo over the next crumb,
  // which sits six pixels away.
  withTheme(
    <Breadcrumb
      items={[{ label: "Clientes", href: "/clientes" }, { label: "Clinica Sao Lucas" }]}
    />,
  );

  const link = screen.getByRole("link", { name: "Clientes" });
  hasTouchTarget(link, "after:-inset-y-1.5", "after:inset-x-0");
  expect(link.className).not.toContain("after:-inset-x");
});

test("the crumb link does not clip its own halo: the inner text is what truncates", () => {
  withTheme(
    <Breadcrumb
      items={[{ label: "Clientes", href: "/clientes" }, { label: "Clinica Sao Lucas" }]}
    />,
  );

  const link = screen.getByRole("link", { name: "Clientes" });
  const clipping = ["truncate", "overflow-hidden", "overflow-clip"];
  for (const token of clipping) expect(link.className.split(" ")).not.toContain(token);

  const text = screen.getByText("Clientes");
  expect(text.parentElement).toBe(link);
  expect(text.className.split(" ")).toContain("truncate");
  expect(text.className.split(" ")).toContain("block");
});

test("a labeled option is 24 pixels tall on the label, and a lone circle stretches the target", () => {
  withTheme(
    <RadioGroup defaultValue="pix">
      <Radio value="pix">Pix</Radio>
      <Radio value="boleto" aria-label="Boleto" />
    </RadioGroup>,
  );

  const named = screen.getByRole("radio", { name: "Pix" });
  const label = named.closest("label")!;
  expect(label.className.split(" ")).toContain("min-h-6");
  expect(named.className.split(" ")).not.toContain("after:absolute");

  const alone = screen.getByRole("radio", { name: "Boleto" });
  expect(alone.closest("label")).toBeNull();
  const tokens = alone.className.split(" ");
  expect(tokens).toContain("relative");
  expect(tokens).toContain("after:absolute");
  expect(tokens).toContain("after:-inset-1.5");
});

test("a labeled checkbox is also 24 pixels tall on the label", () => {
  withTheme(<Checkbox>ISS retido na fonte</Checkbox>);
  const label = screen.getByRole("checkbox", { name: "ISS retido na fonte" }).closest("label")!;
  expect(label.className.split(" ")).toContain("min-h-6");
});
