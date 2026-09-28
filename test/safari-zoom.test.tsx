import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Combobox, ComboboxInput } from "../src/components/combobox";
import { Input, Textarea } from "../src/components/field";
import { MaskedInput } from "../src/components/masked-input";
import { SearchInput } from "../src/components/search-input";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * iPhone Safari's automatic zoom.
 *
 * Safari zooms the whole page when focusing a field whose font is below 16px,
 * and then does not zoom back on its own: whoever typed is left with a zoomed
 * screen until they close the keyboard and pinch back. The house scale is dense
 * on purpose - --rc-text-base is 14px - and the medium field, the default, used
 * exactly that. An external bench measured 32 fields below 16px across 12
 * screens at 390px, and all of them were this same defect.
 *
 * The fix raises the font of the control only, only below 640px: the scale of
 * the rest of the interface does not change, and desktop does not change at
 * all. Four of the five fields inherit this from inputVariants; SearchInput
 * draws its own field and needs the same line.
 *
 * The test runs in happy-dom, which has no stylesheet nor media queries: there
 * is no way to measure 16px here. So it asserts the class that produces the
 * rule, the same way test/classnames.test.tsx asserts the class that dresses a
 * part. What it protects is the decision, and not the pixel.
 */

/** The class that takes the field out of Safari's zoom trigger. */
const NO_ZOOM = "max-sm:text-[16px]";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the text field does not trigger Safari zoom, at any size", () => {
  for (const size of ["sm", "md", "lg"] as const) {
    const { unmount } = withTheme(<Input size={size} aria-label="Número da nota" />);
    expect(screen.getByRole("textbox").className).toContain(NO_ZOOM);
    unmount();
  }
});

test("the multiline field does not trigger it either", () => {
  const { container } = withTheme(<Textarea aria-label="Observação" />);
  expect(container.querySelector("textarea")!.className).toContain(NO_ZOOM);
});

test("the search field does not trigger it either, and it does not go through inputVariants", () => {
  withTheme(<SearchInput aria-label="Buscar nota" />);
  expect(screen.getByRole("searchbox").className).toContain(NO_ZOOM);
});

test("the masked field does not trigger it either", () => {
  withTheme(<MaskedInput mask="cpf" aria-label="CPF" />);
  expect(screen.getByRole("textbox").className).toContain(NO_ZOOM);
});

test("the combobox field does not trigger it either", () => {
  withTheme(
    <Combobox items={["Clinica Sao Lucas"]}>
      <ComboboxInput aria-label="Cliente" />
    </Combobox>,
  );
  expect(screen.getByRole("combobox").className).toContain(NO_ZOOM);
});

test("on desktop the dense scale still stands", () => {
  // The half the fix must not break: raising the font below 640px does not
  // mean raising the whole scale. Medium stays at text-base, which is the 14px
  // --rc-text-base, and small stays smaller than it.
  const { unmount } = withTheme(<Input aria-label="Número da nota" />);
  expect(screen.getByRole("textbox").className).toContain("text-base");
  unmount();

  withTheme(<Input size="sm" aria-label="Número da nota" />);
  expect(screen.getByRole("textbox").className).toContain("text-sm");
});
