import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Switch } from "../src/components/switch";
import { Radio, RadioGroup } from "../src/components/radio";
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

function comTema(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("a chave liga e desliga, e conta o estado", () => {
  // Sem o <label> em volta: no happy-dom o clique no botao sobe para o rotulo,
  // que devolve outro clique para o mesmo controle e a chave volta ao inicio.
  // No navegador isso nao acontece, e o padrao com rotulo esta na vitrine.
  comTema(<Switch defaultChecked={false} aria-label="Avisos por email" />);
  const key = screen.getByRole("switch");
  expect(key.getAttribute("aria-checked")).toBe("false");
  fireEvent.click(key);
  expect(key.getAttribute("aria-checked")).toBe("true");
});

test("a chave marca invalido junto com o Field", () => {
  comTema(
    <Field invalid>
      <Switch />
    </Field>,
  );
  expect(screen.getByRole("switch").getAttribute("aria-invalid")).toBe("true");
});

test("o grupo de radio deixa so um marcado", () => {
  comTema(
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
});

test("a linha que separa se anuncia como separador", () => {
  comTema(<Separator />);
  expect(screen.getByRole("separator")).toBeDefined();
});

test("a linha vertical troca a espessura de eixo", () => {
  comTema(<Separator orientation="vertical" />);
  const row = screen.getByRole("separator");
  expect(row.className).toContain("w-px");
  expect(row.className).not.toContain("h-px");
});

test("o avatar mostra a inicial quando nao ha foto", () => {
  comTema(<Avatar fallback="EB" />);
  expect(screen.getByText("EB")).toBeDefined();
});

test("a barra de progresso conta quanto falta", () => {
  comTema(<Progress value={40} label="Enviando" showValue />);
  const barra = screen.getByRole("progressbar");
  expect(barra.getAttribute("aria-valuenow")).toBe("40");
  expect(screen.getByText("Enviando")).toBeDefined();
});

test("o giro se anuncia, e da para calar quando ha texto do lado", () => {
  const { rerender } = comTema(<Spinner />);
  expect(screen.getByRole("status")).toBeDefined();

  rerender(
    <RivoProvider scope="local">
      <Spinner label="" />
    </RivoProvider>,
  );
  expect(screen.queryByRole("status")).toBeNull();
});

test("a sanfona abre e fecha o painel", () => {
  comTema(
    <Accordion>
      <AccordionItem title="Como emitir">Pelo botao Emitir nota.</AccordionItem>
    </Accordion>,
  );
  const gatilho = screen.getByRole("button", { name: /Como emitir/ });
  expect(gatilho.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(gatilho);
  expect(gatilho.getAttribute("aria-expanded")).toBe("true");
});

test("o aviso de acao sem volta se anuncia como alertdialog", () => {
  comTema(
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

test("o botao que fica apertado conta que esta apertado", () => {
  comTema(
    <ToggleGroup defaultValue={["lista"]}>
      <Toggle value="lista">Lista</Toggle>
      <Toggle value="grade">Grade</Toggle>
    </ToggleGroup>,
  );
  const list = screen.getByRole("button", { name: "Lista" });
  const grade = screen.getByRole("button", { name: "Grade" });
  expect(list.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(grade);
  expect(grade.getAttribute("aria-pressed")).toBe("true");
  expect(list.getAttribute("aria-pressed")).toBe("false");
});

test("o campo de varias linhas se liga ao rotulo como o Input", () => {
  comTema(
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
