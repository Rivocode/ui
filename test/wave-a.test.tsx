import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Switch } from "../src/components/switch";
import { Radio, RadioGroup } from "../src/components/radio";
import { Slider } from "../src/components/slider";
import { Separator } from "../src/components/separator";
import { Avatar } from "../src/components/avatar";
import { Progress } from "../src/components/progress";
import { Spinner } from "../src/components/spinner";
import { Accordion, AccordionItem } from "../src/components/accordion";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../src/components/alert-dialog";
import { Toggle, ToggleGroup } from "../src/components/toggle";
import { Field, FieldLabel, Textarea } from "../src/components/field";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the switch turns on and off, and tells its state", () => {
  // Without the surrounding <label>: in happy-dom the click on the button bubbles
  // to the label, which sends another click to the same control and the switch
  // goes back to the start. In the browser this does not happen, and the labeled
  // pattern is in the showcase.
  withTheme(<Switch defaultChecked={false} aria-label="Avisos por email" />);
  const key = screen.getByRole("switch");
  expect(key.getAttribute("aria-checked")).toBe("false");
  fireEvent.click(key);
  expect(key.getAttribute("aria-checked")).toBe("true");

  const classes = key.className.split(" ");
  expect(classes).toContain("data-[checked]:not-data-disabled:bg-accent-text");
  expect(classes).not.toContain("data-[checked]:not-data-disabled:bg-accent");
});

test("the switch marks invalid along with the Field", () => {
  withTheme(
    <Field invalid>
      <Switch />
    </Field>,
  );
  expect(screen.getByRole("switch").getAttribute("aria-invalid")).toBe("true");
});

test("the radio group leaves only one checked", () => {
  withTheme(
    <RadioGroup defaultValue="pix">
      <label>
        <Radio value="pix" />
        Pix
      </label>
      <label>
        <Radio value="boleto" />
        Boleto
      </label>
    </RadioGroup>,
  );
  const options = screen.getAllByRole("radio");
  expect(options[0]!.getAttribute("aria-checked")).toBe("true");
  fireEvent.click(options[1]!);
  expect(options[0]!.getAttribute("aria-checked")).toBe("false");
  expect(options[1]!.getAttribute("aria-checked")).toBe("true");

  // The same accent as the switch track, and for the same reason: the full lime
  // measured 1.21:1 on the page in the light theme and the checked circle had no
  // boundary, only the loose dot in the middle.
  const circle = options[1]!.className.split(" ");
  expect(circle).toContain("data-[checked]:not-data-disabled:bg-accent-text");
  expect(circle).not.toContain("data-[checked]:not-data-disabled:bg-accent");
  const dot = options[1]!.querySelector("span")!.className.split(" ");
  expect(dot).toContain("bg-surface-raised");
  expect(dot).not.toContain("bg-accent-fg");
});

test("the range thumb and fill wear the dark accent, and the core reads inside it", () => {
  const { container } = withTheme(
    <Slider
      defaultValue={30}
      thumbLabel="Desconto"
      classNames={{ indicator: "ind-faixa", thumb: "pino-faixa" }}
    />,
  );

  const fill = container.querySelector(".ind-faixa")!.className.split(" ");
  expect(fill).toContain("bg-accent-text");
  expect(fill).not.toContain("bg-accent");

  const thumb = container.querySelector(".pino-faixa")!.className.split(" ");
  expect(thumb).toContain("border-accent-text");
  expect(thumb).toContain("bg-surface-raised");
  expect(thumb).not.toContain("border-accent");
  expect(thumb).not.toContain("bg-surface");
});

test("the dividing line announces itself as a separator", () => {
  withTheme(<Separator />);
  expect(screen.getByRole("separator")).toBeDefined();
});

test("the vertical line swaps the thickness axis", () => {
  withTheme(<Separator orientation="vertical" />);
  const row = screen.getByRole("separator");
  expect(row.className).toContain("w-px");
  expect(row.className).not.toContain("h-px");
});

test("the avatar shows the initial when there is no photo", () => {
  withTheme(<Avatar fallback="EB" />);
  expect(screen.getByText("EB")).toBeDefined();
});

