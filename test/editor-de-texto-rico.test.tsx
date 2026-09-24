import { describe, expect, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import { useState, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";

import { Field, FieldDescription, FieldLabel } from "../src/components/field";
import { RichTextEditor, type RichTextEditorProps } from "../src/editor/index";
import { Form, FormField, forValue, useZodForm } from "../src/form/index";
import { RivoProvider } from "../src/provider/rivo-provider";

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

async function mount(node: ReactNode) {
  const view = render(<RivoProvider scope="local">{node}</RivoProvider>);
  await settle();
  return view;
}

function editorOf(box: HTMLElement) {
  return (box as HTMLElement & { editor: Editor }).editor;
}

async function edit(box: HTMLElement, change: (editor: Editor) => void) {
  await act(async () => {
    change(editorOf(box));
  });
}

async function open(props: Partial<RichTextEditorProps> = {}) {
  const seen: string[] = [];
  const view = await mount(
    <RichTextEditor aria-label="Descrição" onValueChange={(value) => seen.push(value)} {...props} />,
  );
  const box = screen.getByRole("textbox", { name: "Descrição" });
  return { ...view, box, seen };
}

describe("a barra de ferramentas", () => {
  test("e uma toolbar com nomes em portugues, acentuados", async () => {
    await open();

    const toolbar = screen.getByRole("toolbar", { name: "Formatação" });
    const names = [...toolbar.querySelectorAll("button")].map((button) =>
      button.getAttribute("aria-label"),
    );

    expect(names).toEqual([
      "Negrito",
      "Itálico",
      "Sublinhado",
      "Tachado",
      "Código",
      "Título",
      "Subtítulo",
      "Lista com marcadores",
      "Lista numerada",
      "Citação",
      "Bloco de código",
      "Link",
      "Desfazer",
      "Refazer",
      "Limpar formatação",
    ]);
  });

  test("os nomes se trocam por labels, e so os que vieram", async () => {
    await open({ labels: { bold: "Bold", toolbar: "Formatting" } });

    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bold" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Itálico" })).toBeTruthy();
  });

  test("e uma parada de tabulacao so, e as setas andam entre os botoes", async () => {
    await open();

    const buttons = [...screen.getByRole("toolbar").querySelectorAll("button")];
    expect(buttons.filter((button) => button.tabIndex === 0).length).toBe(1);

    await act(async () => {
      buttons[0]!.focus();
    });
    await act(async () => {
      fireEvent.keyDown(buttons[0]!, { key: "ArrowRight" });
    });

    expect(document.activeElement).toBe(buttons[1]!);
  });

  test("cada botao diz o atalho ao leitor de tela", async () => {
    await open();

    expect(screen.getByRole("button", { name: "Negrito" }).getAttribute("aria-keyshortcuts")).toBe(
      "Control+B Meta+B",
    );
    expect(screen.getByRole("button", { name: "Link" }).getAttribute("aria-keyshortcuts")).toBe(
      "Control+K Meta+K",
    );
  });

  test("o negrito liga pelo botao, e o aria-pressed acompanha a selecao", async () => {
    const { box, seen } = await open({ defaultValue: "<p>nota paga</p>" });
    const bold = screen.getByRole("button", { name: "Negrito" });

    expect(bold.getAttribute("aria-pressed")).toBe("false");
    await edit(box, (editor) => editor.commands.setTextSelection({ from: 1, to: 5 }));
    await act(async () => {
      bold.click();
    });

    expect(seen.at(-1)).toBe("<p><strong>nota</strong> paga</p>");
    expect(screen.getByRole("button", { name: "Negrito" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  test("titulo e lista sao escolha de um so no grupo, e desligar volta ao paragrafo", async () => {
    const { box, seen } = await open({ defaultValue: "<p>Resumo</p>" });
    await edit(box, (editor) => editor.commands.setTextSelection(2));

    await act(async () => {
      screen.getByRole("button", { name: "Título" }).click();
    });
    expect(seen.at(-1)).toBe("<h2>Resumo</h2>");

    await act(async () => {
      screen.getByRole("button", { name: "Subtítulo" }).click();
    });
    expect(seen.at(-1)).toBe("<h3>Resumo</h3>");
    expect(screen.getByRole("button", { name: "Título" }).getAttribute("aria-pressed")).toBe(
      "false",
    );

    await act(async () => {
      screen.getByRole("button", { name: "Subtítulo" }).click();
    });
    expect(seen.at(-1)).toBe("<p>Resumo</p>");
  });

  test("desfazer comeca travado e destrava depois da primeira mudanca", async () => {
    const { box } = await open({ defaultValue: "<p>a</p>" });
    const undo = () => screen.getByRole("button", { name: "Desfazer" });

    expect(undo().getAttribute("aria-disabled")).toBe("true");
    await edit(box, (editor) => editor.commands.insertContent("b"));
    expect(undo().getAttribute("aria-disabled")).toBe("false");
  });

  test("limpar formatacao tira marca e bloco", async () => {
    const { box, seen } = await open({
      defaultValue: "<h2><strong>Nota</strong> <em>paga</em></h2>",
    });

    await edit(box, (editor) => editor.commands.selectAll());
    await act(async () => {
      screen.getByRole("button", { name: "Limpar formatação" }).click();
    });

    expect(seen.at(-1)).toBe("<p>Nota paga</p>");
  });
});

describe("o valor", () => {
  test("sai em HTML a cada mudanca, e em JSON quando pedido", async () => {
    const json: unknown[] = [];
    const { box, seen } = await open({ onJsonChange: (value) => json.push(value) });

    await edit(box, (editor) => editor.commands.insertContent("Nota paga"));

    expect(seen.at(-1)).toBe("<p>Nota paga</p>");
    expect(json.at(-1)).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Nota paga" }] }],
    });
  });

  test("o editor em branco entrega string vazia, e nao <p></p>", async () => {
    const { box, seen } = await open({ defaultValue: "<p>x</p>" });

    await edit(box, (editor) => editor.commands.clearContent(true));

    expect(seen.at(-1)).toBe("");
  });

  test("controlado, o valor de fora troca o documento sem avisar de volta", async () => {
    function Outside() {
      const [value, setValue] = useState("<p>um</p>");
      return (
        <>
          <button type="button" onClick={() => setValue("<p>dois</p>")}>
            trocar
          </button>
          <RichTextEditor aria-label="Descrição" value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    await mount(<Outside />);
    const box = screen.getByRole("textbox", { name: "Descrição" });

    expect(box.textContent).toBe("um");
    await act(async () => {
      screen.getByRole("button", { name: "trocar" }).click();
    });
    expect(box.textContent).toBe("dois");

    await edit(box, (editor) => editor.commands.insertContentAt(editor.state.doc.content.size - 1, "!"));
    expect(document.querySelector("output")!.textContent).toBe("<p>dois!</p>");
  });

  test("o HTML viaja num input escondido com o name, para o envio do formulario", async () => {
    const { container, box } = await open({ name: "descricao", defaultValue: "<p>a</p>" });

    await edit(box, (editor) => editor.commands.insertContentAt(2, "b"));
    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"][name="descricao"]');

    expect(hidden!.value).toBe("<p>ab</p>");
  });
});

describe("colar", () => {
  test("cor, fonte, classe e script ficam para tras, e o negrito fica", async () => {
    const { box, seen } = await open();

    await edit(box, (editor) =>
      editor.view.pasteHTML(
        '<meta charset="utf-8"><p class="MsoNormal" style="color:red;font-family:Calibri">' +
          '<span style="font-size:40px;background:yellow">nota</span> ' +
          '<b style="font-weight:normal" id="docs-internal-guid-1">comum</b> ' +
          "<strong>forte</strong><o:p></o:p></p><script>alert(1)</script>" +
          '<img src="x" onerror="alert(2)"><table><tr><td>célula</td></tr></table>',
      ),
    );

    const html = seen.at(-1)!;
    expect(html).toContain("<strong>forte</strong>");
    expect(html).not.toMatch(/style=|class=|<script|<img|onerror|<table|<span|<b>/);
    expect(html).toContain("nota comum");
    expect(html).toContain("célula");
  });
});

describe("o limite de caracteres", () => {
  test("o contador conta texto, e nao marca de HTML", async () => {
    await open({ defaultValue: "<p><strong>Nota</strong></p>", maxLength: 10 });

    expect(screen.getByText("4/10")).toBeTruthy();
    const box = screen.getByRole("textbox", { name: "Descrição" });
    const hint = document.getElementById(box.getAttribute("aria-describedby")!.split(" ").at(-1)!);
    expect(hint!.textContent).toBe("4 de 10 caracteres");
  });

  test("a digitacao que passa do teto e recusada, e o aviso diz o teto", async () => {
    const { box, seen } = await open({ defaultValue: "<p>Nota</p>", maxLength: 6 });

    await edit(box, (editor) => editor.commands.insertContentAt(5, "!!!!!"));
    expect(seen).toEqual([]);

    await edit(box, (editor) => editor.commands.insertContentAt(5, "!!"));
    expect(seen.at(-1)).toBe("<p>Nota!!</p>");
    expect(screen.getByRole("status").textContent).toBe("Limite de 6 caracteres atingido.");
    expect(screen.getByText("6/6").className.split(" ")).toContain("text-danger-text");
  });

  test("conteudo salvo maior que o teto abre inteiro, e aceita apagar", async () => {
    const { box, seen } = await open({ defaultValue: "<p>Nota fiscal</p>", maxLength: 4 });

    expect(box.textContent).toBe("Nota fiscal");
    await edit(box, (editor) => editor.commands.insertContentAt(1, "x"));
    expect(seen).toEqual([]);
    await edit(box, (editor) => editor.commands.deleteRange({ from: 5, to: 12 }));
    expect(seen.at(-1)).toBe("<p>Nota</p>");
  });
});

describe("o link", () => {
  test("Ctrl+K abre o painel, e o endereco sem protocolo ganha https", async () => {
    const { box, seen } = await open({ defaultValue: "<p>ver nota</p>" });

    await edit(box, (editor) => editor.commands.setTextSelection({ from: 5, to: 9 }));
    await act(async () => {
      fireEvent.keyDown(box, { key: "k", ctrlKey: true });
    });
    await settle();

    const field = screen.getByLabelText("Endereço do link");
    await act(async () => {
      fireEvent.change(field, { target: { value: "rivocode.com.br/notas/42" } });
    });
    await act(async () => {
      fireEvent.submit(field.closest("form")!);
    });

    expect(seen.at(-1)).toContain('href="https://rivocode.com.br/notas/42"');
    expect(seen.at(-1)).toContain(">nota</a>");
  });

  test("endereco javascript: e recusado com a explicacao", async () => {
    const { box, seen } = await open({ defaultValue: "<p>ver nota</p>" });

    await edit(box, (editor) => editor.commands.setTextSelection({ from: 5, to: 9 }));
    await act(async () => {
      screen.getByRole("button", { name: "Link" }).click();
    });
    await settle();
    const field = screen.getByLabelText("Endereço do link");
    await act(async () => {
      fireEvent.change(field, { target: { value: "javascript:alert(1)" } });
    });
    await act(async () => {
      fireEvent.submit(field.closest("form")!);
    });

    expect(seen).toEqual([]);
    expect(screen.getByText("Use um endereço http, https, mailto ou tel.")).toBeTruthy();
  });

  test("o envio do painel nao envia o formulario de fora", async () => {
    let submitted = 0;
    await mount(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted += 1;
        }}
      >
        <RichTextEditor aria-label="Descrição" defaultValue="<p>ver</p>" />
      </form>,
    );
    const box = screen.getByRole("textbox", { name: "Descrição" });

    await edit(box, (editor) => editor.commands.selectAll());
    await act(async () => {
      screen.getByRole("button", { name: "Link" }).click();
    });
    await settle();
    const field = screen.getByLabelText("Endereço do link");
    await act(async () => {
      fireEvent.change(field, { target: { value: "rivocode.com.br" } });
    });
    await act(async () => {
      fireEvent.submit(field.closest("form")!);
    });

    expect(submitted).toBe(0);
  });
});

describe("os estados", () => {
  test("so leitura some com a barra e trava a edicao", async () => {
    const { box } = await open({ readOnly: true, defaultValue: "<p>a</p>" });

    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(box.getAttribute("contenteditable")).toBe("false");
    expect(box.getAttribute("aria-readonly")).toBe("true");
  });

  test("desabilitado trava a barra e o texto, e anuncia", async () => {
    const { box, container } = await open({ disabled: true, defaultValue: "<p>a</p>" });

    expect(box.getAttribute("contenteditable")).toBe("false");
    expect(box.getAttribute("aria-disabled")).toBe("true");
    const buttons = [...screen.getByRole("toolbar").querySelectorAll("button")];
    expect(buttons.every((button) => button.getAttribute("aria-disabled") === "true" || button.disabled)).toBe(true);
    expect(container.querySelector("[data-disabled]")).not.toBeNull();
  });

  test("invalid pinta a moldura e anuncia aria-invalid", async () => {
    const { box, container } = await open({ invalid: true });

    expect(box.getAttribute("aria-invalid")).toBe("true");
    const frame = container.querySelector("[data-invalid]")!;
    expect(frame.className.split(" ")).toContain("data-[invalid]:border-danger");
  });

  test("o placeholder e dito ao leitor de tela, e desenhado no editor vazio", async () => {
    const { box } = await open({ placeholder: "Descreva o serviço" });

    expect(box.getAttribute("aria-placeholder")).toBe("Descreva o serviço");
    expect(box.querySelector("[data-placeholder]")!.getAttribute("data-placeholder")).toBe(
      "Descreva o serviço",
    );
  });

  test("renderiza no servidor, sem editor, com o conteudo e a barra", () => {
    const html = renderToString(
      <RivoProvider scope="local">
        <RichTextEditor aria-label="Descrição" defaultValue="<p>Nota <strong>paga</strong></p>" />
      </RivoProvider>,
    );

    expect(html).toContain("<strong>paga</strong>");
    expect(html).toContain('role="toolbar"');
  });
});

describe("dentro de Field e de FormField", () => {
  test("o FieldLabel nomeia o texto e o FieldDescription o descreve", async () => {
    await mount(
      <Field invalid>
        <FieldLabel>Descrição do serviço</FieldLabel>
        <RichTextEditor />
        <FieldDescription>Aparece na nota.</FieldDescription>
      </Field>,
    );
    await settle();

    const box = screen.getByRole("textbox", { name: "Descrição do serviço" });
    const described = box.getAttribute("aria-describedby")!.split(" ");
    const texts = described.map((id) => document.getElementById(id)?.textContent);

    expect(texts).toContain("Aparece na nota.");
    expect(box.getAttribute("aria-invalid")).toBe("true");
  });

  test("com useZodForm, o vazio e recusado e o erro aparece no campo", async () => {
    const schema = z.object({ descricao: z.string().min(1, "Descreva o serviço.") });
    let saved: unknown;

    function ServiceForm() {
      const form = useZodForm(schema, { defaultValues: { descricao: "" } });
      return (
        <Form form={form} onSubmit={(values) => (saved = values)}>
          <FormField name="descricao" label="Descrição">
            {(field) => <RichTextEditor {...forValue(field)} onBlur={field.onBlur} />}
          </FormField>
          <button type="submit">Salvar</button>
        </Form>
      );
    }

    await mount(<ServiceForm />);
    await act(async () => {
      screen.getByRole("button", { name: "Salvar" }).click();
    });
    await settle();

    const box = screen.getByRole("textbox", { name: "Descrição" });
    expect(screen.getByText("Descreva o serviço.")).toBeTruthy();
    expect(box.getAttribute("aria-invalid")).toBe("true");

    await edit(box, (editor) => editor.commands.insertContent("Consultoria"));
    await act(async () => {
      screen.getByRole("button", { name: "Salvar" }).click();
    });
    await settle();

    expect(saved).toEqual({ descricao: "<p>Consultoria</p>" });
    expect(box.getAttribute("aria-invalid")).toBeNull();
  });
});
