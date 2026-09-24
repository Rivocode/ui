import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { Heading } from "../src/components/heading";
import { RICH_TEXT_CONTENT } from "../src/editor/content";
import { RichTextView } from "../src/editor/index";
import {
  normalizeLinkInput,
  parseRichHtml,
  richTextBlocks,
  safeHref,
} from "../src/shared/rich-text";

const SAVED =
  "<h2>Resumo da nota</h2><p>Emitida em <strong>12/08</strong>, com <em>ISS</em> retido e " +
  '<a href="https://rivocode.com.br/notas/42">o XML aqui</a>.</p>' +
  "<ul><li><p>Serviço de <u>consultoria</u></p></li><li><p>Horas <s>extras</s></p></li></ul>" +
  '<ol start="3"><li><p>terceiro</p></li></ol>' +
  "<blockquote><p>Pago no Pix.</p></blockquote><pre><code>chave: 3524 0812</code></pre>" +
  "<p>linha um<br>linha dois com <code>emitida_em</code></p><hr>";

describe("o que o RichTextView monta", () => {
  test("os blocos e as marcas do editor saem como os elementos de cada um", () => {
    const { container } = render(<RichTextView value={SAVED} />);
    const root = container.firstElementChild!;

    expect(root.querySelector("h2")!.textContent).toBe("Resumo da nota");
    expect(root.querySelector("strong")!.textContent).toBe("12/08");
    expect(root.querySelector("em")!.textContent).toBe("ISS");
    expect(root.querySelector("u")!.textContent).toBe("consultoria");
    expect(root.querySelector("s")!.textContent).toBe("extras");
    expect(root.querySelectorAll("ul > li").length).toBe(2);
    expect(root.querySelector("ol")!.getAttribute("start")).toBe("3");
    expect(root.querySelector("blockquote")!.textContent).toBe("Pago no Pix.");
    expect(root.querySelector("pre > code")!.textContent).toBe("chave: 3524 0812");
    expect(root.querySelector("p > code")!.textContent).toBe("emitida_em");
    expect(root.querySelectorAll("br").length).toBe(1);
    expect(root.querySelector("hr")).not.toBeNull();

    const link = root.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://rivocode.com.br/notas/42");
    expect(link.getAttribute("rel")!.split(" ")).toContain("noopener");
  });

  test("script, atributo de evento, estilo e iframe nao entram", () => {
    const hostile =
      '<p onclick="alert(1)" style="color:red">Oi<img src=x onerror="alert(2)"></p>' +
      "<script>alert(3)</script><style>p{color:red}</style>" +
      '<iframe src="https://evil.example"></iframe><p><span style="font-size:40px">fim</span></p>';
    const { container } = render(<RichTextView value={hostile} />);
    const root = container.firstElementChild!;

    expect(root.querySelectorAll("script, style, img, iframe").length).toBe(0);
    expect(root.querySelectorAll("[style], [onclick], [onerror]").length).toBe(0);
    expect(root.textContent).toBe("Oifim");
    expect(root.innerHTML).not.toContain("alert");
  });

  test("link com javascript: perde o endereco e fica so o texto", () => {
    const { container } = render(
      <RichTextView
        value={
          '<p><a href="javascript:alert(1)">clique</a> e <a href=" java\nscript:x">aqui</a></p>'
        }
      />,
    );

    expect(container.querySelectorAll("a").length).toBe(0);
    expect(container.textContent).toBe("clique e aqui");
  });

  test("o JSON do onJsonChange monta o mesmo que o HTML", () => {
    const json = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Resumo" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Pago " },
            { type: "text", text: "hoje", marks: [{ type: "bold" }] },
            { type: "hardBreak" },
            {
              type: "text",
              text: "ver",
              marks: [{ type: "link", attrs: { href: "https://rivocode.com.br" } }],
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "um" }] }] },
          ],
        },
      ],
    };
    const html =
      '<h2>Resumo</h2><p>Pago <strong>hoje</strong><br><a href="https://rivocode.com.br">ver</a></p>' +
      "<ul><li><p>um</p></li></ul>";

    const fromJson = render(<RichTextView value={json} />).container.innerHTML;
    const fromHtml = render(<RichTextView value={html} />).container.innerHTML;

    expect(fromJson).toBe(fromHtml);
    expect(fromJson).toContain("<strong>hoje</strong>");
  });

  test("conteudo vazio nao desenha nada, e o empty aparece no lugar", () => {
    for (const value of [null, undefined, "", "<p></p>", "<p>  </p>", { type: "doc", content: [] }]) {
      const { container, unmount } = render(<RichTextView value={value} />);
      expect(container.innerHTML).toBe("");
      unmount();
    }

    const { container } = render(<RichTextView value="<p></p>" empty="Sem descrição." />);
    expect(container.textContent).toBe("Sem descrição.");
    expect(container.firstElementChild!.getAttribute("data-empty")).not.toBeNull();
  });

  test("renderiza no servidor, sem DOM, com o conteudo inteiro no primeiro desenho", () => {
    const html = renderToString(<RichTextView value={SAVED} />);

    expect(html).toContain("<h2>Resumo da nota</h2>");
    expect(html).toContain('<ol start="3">');
  });

  test("a classe de quem usa entra junto com a do conteudo", () => {
    const { container } = render(<RichTextView value="<p>a</p>" className="max-w-prose" />);
    const tokens = container.firstElementChild!.className.split(" ");

    expect(tokens).toContain("max-w-prose");
    expect(tokens).toContain("[&_h2]:text-xl");
  });
});

