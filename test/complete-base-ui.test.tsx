import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../src/components/collapsible";
import { ScrollArea } from "../src/components/scroll-area";
import { Slider } from "../src/components/slider";
import { Meter } from "../src/components/meter";
import { NumberField } from "../src/components/number-field";
import { OTPField } from "../src/components/otp-field";
import { Menubar } from "../src/components/menubar";
import { ToolbarButton, ToolbarRoot } from "../src/components/toolbar";
import { CheckboxGroup } from "../src/components/checkbox-group";
import { Checkbox } from "../src/components/checkbox";
import { FieldsetLegend, FieldsetRoot } from "../src/components/fieldset";
import { Field, FieldLabel, Input } from "../src/components/field";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../src/components/navigation-menu";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the collapsible block opens and closes", () => {
  withTheme(
    <Collapsible>
      <CollapsibleTrigger>Chaves de recuperacao</CollapsibleTrigger>
      <CollapsiblePanel>alien-bean-pasta</CollapsiblePanel>
    </Collapsible>,
  );
  const trigger = screen.getByRole("button", { name: /Chaves/ });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
});

test("the scroll area delivers the content, and not only the frame", () => {
  withTheme(
    <ScrollArea className="h-20">
      <p>Texto comprido</p>
    </ScrollArea>,
  );
  expect(screen.getByText("Texto comprido")).toBeDefined();
});

test("the slider reports the value", () => {
  withTheme(<Slider defaultValue={25} label="Desconto" showValue thumbLabel="Desconto" />);
  const thumb = screen.getByRole("slider");
  expect(thumb.getAttribute("aria-valuenow")).toBe("25");
  expect(screen.getByText("Desconto")).toBeDefined();
});

test("the range slider puts one thumb per bound, each with its own name", () => {
  withTheme(
    <Slider
      defaultValue={[20, 60]}
      label="Faixa de valor"
      thumbLabel={["Valor minimo", "Valor maximo"]}
    />,
  );
  const thumbs = screen.getAllByRole("slider");
  expect(thumbs.length).toBe(2);
  expect(thumbs[0]?.getAttribute("aria-valuenow")).toBe("20");
  expect(thumbs[1]?.getAttribute("aria-valuenow")).toBe("60");
  expect(screen.getByLabelText("Valor maximo")).toBeDefined();
});

test("the capacity meter does not announce itself as progress", () => {
  withTheme(<Meter value={24} max={100} label="Espaco usado" showValue />);
  const meter = screen.getByRole("meter");
  expect(meter.getAttribute("aria-valuenow")).toBe("24");
  expect(screen.queryByRole("progressbar")).toBeNull();
});

test("the number field moves step by step, within the bounds", () => {
  withTheme(<NumberField defaultValue={2} min={0} max={3} />);
  const field = screen.getByRole("textbox") as HTMLInputElement;
  expect(field.value).toBe("2");

  fireEvent.click(screen.getByLabelText("Aumentar"));
  expect(field.value).toBe("3");

  fireEvent.click(screen.getByLabelText("Aumentar"));
  expect(field.value).toBe("3");
});

test("the verification code opens one slot per digit", () => {
  const { container } = withTheme(<OTPField length={6} />);

  // The Base UI root renders a hidden input, which holds the whole code and
  // receives the paste. The visible slots are the others.
  const hiddenInput = container.querySelector("input[data-length]")!;
  const cells = [...container.querySelectorAll("input")].filter((cell) => cell !== hiddenInput);

  expect(cells.length).toBe(6);
  expect(hiddenInput.getAttribute("autocomplete")).toBe("one-time-code");
  expect(hiddenInput.getAttribute("inputmode")).toBe("numeric");
});

test("inside Field, each code slot has a name, and all shrink down to 32 pixels on a narrow screen", () => {
  const { container } = withTheme(
    <Field>
      <FieldLabel>Código de verificação</FieldLabel>
      <OTPField length={6} />
    </Field>,
  );
  const slots = [...container.querySelectorAll("input:not([aria-hidden])")];
  expect(slots.length).toBe(6);

  const firstName = slots[0]!.getAttribute("aria-labelledby")!;
  expect(container.querySelector(`[id="${firstName}"]`)?.textContent).toBe("Código de verificação");
  expect(slots[1]!.getAttribute("aria-label")).toBe("Dígito 2 de 6");

  for (const slot of slots) {
    const tokens = slot.className.split(" ");
    expect(tokens).toContain("size-11");
    expect(tokens).toContain("min-w-8");
    expect(tokens).toContain("shrink");
  }
});

test("the menu bar groups the menus into a single piece", () => {
  withTheme(<Menubar aria-label="Principal" />);
  expect(screen.getByLabelText("Principal")).toBeDefined();
});

test("the toolbar gathers the buttons into one tab stop", () => {
  withTheme(
    <ToolbarRoot aria-label="Formatacao">
      <ToolbarButton>Negrito</ToolbarButton>
      <ToolbarButton>Italico</ToolbarButton>
    </ToolbarRoot>,
  );
  const bar = screen.getByRole("toolbar");
  expect(bar.getAttribute("aria-label")).toBe("Formatacao");
  expect(screen.getAllByRole("button").length).toBe(2);
});

test("the checkbox group keeps the choice as a list", () => {
  // No <label> around it: in happy-dom the click on the button bubbles to the
  // label, which sends another click to the same control and the check resets.
  withTheme(
    <CheckboxGroup defaultValue={["pix"]} aria-label="Formas">
      <Checkbox name="forma" value="pix" aria-label="Pix" />
      <Checkbox name="forma" value="boleto" aria-label="Boleto" />
    </CheckboxGroup>,
  );
  const boxes = screen.getAllByRole("checkbox");
  expect(boxes[0]!.getAttribute("aria-checked")).toBe("true");
  fireEvent.click(boxes[1]!);
  expect(boxes[1]!.getAttribute("aria-checked")).toBe("true");
});

test("the legend is read along with the field inside it", () => {
  withTheme(
    <FieldsetRoot>
      <FieldsetLegend>Endereco</FieldsetLegend>
      <Field>
        <FieldLabel>Numero</FieldLabel>
        <Input placeholder="123" />
      </Field>
    </FieldsetRoot>,
  );
  const group = screen.getByRole("group");
  expect(group.textContent).toContain("Endereco");
  expect(screen.getByPlaceholderText("123")).toBeDefined();
});

test("the top navigation announces itself as navigation", () => {
  withTheme(
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>,
  );
  expect(screen.getByRole("navigation")).toBeDefined();
  expect(screen.getByText("Produtos")).toBeDefined();
});

test("the provider mirrors the writing direction", () => {
  render(
    <RivoProvider scope="local" dir="rtl">
      <p>Direita para esquerda</p>
    </RivoProvider>,
  );
  const shell = screen.getByText("Direita para esquerda").closest("[data-rc-theme]")!;
  expect(shell.getAttribute("dir")).toBe("rtl");
});