test("the avatar does not wear surface, otherwise it disappears inside the card", () => {
  // In the house light theme, --rc-surface and --rc-surface-raised are both
  // pure white: 1.00 to 1. The circle disappeared and only the loose initial was
  // left, which in an overlapping row still gets clipped. It is the same reason
  // --rc-skeleton exists, written in the theme itself.
  withTheme(<Avatar fallback="EB" />);
  const circle = screen.getByText("EB").parentElement!;

  expect(circle.className).not.toContain("bg-surface");
  expect(circle.className).toContain("bg-skeleton");
});

test("the progress bar tells how much is left", () => {
  withTheme(<Progress value={40} label="Enviando" showValue />);
  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("40");
  expect(screen.getByText("Enviando")).toBeDefined();
});

test("the indeterminate bar does not look like a finished task", () => {
  // Without its own width the indicator takes the whole track and stands still,
  // which is exactly how a bar at 100% reads. A wait with no expected end must
  // look like waiting: a fifth of the track, sweeping across.
  const { container } = withTheme(<Progress value={null} aria-label="Sincronizando" />);
  // Root, track and indicator all get data-indeterminate; the indicator is the
  // last one, because it is the deepest.
  const marked = container.querySelectorAll("[data-indeterminate]");
  const indicator = marked[marked.length - 1];

  expect(indicator).toBeDefined();
  expect(indicator?.className).toContain("data-[indeterminate]:w-1/5");
  expect(indicator?.className).toContain("data-[indeterminate]:animate-indeterminate");
  // The motion guard repeats the data variant. Written as
  // `motion-reduce:animate-none` - which is what this test used to check, and
  // what the component had - it compiles with one class less specificity than
  // `data-[indeterminate]:animate-indeterminate` and never matches: whoever
  // asked for reduced motion saw the bar sweep across just the same.
  expect(indicator?.className).toContain("motion-reduce:data-[indeterminate]:animate-none");
  // And when still it cannot keep covering a fifth of the track, which reads
  // as "20% done". Whole track, in stripes.
  expect(indicator?.className).toContain("motion-reduce:data-[indeterminate]:w-full");
});

test("the bar at 100% does not carry the indeterminate mark", () => {
  // What turns on the partial width and the motion is the attribute, and not
  // the class: a finished bar must receive neither.
  const { container } = withTheme(<Progress value={100} aria-label="Enviado" />);

  expect(container.querySelectorAll("[data-indeterminate]").length).toBe(0);
  expect(container.querySelectorAll("[data-complete]").length).toBeGreaterThan(0);
});

test("the spinner announces itself, and can be silenced when there is text beside it", () => {
  const { rerender } = withTheme(<Spinner />);
  expect(screen.getByRole("status")).toBeDefined();

  rerender(
    <RivoProvider scope="local">
      <Spinner label="" />
    </RivoProvider>,
  );
  expect(screen.queryByRole("status")).toBeNull();
});

test("the accordion opens and closes the panel", () => {
  withTheme(
    <Accordion>
      <AccordionItem title="Como emitir">Pelo botao Emitir nota.</AccordionItem>
    </Accordion>,
  );
  const trigger = screen.getByRole("button", { name: /Como emitir/ });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
});

test("the irreversible action warning announces itself as alertdialog", () => {
  withTheme(
    <AlertDialog defaultOpen>
      <AlertDialogTrigger>Excluir</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
        <AlertDialogDescription>Nao da para desfazer.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogClose>Cancelar</AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
  expect(screen.getByRole("alertdialog")).toBeDefined();
  expect(screen.getByText("Excluir nota?")).toBeDefined();
});

test("the toggle button tells that it is pressed", () => {
  withTheme(
    <ToggleGroup defaultValue={["lista"]}>
      <Toggle value="lista">Lista</Toggle>
      <Toggle value="grade">Grade</Toggle>
    </ToggleGroup>,
  );
  const list = screen.getByRole("button", { name: "Lista" });
  const grid = screen.getByRole("button", { name: "Grade" });
  expect(list.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(grid);
  expect(grid.getAttribute("aria-pressed")).toBe("true");
  expect(list.getAttribute("aria-pressed")).toBe("false");
});

test("the multiline field binds to the label like Input", () => {
  withTheme(
    <Field>
      <FieldLabel>Observacao</FieldLabel>
      <Textarea placeholder="O que o cliente pediu" />
    </Field>,
  );
  const label = screen.getByText("Observacao") as HTMLLabelElement;
  const field = screen.getByPlaceholderText("O que o cliente pediu");
  expect(field.tagName).toBe("TEXTAREA");
  expect(label.htmlFor).toBe(field.id);
});
