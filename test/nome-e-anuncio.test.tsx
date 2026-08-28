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

/* --- TagsInput: o rotulo e o anel ---------------------------------------- */

/*
 * O `TagsInput` nao era um `Field.Control`, e o `FieldLabel` ao lado dele
 * emitia `<label for="...">` apontando para um id que nao existia em lugar
 * nenhum da pagina - o unico rotulo orfao das 94 rotas do site. O nome do
 * campo caia no `placeholder`, que some no instante em que a pessoa digita: o
 * leitor de tela anunciava "Escreva e tecle Enter" no lugar de "Marcadores",
 * a `FieldDescription` nunca era anunciada e clicar no rotulo nao focava nada.
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

test("o nome do campo de marcadores e o rotulo, e nao o placeholder", () => {
  withTheme(<Marcadores />);

  const field = screen.getByRole("textbox", { name: "Marcadores" });
  expect(field.tagName).toBe("INPUT");
  expect(field.getAttribute("placeholder")).toBe("Escreva e tecle Enter");
});

test("o `for` do rotulo acha o campo, entao clicar no rotulo foca", () => {
  const { container } = withTheme(<Marcadores />);

  const target = container.querySelector("label")!.getAttribute("for");
  expect(target).toBeTruthy();
  expect(document.getElementById(target!)).toBe(
    screen.getByRole("textbox", { name: "Marcadores" }),
  );
});

test("a ajuda e o erro acompanham o campo de marcadores", () => {
  withTheme(<Marcadores invalid />);
  const field = screen.getByRole("textbox", { name: "Marcadores" });

  const described = field.getAttribute("aria-describedby")!.split(" ");
  const lido = described.map((id) => document.getElementById(id)?.textContent).join(" ");

  expect(lido).toContain("Enter fecha a ficha.");
  expect(lido).toContain("Escolha ao menos um");
  expect(field.getAttribute("aria-invalid")).toBe("true");
});

test("o `aria-label` proprio continua valendo fora de um Field", () => {
  withTheme(<TagsInput aria-label="Palavras do filtro" value={[]} onValueChange={() => {}} />);

  expect(screen.getByRole("textbox", { name: "Palavras do filtro" })).toBeDefined();
});

/*
 * A moldura das fichas e uma `div`, e recebia o `focus-visible:ring-2` do
 * `inputVariants` - que `div` sem foco nunca casa. O campo de dentro ia com
 * `outline-none` e nenhum anel: era o unico controle da biblioteca que ficava
 * sem foco visivel.
 */
test("a moldura acende pelo campo de dentro, que e quem recebe o foco", () => {
  const { container } = withTheme(<Marcadores />);
  const frame = container.querySelector<HTMLElement>("div.rounded-md")!;

  expect(frame.className).toContain("has-[input:focus-visible]:ring-2");
  expect(frame.className).toContain("has-[input:focus-visible]:ring-ring");
});

test("o xis da ficha tem anel proprio, para os dois nunca acenderem juntos", () => {
  withTheme(<Marcadores />);

  expect(screen.getByRole("button", { name: "Remover nf-e" }).className).toContain(
    "focus-visible:ring-2",
  );
});

/* --- Command: o nome, o expandido e o anuncio ---------------------------- */

const GROUPS: CommandGroup[] = [
  {
    label: "Ir para",
    items: [
      { id: "notas", label: "Notas fiscais", onSelect: () => {} },
      { id: "clientes", label: "Clientes", onSelect: () => {} },
    ],
  },
];

test("o campo da paleta tem nome, e ele nao e o placeholder", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);

  const field = screen.getByRole("combobox", { name: "Paleta de comandos" });
  expect(field.getAttribute("placeholder")).toBe("Buscar comando");
});

test("o nome do campo acompanha o `title` de quem monta a paleta", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} title="Ações da nota" />);

  expect(screen.getByRole("combobox", { name: "Ações da nota" })).toBeDefined();
});

/*
 * O `aria-expanded` era fixo em "true": a busca sem resultado deixava o foco
 * parado num combobox que afirmava estar expandido com a lista vazia.
 */
test("o expandido segue a lista, e nao fica preso em true", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);
  const field = screen.getByRole("combobox");

  expect(field.getAttribute("aria-expanded")).toBe("true");

  fireEvent.change(field, { target: { value: "zzz" } });
  expect(field.getAttribute("aria-expanded")).toBe("false");
});

/*
 * A mensagem de vazio era um `<p>` comum dentro do `role="listbox"`. Digitar
 * uma busca que nao acha nada produzia silencio: o listbox nao anuncia filho
 * novo, e nada mais mudava na tela para o leitor de tela contar.
 */
test("nao achar nada sai numa regiao viva, e fora da lista", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });

  const empty = screen.getByText("Nada com esse nome");
  expect(empty.closest("[role=status]")).not.toBeNull();
  expect(empty.closest("[role=listbox]")).toBeNull();
});

test("achar tambem se anuncia: a contagem entra na mesma regiao", () => {
  withTheme(<Command open onOpenChange={() => {}} groups={GROUPS} />);
  const field = screen.getByRole("combobox");

  expect(within(screen.getByRole("status")).getByText("2 resultados")).toBeDefined();

  fireEvent.change(field, { target: { value: "clientes" } });
  expect(within(screen.getByRole("status")).getByText("1 resultado")).toBeDefined();
});

/* --- Slider: o rotulo nomeia o pino --------------------------------------- */

test("o rotulo do slider nomeia o controle, sem precisar de thumbLabel", () => {
  withTheme(<Slider defaultValue={30} max={90} label="Prazo" showValue />);

  expect(screen.getByRole("slider", { name: "Prazo" })).toBeDefined();
});

test("na faixa de dois pinos, cada pino guarda o nome proprio", () => {
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

/* --- PageHeader: o nivel do titulo --------------------------------------- */

test("sem dizer nada, o titulo continua um h1", () => {
  withTheme(<PageHeader title="Notas fiscais" />);

  expect(screen.getByRole("heading", { level: 1, name: "Notas fiscais" })).toBeDefined();
});

/*
 * `/componentes/page-header` era a unica das 94 rotas com mais de um `h1`: o
 * titulo da pagina e os dois dos exemplos. Quem navega por titulo de nivel 1
 * caia dentro de um exemplo em vez da peca.
 */
test("`titleAs` baixa o nivel sem mexer no desenho", () => {
  withTheme(<PageHeader title="Notas fiscais" titleAs="h2" />);

  const heading = screen.getByRole("heading", { level: 2, name: "Notas fiscais" });
  expect(heading.tagName).toBe("H2");
  expect(heading.className).toContain("text-2xl");
  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
});

test("`titleAs` tambem chega ao h3, para o cabecalho que mora fundo", () => {
  withTheme(<PageHeader title="Ajustes" titleAs="h3" />);

  expect(screen.getByRole("heading", { level: 3, name: "Ajustes" })).toBeDefined();
});
