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

test("a chave liga e desliga, e conta o estado", () => {
  // Sem o <label> em volta: no happy-dom o clique no botao sobe para o rotulo,
  // que devolve outro clique para o mesmo controle e a chave volta ao inicio.
  // No navegador isso nao acontece, e o padrao com rotulo esta na vitrine.
  withTheme(<Switch defaultChecked={false} aria-label="Avisos por email" />);
  const key = screen.getByRole("switch");
  expect(key.getAttribute("aria-checked")).toBe("false");
  fireEvent.click(key);
  expect(key.getAttribute("aria-checked")).toBe("true");

  const classes = key.className.split(" ");
  expect(classes).toContain("data-[checked]:not-data-disabled:bg-accent-text");
  expect(classes).not.toContain("data-[checked]:not-data-disabled:bg-accent");
});

test("a chave marca invalido junto com o Field", () => {
  withTheme(
    <Field invalid>
      <Switch />
    </Field>,
  );
  expect(screen.getByRole("switch").getAttribute("aria-invalid")).toBe("true");
});

test("o grupo de radio deixa so um marcado", () => {
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

  // O mesmo acento do trilho da chave, e pelo mesmo motivo: a lima cheia
  // media 1,21:1 sobre a pagina no tema claro e o circulo marcado nao tinha
  // fronteira, so o ponto solto no meio.
  const circle = options[1]!.className.split(" ");
  expect(circle).toContain("data-[checked]:not-data-disabled:bg-accent-text");
  expect(circle).not.toContain("data-[checked]:not-data-disabled:bg-accent");
  const dot = options[1]!.querySelector("span")!.className.split(" ");
  expect(dot).toContain("bg-surface-raised");
  expect(dot).not.toContain("bg-accent-fg");
});

test("o pino e o preenchimento da faixa vestem o acento escuro, e o miolo se le dentro dele", () => {
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

test("a linha que separa se anuncia como separador", () => {
  withTheme(<Separator />);
  expect(screen.getByRole("separator")).toBeDefined();
});

test("a linha vertical troca a espessura de eixo", () => {
  withTheme(<Separator orientation="vertical" />);
  const row = screen.getByRole("separator");
  expect(row.className).toContain("w-px");
  expect(row.className).not.toContain("h-px");
});

test("o avatar mostra a inicial quando nao ha foto", () => {
  withTheme(<Avatar fallback="EB" />);
  expect(screen.getByText("EB")).toBeDefined();
});

test("o avatar nao se veste de superficie, senao ele some dentro do cartao", () => {
  // No tema claro da casa, --rc-surface e --rc-surface-raised sao os dois
  // branco puro: 1,00 para 1. O circulo desaparecia e sobrava a inicial solta,
  // que numa fila sobreposta ainda se recorta. E o mesmo motivo pelo qual o
  // --rc-skeleton existe, escrito no proprio tema.
  withTheme(<Avatar fallback="EB" />);
  const circle = screen.getByText("EB").parentElement!;

  expect(circle.className).not.toContain("bg-surface");
  expect(circle.className).toContain("bg-skeleton");
});

test("a barra de progresso conta quanto falta", () => {
  withTheme(<Progress value={40} label="Enviando" showValue />);
  const bar = screen.getByRole("progressbar");
  expect(bar.getAttribute("aria-valuenow")).toBe("40");
  expect(screen.getByText("Enviando")).toBeDefined();
});

test("a barra indeterminada nao se parece com tarefa concluida", () => {
  // Sem largura propria o indicador ocupa a trilha inteira e fica parado, que
  // e exatamente como se le uma barra em 100%. A espera sem fim previsto
  // precisa parecer espera: um quinto da trilha, atravessando.
  const { container } = withTheme(<Progress value={null} aria-label="Sincronizando" />);
  // Raiz, trilha e indicador recebem o data-indeterminate; o indicador e o
  // ultimo, porque e o mais fundo.
  const marked = container.querySelectorAll("[data-indeterminate]");
  const indicator = marked[marked.length - 1];

  expect(indicator).toBeDefined();
  expect(indicator?.className).toContain("data-[indeterminate]:w-1/5");
  expect(indicator?.className).toContain("data-[indeterminate]:animate-indeterminate");
  // A guarda de movimento repete a variante de dado. Escrita como
  // `motion-reduce:animate-none` - que e o que este teste cobrava, e o que a
  // peca tinha - ela compila com uma classe a menos de especificidade que
  // `data-[indeterminate]:animate-indeterminate` e nunca casa: quem pediu
  // menos movimento via a barra atravessar do mesmo jeito.
  expect(indicator?.className).toContain("motion-reduce:data-[indeterminate]:animate-none");
  // E parada ela nao pode continuar valendo um quinto da trilha, que se le
  // como "20% concluido". Trilha inteira, em faixas.
  expect(indicator?.className).toContain("motion-reduce:data-[indeterminate]:w-full");
});

test("a barra em 100% nao carrega a marca da indeterminada", () => {
  // O que liga a largura parcial e o movimento e o atributo, e nao a classe:
  // a barra que terminou nao pode receber nenhum dos dois.
  const { container } = withTheme(<Progress value={100} aria-label="Enviado" />);

  expect(container.querySelectorAll("[data-indeterminate]").length).toBe(0);
  expect(container.querySelectorAll("[data-complete]").length).toBeGreaterThan(0);
});

test("o giro se anuncia, e da para calar quando ha texto do lado", () => {
  const { rerender } = withTheme(<Spinner />);
  expect(screen.getByRole("status")).toBeDefined();

  rerender(
    <RivoProvider scope="local">
      <Spinner label="" />
    </RivoProvider>,
  );
  expect(screen.queryByRole("status")).toBeNull();
});

test("a sanfona abre e fecha o painel", () => {
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

test("o aviso de acao sem volta se anuncia como alertdialog", () => {
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

test("o botao que fica apertado conta que esta apertado", () => {
  withTheme(
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
