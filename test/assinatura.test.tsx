import { afterEach, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { z } from "zod";

import { Field, FieldDescription, FieldLabel } from "../src/components/field";
import {
  SignaturePad,
  signatureToPng,
  signatureToSvg,
  type SignaturePadProps,
  type SignatureValue,
} from "../src/components/signature-pad";
import { Form } from "../src/form/form";
import { FormField } from "../src/form/form-field";
import { forValue } from "../src/form/adapters";
import { useZodForm } from "../src/form/use-zod-form";
import { checkSignaturePaper } from "../src/lib/contrast";
import { RivoProvider } from "../src/provider/rivo-provider";
import {
  extendStroke,
  isSignatureEmpty,
  signatureSvg,
  strokePath,
  strokeWidths,
  typedLayout,
} from "../src/shared/signature";

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(/\s+/);

function mount(props: Partial<SignaturePadProps> = {}) {
  const view = render(
    <RivoProvider scope="local">
      <Field>
        <FieldLabel>Assinatura do locatário</FieldLabel>
        <SignaturePad {...props} />
        <FieldDescription>Vale como aceite do contrato.</FieldDescription>
      </Field>
    </RivoProvider>,
  );
  return { ...view, ...parts(view.container) };
}

function parts(container: HTMLElement) {
  const group = container.querySelector("[role='group']") as HTMLElement;
  const pad = container.querySelector("[role='img']") as HTMLElement;
  pad.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 300, height: 100, right: 300, bottom: 100, x: 0, y: 0 }) as DOMRect;
  return { group, pad };
}

let clock = 1000;

function draw(pad: HTMLElement, points: Array<[number, number]>, pointerId = 1) {
  const [first, ...rest] = points;
  fireEvent.pointerDown(pad, {
    pointerId,
    pointerType: "mouse",
    button: 0,
    clientX: first![0],
    clientY: first![1],
    timeStamp: (clock += 16),
  });
  for (const [clientX, clientY] of rest) {
    fireEvent.pointerMove(pad, { pointerId, clientX, clientY, timeStamp: (clock += 16) });
  }
  fireEvent.pointerUp(pad, { pointerId });
}

afterEach(() => {
  document.documentElement.style.removeProperty("--rc-signature-ink");
  document.documentElement.style.removeProperty("--rc-signature-paper");
});

test("um traco com o mouse vira pontos nas unidades do desenho, e o valor sai ao soltar", () => {
  const onValueChange = mock((_value: SignatureValue | null) => {});
  const { pad } = mount({ onValueChange });

  expect(screen.getByText("Assine aqui")).toBeTruthy();
  draw(pad, [
    [30, 50],
    [90, 60],
    [150, 40],
  ]);

  expect(onValueChange).toHaveBeenCalledTimes(1);
  const value = onValueChange.mock.calls[0]![0]!;
  expect(value.kind).toBe("drawn");
  if (value.kind !== "drawn") return;
  expect(value.width).toBe(600);
  expect(value.height).toBe(200);
  expect(value.strokes).toHaveLength(1);
  expect(value.strokes[0]!.map(({ x, y }) => [x, y])).toEqual([
    [60, 100],
    [180, 120],
    [300, 80],
  ]);
  expect(pad.getAttribute("aria-label")).toBe("Assinatura desenhada, 1 traço");
  expect(screen.queryByText("Assine aqui")).toBeNull();
  expect(pad.querySelectorAll("path")).toHaveLength(1);
});

