import { describe, expect, test } from "bun:test";
import { Linking } from "react-native";
import { act, type ReactTestInstance } from "react-test-renderer";

import { RichTextView } from "../src";
import { byRole, render, textOf } from "./helpers";

const SAVED =
  "<h2>Resumo da nota</h2><p>Emitida em <strong>12/08</strong>, com <em>ISS</em> retido e " +
  '<a href="https://rivocode.com.br/notas/42">o XML</a>.</p>' +
  "<ul><li><p>consultoria</p></li><li><p>horas</p></li></ul>" +
  '<ol start="3"><li><p>terceiro</p></li></ol>' +
  "<blockquote><p>Pago no Pix.</p></blockquote><pre><code>chave: 3524</code></pre>";

const tokens = (node: ReactTestInstance) => String(node.props.className ?? "").split(" ");

const hostTexts = (screen: ReturnType<typeof render>) =>
  screen.root.findAll((node) => node.type === "Text");

const opened = () => (Linking as unknown as { opened: string[] }).opened;

describe("RichTextView nativo", () => {
  test("o titulo se anuncia como cabecalho, no tamanho do Heading", () => {
    const screen = render(<RichTextView value={SAVED} />);
    const [heading] = byRole(screen, "header");

    expect(heading).toBeDefined();
    expect(tokens(heading!)).toContain("text-xl");
    expect(textOf(screen)).toContain("Resumo da nota");
  });

  test("as marcas viram estilo de Text, e o link abre pelo Linking", () => {
    const screen = render(<RichTextView value={SAVED} />);
    const texts = hostTexts(screen);

    const bold = texts.find((node) => node.props.children === "12/08")!;
    expect(tokens(bold)).toContain("font-bold");
    const italic = texts.find((node) => node.props.children === "ISS")!;
    expect(tokens(italic)).toContain("italic");

    const [link] = byRole(screen, "link");
    act(() => link!.props.onPress({}));
    expect(opened()).toContain("https://rivocode.com.br/notas/42");
  });

  test("lista numerada comeca do start, e a marcada usa ponto", () => {
    const text = textOf(render(<RichTextView value={SAVED} />));

    expect(text).toContain("• consultoria");
    expect(text).toContain("3. terceiro");
  });

  test("a citacao sai no tom apagado, com a borda a esquerda", () => {
    const screen = render(<RichTextView value={SAVED} />);
    const quote = hostTexts(screen).find(
      (node) => [node.props.children].flat().join("") === "Pago no Pix.",
    )!;

    expect(tokens(quote)).toContain("text-fg-muted");
  });

  test("link com javascript: perde o endereco, e script nao entra", () => {
    const screen = render(
      <RichTextView value={'<p><a href="javascript:alert(1)">clique</a></p><script>alert(2)</script>'} />,
    );

    expect(byRole(screen, "link")).toEqual([]);
    expect(textOf(screen)).toBe("clique");
  });

  test("o JSON do editor monta o mesmo texto que o HTML", () => {
    const json = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Itens" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "pago", marks: [{ type: "bold" }] }],
        },
      ],
    };

    expect(textOf(render(<RichTextView value={json} />))).toBe(
      textOf(render(<RichTextView value="<h3>Itens</h3><p><strong>pago</strong></p>" />)),
    );
  });

  test("vazio nao desenha nada, e o empty aparece no lugar", () => {
    const blank = render(<RichTextView value="<p></p>" />);
    expect(hostTexts(blank)).toEqual([]);
    expect(textOf(render(<RichTextView value="" empty="Sem descrição." />))).toBe("Sem descrição.");
  });
});