describe("a tipografia do conteudo e a da casa", () => {
  const tokensOf = (prefix: string) =>
    RICH_TEXT_CONTENT.split(" ")
      .filter((token) => token.startsWith(prefix))
      .map((token) => token.slice(prefix.length))
      .sort();

  test("o h2 veste o mesmo que o Heading de nivel 2, e o h3 o de nivel 3", () => {
    for (const level of [2, 3] as const) {
      const { container, unmount } = render(<Heading level={level}>x</Heading>);
      const house = container.firstElementChild!.className.split(" ").sort();
      expect(tokensOf(`[&_h${level}]:`)).toEqual(house);
      unmount();
    }
  });

  test("o codigo em linha veste o mesmo que o Code", async () => {
    const { Code } = await import("../src/components/code");
    const { container } = render(<Code>x</Code>);
    const house = container.firstElementChild!.className.split(" ").sort();

    expect(tokensOf("[&_:not(pre)>code]:")).toEqual(house);
  });
});

describe("o leitor de HTML", () => {
  test("entidades viram caractere, e o espaco repetido de fora de pre vira um", () => {
    const [block] = parseRichHtml("<p>a &amp; b &lt;c&gt; &#233; &#x00e7; &atilde;\n\n   fim</p>");

    expect(block).toEqual({
      kind: "paragraph",
      inline: [{ kind: "text", text: "a & b <c> é ç ã fim", styles: [] }],
    });
  });

  test("o negrito falso do Google Docs nao vira negrito", () => {
    const [block] = parseRichHtml(
      '<b style="font-weight:normal;" id="docs-internal-guid-1"><span>normal</span></b>',
    );

    expect(block).toEqual({ kind: "paragraph", inline: [{ kind: "text", text: "normal", styles: [] }] });
  });

  test("o titulo que o editor nao escreve vira paragrafo, igual ao editor", () => {
    expect(parseRichHtml("<h1>a</h1><h4>b</h4>").map((block) => block.kind)).toEqual([
      "paragraph",
      "paragraph",
    ]);
    expect(richTextBlocks({ type: "heading", attrs: { level: 1 }, content: [] })[0]!.kind).toBe(
      "paragraph",
    );
  });

  test("tag sem fechar e texto solto entre blocos nao derrubam a leitura", () => {
    const blocks = parseRichHtml("solto<p>um<p>dois<ul><li>a<li>b</ul><div>fim");

    expect(blocks.map((block) => block.kind)).toEqual([
      "paragraph",
      "paragraph",
      "paragraph",
      "bulletList",
      "paragraph",
    ]);
  });

  test("comentario e declaracao somem", () => {
    expect(parseRichHtml("<!DOCTYPE html><!--StartFragment--><p>a</p><!--EndFragment-->")).toEqual([
      { kind: "paragraph", inline: [{ kind: "text", text: "a", styles: [] }] },
    ]);
  });
});

describe("o endereco de link", () => {
  test("so passam http, https, mailto, tel e endereco relativo", () => {
    expect(safeHref("https://rivocode.com.br")).toBe("https://rivocode.com.br");
    expect(safeHref("mailto:nf@rivocode.com.br")).toBe("mailto:nf@rivocode.com.br");
    expect(safeHref("tel:+5511999990000")).toBe("tel:+5511999990000");
    expect(safeHref("/notas/42")).toBe("/notas/42");
    expect(safeHref("#itens")).toBe("#itens");
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref(" JaVaScRiPt:alert(1)")).toBeUndefined();
    expect(safeHref("java\tscript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,<script>")).toBeUndefined();
    expect(safeHref("vbscript:x")).toBeUndefined();
  });

  test("o que se digita no painel ganha o protocolo que falta", () => {
    expect(normalizeLinkInput("rivocode.com.br")).toBe("https://rivocode.com.br");
    expect(normalizeLinkInput("rivocode.com.br/notas?id=1")).toBe("https://rivocode.com.br/notas?id=1");
    expect(normalizeLinkInput("nf@rivocode.com.br")).toBe("mailto:nf@rivocode.com.br");
    expect(normalizeLinkInput("http://x.com")).toBe("http://x.com");
    expect(normalizeLinkInput("/notas")).toBe("/notas");
    expect(normalizeLinkInput("javascript:alert(1)")).toBeUndefined();
    expect(normalizeLinkInput("nota fiscal")).toBeUndefined();
    expect(normalizeLinkInput("")).toBeUndefined();
  });
});