test("o botao direito do mouse nao desenha, e o segundo dedo nao abre outro traco no meio do primeiro", () => {
  const onValueChange = mock((_value: SignatureValue | null) => {});
  const { pad } = mount({ onValueChange });

  fireEvent.pointerDown(pad, { pointerId: 1, pointerType: "mouse", button: 2, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(pad, { pointerId: 1 });
  expect(onValueChange).not.toHaveBeenCalled();

  fireEvent.pointerDown(pad, { pointerId: 1, pointerType: "touch", clientX: 10, clientY: 50 });
  fireEvent.pointerDown(pad, { pointerId: 2, pointerType: "touch", clientX: 200, clientY: 50 });
  fireEvent.pointerMove(pad, { pointerId: 2, clientX: 260, clientY: 60 });
  fireEvent.pointerMove(pad, { pointerId: 1, clientX: 80, clientY: 70 });
  fireEvent.pointerUp(pad, { pointerId: 2 });
  expect(onValueChange).not.toHaveBeenCalled();
  fireEvent.pointerUp(pad, { pointerId: 1 });

  expect(onValueChange).toHaveBeenCalledTimes(1);
  const value = onValueChange.mock.calls[0]![0]!;
  expect(value.kind === "drawn" && value.strokes[0]!.map(({ x }) => x)).toEqual([20, 160]);
});

test("a caneta grava a pressao, e o mouse e o dedo nao inventam uma", () => {
  const onValueChange = mock((_value: SignatureValue | null) => {});
  const { pad } = mount({ onValueChange });

  fireEvent.pointerDown(pad, { pointerId: 3, pointerType: "pen", pressure: 0.8, clientX: 10, clientY: 50 });
  fireEvent.pointerUp(pad, { pointerId: 3 });
  draw(pad, [[40, 50]]);

  const value = onValueChange.mock.calls[1]![0]!;
  if (value.kind !== "drawn") throw new Error("esperava tracos");
  expect(value.strokes[0]![0]!.pressure).toBe(0.8);
  expect("pressure" in value.strokes[1]![0]!).toBe(false);
});

test("vazia, a area mostra a guia, os botoes ficam inativos e o campo escondido vai vazio", () => {
  const { container, pad } = mount({ name: "assinatura" });

  expect(pad.getAttribute("aria-label")).toBe("Nenhuma assinatura");
  expect((screen.getByRole("button", { name: "Desfazer o último traço" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Limpar assinatura" }) as HTMLButtonElement).disabled).toBe(true);
  const hidden = container.querySelector("input[type='hidden'][name='assinatura']") as HTMLInputElement;
  expect(hidden.value).toBe("");
  expect(tokens(screen.getByText("Assine aqui"))).toContain("text-signature-guide");
  expect(tokens(pad.querySelector("line")!)).toContain("stroke-signature-guide");
});

test("desfazer tira o ultimo traco, e desfazer o unico devolve null", () => {
  const onValueChange = mock((_value: SignatureValue | null) => {});
  const { pad } = mount({ onValueChange });

  draw(pad, [[10, 50], [60, 50]]);
  draw(pad, [[10, 80], [60, 20]]);
  expect(pad.getAttribute("aria-label")).toBe("Assinatura desenhada, 2 traços");

  fireEvent.click(screen.getByRole("button", { name: "Desfazer o último traço" }));
  const after = onValueChange.mock.lastCall![0]!;
  expect(after.kind === "drawn" && after.strokes.length).toBe(1);
  expect(screen.getByRole("status").textContent).toBe("Último traço desfeito");

  fireEvent.click(screen.getByRole("button", { name: "Desfazer o último traço" }));
  expect(onValueChange.mock.lastCall![0]).toBeNull();
  expect(screen.getByText("Assine aqui")).toBeTruthy();
});

test("limpar devolve null, avisa o leitor de tela e leva o foco para o botao que continua vivo", () => {
  const onValueChange = mock((_value: SignatureValue | null) => {});
  const { pad } = mount({ onValueChange });

  draw(pad, [[10, 50], [60, 50]]);
  const clear = screen.getByRole("button", { name: "Limpar assinatura" });
  clear.focus();
  fireEvent.click(clear);

  expect(onValueChange.mock.lastCall![0]).toBeNull();
  expect(screen.getByRole("status").textContent).toBe("Assinatura limpa");
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Digitar assinatura" }));
});

test("com name, o campo escondido leva o SVG com um caminho por traco", () => {
  const { container, pad } = mount({ name: "assinatura" });
  draw(pad, [[10, 50], [60, 50], [120, 30]]);
  draw(pad, [[200, 50]]);

  const hidden = container.querySelector("input[name='assinatura']") as HTMLInputElement;
  expect(hidden.value.startsWith("<svg")).toBe(true);
  expect(hidden.value.match(/<path /g)).toHaveLength(2);
  expect(hidden.value).toContain('viewBox="0 0 600 200"');
});

test("digitar assinatura troca o desenho pelo nome em cursiva, e voltar devolve os tracos", () => {
  const onValueChange = mock((_value: SignatureValue | null) => {});
  const { pad } = mount({ onValueChange, font: '"Great Vibes", cursive' });

  draw(pad, [[10, 50], [60, 50]]);
  fireEvent.click(screen.getByRole("button", { name: "Digitar assinatura" }));

  expect(onValueChange.mock.lastCall![0]).toBeNull();
  const input = screen.getByLabelText("Nome para a assinatura") as HTMLInputElement;
  expect(document.activeElement).toBe(input);
  expect(screen.queryByRole("button", { name: "Desfazer o último traço" })).toBeNull();

  fireEvent.change(input, { target: { value: "Ana Souza" } });
  expect(onValueChange.mock.lastCall![0]).toEqual({
    kind: "typed",
    text: "Ana Souza",
    font: '"Great Vibes", cursive',
    width: 600,
    height: 200,
  });
  expect(pad.getAttribute("aria-label")).toBe("Assinatura digitada: Ana Souza");
  const text = pad.querySelector("text")!;
  expect(text.textContent).toBe("Ana Souza");
  expect(tokens(text)).toContain("fill-signature-ink");

  fireEvent.change(input, { target: { value: "   " } });
  expect(onValueChange.mock.lastCall![0]).toBeNull();
  fireEvent.change(input, { target: { value: "Ana" } });

  fireEvent.click(screen.getByRole("button", { name: "Desenhar assinatura" }));
  const back = onValueChange.mock.lastCall![0]!;
  expect(back.kind === "drawn" && back.strokes.length).toBe(1);
  expect(screen.queryByLabelText("Nome para a assinatura")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Digitar assinatura" }));
  expect(onValueChange.mock.lastCall![0]).toMatchObject({ kind: "typed", text: "Ana" });
});

test("defaultMode type abre no nome digitado, para quem nao desenha", () => {
  mount({ defaultMode: "type" });
  expect(screen.getByLabelText("Nome para a assinatura")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Desenhar assinatura" })).toBeTruthy();
});

test("desabilitada, nao desenha, trava os botoes e o nome, e pinta a guia inativa", () => {
  const onValueChange = mock((_value: SignatureValue | null) => {});
  const { group, pad } = mount({ onValueChange, disabled: true });

  draw(pad, [[10, 50], [60, 50]]);
  expect(onValueChange).not.toHaveBeenCalled();
  expect(group.hasAttribute("data-disabled")).toBe(true);
  expect((screen.getByRole("button", { name: "Digitar assinatura" }) as HTMLButtonElement).disabled).toBe(true);
  expect(tokens(pad)).toContain("border-border-disabled");
  expect(tokens(screen.getByText("Assine aqui"))).toContain("text-signature-disabled");
  expect(tokens(screen.getByText("Assine aqui"))).not.toContain("text-signature-guide");
});

test("so leitura exibe a assinatura sem botoes e sem desenho", () => {
  const value: SignatureValue = {
    kind: "drawn",
    strokes: [[{ x: 10, y: 100, time: 0 }, { x: 80, y: 120, time: 16 }]],
    width: 600,
    height: 200,
  };
  const onValueChange = mock((_value: SignatureValue | null) => {});
  const { pad } = mount({ value, onValueChange, readOnly: true });

  expect(screen.queryAllByRole("button")).toHaveLength(0);
  draw(pad, [[100, 50], [160, 50]]);
  expect(onValueChange).not.toHaveBeenCalled();
  expect(pad.querySelectorAll("path")).toHaveLength(1);
});

test("dentro do Field, o grupo leva o nome do rotulo, a instrucao e a descricao", () => {
  const { group } = mount();
  const label = screen.getByText("Assinatura do locatário");

  expect(group.getAttribute("aria-labelledby")).toBe(label.id);
  const described = group.getAttribute("aria-describedby")!.split(" ");
  const texts = described.map((id) => document.getElementById(id)?.textContent);
  expect(texts).toContain("Vale como aceite do contrato.");
  expect(texts.some((text) => text?.includes("Digitar assinatura"))).toBe(true);
});

test("fora do Field, sem nome dado, o grupo se chama Assinatura", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <SignaturePad />
    </RivoProvider>,
  );
  expect(container.querySelector("[role='group']")!.getAttribute("aria-label")).toBe("Assinatura");
});

test("invalid pinta a moldura de perigo e anuncia, e o Field invalido liga sozinho", () => {
  const { group, pad } = mount({ invalid: true });
  expect(group.getAttribute("aria-invalid")).toBe("true");
  expect(tokens(pad)).toContain("border-danger");
  expect(tokens(pad)).not.toContain("border-border-strong");

  const second = render(
    <RivoProvider scope="local">
      <Field invalid>
        <FieldLabel>Outra</FieldLabel>
        <SignaturePad />
      </Field>
    </RivoProvider>,
  );
  const other = parts(second.container);
  expect(other.group.getAttribute("aria-invalid")).toBe("true");
  expect(tokens(other.pad)).toContain("border-danger");
});

const schema = z.object({
  signature: z.custom<SignatureValue | null>().refine((value) => value !== null, {
    message: "Assine para continuar",
  }),
});

function Contract({ onSubmit }: { onSubmit: (data: { signature: SignatureValue | null }) => void }) {
  const form = useZodForm(schema, { defaultValues: { signature: null } });
  return (
    <RivoProvider scope="local">
      <Form form={form} onSubmit={onSubmit}>
        <FormField name="signature" label="Assinatura">
          {(row) => <SignaturePad {...forValue(row)} />}
        </FormField>
        <button type="submit">Aceitar</button>
      </Form>
    </RivoProvider>
  );
}

test("no FormField com o forValue, vazio e sem assinatura e o erro do schema aparece", async () => {
  const onSubmit = mock((_data: { signature: SignatureValue | null }) => {});
  const view = render(<Contract onSubmit={onSubmit} />);

  await act(async () => fireEvent.click(screen.getByText("Aceitar")));
  await waitFor(() => expect(screen.getByText("Assine para continuar")).toBeTruthy());
  expect(onSubmit).not.toHaveBeenCalled();
  const { group, pad } = parts(view.container);
  expect(group.getAttribute("aria-invalid")).toBe("true");

  await act(async () => draw(pad, [[10, 50], [80, 60]]));
  await act(async () => fireEvent.click(screen.getByText("Aceitar")));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0].signature?.kind).toBe("drawn");
});

test("controlada, a peca desenha o value e nao guarda nada por conta propria", () => {
  function Controlled() {
    const [value, setValue] = useState<SignatureValue | null>(null);
    return (
      <RivoProvider scope="local">
        <SignaturePad value={value} onValueChange={setValue} />
        <button type="button" onClick={() => setValue(null)}>
          Zerar
        </button>
      </RivoProvider>
    );
  }
  const view = render(<Controlled />);
  const { pad } = parts(view.container);
  draw(pad, [[10, 50], [60, 50]]);
  expect(pad.querySelectorAll("path")).toHaveLength(1);
  fireEvent.click(screen.getByText("Zerar"));
  expect(pad.querySelectorAll("path")).toHaveLength(0);
});

test("o SVG exportado sai com a tinta do token, escura, e nunca com a cor do tema", () => {
  document.documentElement.style.setProperty("--rc-signature-ink", "#0b0d0f");
  document.documentElement.style.setProperty("--rc-signature-paper", "#ffffff");
  const value: SignatureValue = {
    kind: "drawn",
    strokes: [[{ x: 10, y: 100, time: 0 }, { x: 80, y: 120, time: 16 }, { x: 160, y: 90, time: 32 }]],
    width: 600,
    height: 200,
  };

  const svg = signatureToSvg(value);
  expect(svg).toContain('fill="#0b0d0f"');
  expect(svg).not.toContain("<rect");
  expect(signatureToSvg(value, { paper: true })).toContain('<rect width="600" height="200" fill="#ffffff"/>');
  expect(signatureToSvg(value, { ink: "navy" })).toContain('fill="navy"');
  expect(signatureToSvg(null)).toBe("");
});

test("o SVG do nome digitado leva a fonte e escapa o texto", () => {
  const svg = signatureSvg(
    { kind: "typed", text: 'Ana & "Bia" <Souza>', font: '"Great Vibes", cursive', width: 600, height: 200 },
    { ink: "black" },
  );
  expect(svg).toContain("Ana &amp; &quot;Bia&quot; &lt;Souza&gt;</text>");
  expect(svg).toContain('font-family="&quot;Great Vibes&quot;, cursive"');
  expect(svg).toContain('text-anchor="middle"');
});

test("o PNG desenha cada traco no canvas com a tinta, e o nome com fillText", async () => {
  const fills: string[] = [];
  const texts: string[] = [];
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    scale: () => {},
    fillRect: () => fills.push(`rect:${context.fillStyle}`),
    fill: () => fills.push(`path:${context.fillStyle}`),
    fillText: (text: string) => texts.push(text),
  };
  const prototype = HTMLCanvasElement.prototype as unknown as Record<string, unknown>;
  const original = { getContext: prototype.getContext, toDataURL: prototype.toDataURL };
  const OriginalPath = (globalThis as { Path2D?: unknown }).Path2D;
  prototype.getContext = () => context;
  prototype.toDataURL = () => "data:image/png;base64,AAAA";
  (globalThis as { Path2D?: unknown }).Path2D = class {
    constructor(public d: string) {}
  };

  try {
    const drawn: SignatureValue = {
      kind: "drawn",
      strokes: [[{ x: 10, y: 100, time: 0 }, { x: 80, y: 120, time: 16 }], [{ x: 300, y: 100, time: 40 }]],
      width: 600,
      height: 200,
    };
    expect(await signatureToPng(drawn, { ink: "black", paper: "white" })).toBe(
      "data:image/png;base64,AAAA",
    );
    expect(fills).toEqual(["rect:white", "path:black", "path:black"]);

    await signatureToPng({ kind: "typed", text: " Ana ", font: "cursive", width: 600, height: 200 });
    expect(texts).toEqual(["Ana"]);
    expect(await signatureToPng(null)).toBe("");
  } finally {
    prototype.getContext = original.getContext;
    prototype.toDataURL = original.toDataURL;
    (globalThis as { Path2D?: unknown }).Path2D = OriginalPath;
  }
});

test("o traco rapido afina e a caneta apertada engrossa", () => {
  const slow = [
    { x: 0, y: 0, time: 0 },
    { x: 4, y: 0, time: 40 },
    { x: 8, y: 0, time: 80 },
    { x: 12, y: 0, time: 120 },
  ];
  const fast = slow.map((point, index) => ({ ...point, x: point.x * 25, time: index * 8 }));
  const slowWidth = strokeWidths(slow).at(-1)!;
  const fastWidth = strokeWidths(fast).at(-1)!;
  expect(fastWidth).toBeLessThan(slowWidth);

  const light = slow.map((point) => ({ ...point, pressure: 0.1 }));
  const heavy = slow.map((point) => ({ ...point, pressure: 1 }));
  expect(strokeWidths(heavy)[1]!).toBeGreaterThan(strokeWidths(light)[1]!);
});

test("ponto sozinho vira bolinha, ponto colado no anterior nao entra, e vazio e vazio", () => {
  expect(strokePath([{ x: 10, y: 10, time: 0 }])).toMatch(/^M[\d.]+ 10A.*Z$/);
  const stroke = [{ x: 10, y: 10, time: 0 }];
  expect(extendStroke(stroke, { x: 10.5, y: 10.5, time: 8 })).toBe(stroke);
  expect(extendStroke(stroke, { x: 20, y: 10, time: 8 })).toHaveLength(2);
  expect(isSignatureEmpty(null)).toBe(true);
  expect(isSignatureEmpty({ kind: "typed", text: "  ", font: "cursive", width: 600, height: 200 })).toBe(true);
  expect(isSignatureEmpty({ kind: "drawn", strokes: [[]], width: 600, height: 200 })).toBe(true);
});

test("nome longo encolhe a fonte e, no limite, espreme para caber na linha", () => {
  const short = typedLayout("Ana", 600, 200);
  const long = typedLayout("Maria Aparecida dos Santos Figueiredo de Albuquerque", 600, 200);
  expect(long.fontSize).toBeLessThan(short.fontSize);
  expect(short.fit).toBeUndefined();
  expect(typedLayout("x".repeat(200), 600, 200).fit).toBe(504);
});

test("a guarda do papel da assinatura reprova a tinta clara, que sairia invertida no documento", () => {
  const good = checkSignaturePaper("casa", {
    ink: "#0b0d0f",
    paper: "#ffffff",
    guide: "#6c737b",
    disabled: "#b9bfc6",
  });
  expect(good.every((finding) => finding.ok)).toBe(true);

  const inverted = checkSignaturePaper("invertida", {
    ink: "#ffffff",
    paper: "#0b0d0f",
    guide: "#6c737b",
    disabled: "#b9bfc6",
  });
  expect(inverted.some((finding) => !finding.ok && finding.line.includes("invertida"))).toBe(true);
});
