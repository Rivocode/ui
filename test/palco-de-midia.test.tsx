import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ImageViewer, type ImageViewerImage } from "../src/components/image-viewer";
import { CSS_MEDIA, checkMediaStage, readTokens } from "../src/lib/contrast";
import { RivoProvider } from "../src/provider/rivo-provider";
import { scanAtLeast } from "../scripts/varredura";

afterEach(cleanup);

const PHOTOS: ImageViewerImage[] = [
  { src: "https://exemplo.com.br/sala-1.jpg", alt: "Sala, foto 1", caption: "Recepção" },
  { src: "https://exemplo.com.br/sala-2.jpg", alt: "Sala, foto 2" },
];

async function open(theme: "rivocode-light" | "rivocode-dark") {
  render(
    <RivoProvider scope="local" theme={theme}>
      <ImageViewer images={PHOTOS} defaultIndex={0} thumbnails={false} />
    </RivoProvider>,
  );
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  fireEvent.load(screen.getByRole("dialog").querySelector("img")!);
  return screen.getByRole("dialog");
}

const tokensOf = (element: Element) => element.getAttribute("class")!.split(" ");

for (const theme of ["rivocode-light", "rivocode-dark"] as const) {
  test(`no ${theme}, a tela cheia abre no palco escuro, e nao no fundo do tema`, async () => {
    const dialog = await open(theme);
    const classes = tokensOf(dialog);
    expect(classes).toContain("bg-media-stage");
    expect(classes).toContain("text-media-fg");
    expect(classes).not.toContain("bg-bg");
    expect(classes).not.toContain("bg-surface");
  });
}

test("os controles vestem o palco, e nenhum papel de tema sobra neles", async () => {
  const dialog = await open("rivocode-light");
  const names = ["Diminuir o zoom", "Aumentar o zoom", "Fechar", "Imagem anterior", "Próxima imagem"];
  for (const name of names) {
    const classes = tokensOf(screen.getByRole("button", { name }));
    expect(classes).toContain("bg-media-control");
    expect(classes).toContain("border-media-border");
    expect(classes).toContain("text-media-fg");
    expect(classes).toContain("focus-visible:ring-media-fg");
    expect(classes).toContain("focus-visible:ring-offset-media-stage");
    expect(classes).toContain("not-data-loading:disabled:border-media-disabled");
    expect(classes).toContain("not-data-loading:disabled:text-media-disabled");
    for (const role of [
      "bg-surface",
      "border-border-strong",
      "text-fg",
      "hover:bg-surface-raised",
      "focus-visible:ring-ring",
      "focus-visible:ring-offset-bg",
      "not-data-loading:disabled:bg-surface-raised",
      "not-data-loading:disabled:text-fg-disabled",
      "not-data-loading:disabled:border-border-disabled",
    ]) {
      expect(classes).not.toContain(role);
    }
  }
  expect(dialog.textContent).toContain("Recepção");
});

test("o contador, a legenda e o erro leem o texto do palco", async () => {
  const dialog = await open("rivocode-light");
  const counter = [...dialog.querySelectorAll("p")].find((node) => node.textContent === "1 de 2")!;
  expect(tokensOf(counter)).toContain("text-media-fg-muted");
  expect(tokensOf(counter)).not.toContain("text-fg-muted");

  const caption = [...dialog.querySelectorAll("div")].find(
    (node) => node.textContent === "Recepção",
  )!;
  expect(tokensOf(caption)).toContain("text-media-fg");
  expect(tokensOf(caption)).not.toContain("text-fg");

  fireEvent.error(dialog.querySelector("img")!);
  const alert = screen.getByRole("alert");
  expect(tokensOf(alert)).toContain("text-media-fg-muted");
});

test("o palco mora em scales.css, mede os pares, e nenhum tema o declara", async () => {
  const palette = await Bun.file("src/tokens/palette.css").text();
  const scales = await Bun.file("src/tokens/scales.css").text();
  const fixed = readTokens(palette + "\n" + scales);
  const colors = Object.fromEntries(
    Object.entries(CSS_MEDIA).map(([role, token]) => [role, fixed[token]]),
  );
  const findings = checkMediaStage("scales", colors);
  expect(findings.length).toBeGreaterThan(8);
  expect(findings.filter((finding) => !finding.ok)).toEqual([]);

  const themes = await scanAtLeast("src/tokens/themes/*.css", 2);
  expect(themes.length).toBeGreaterThan(1);
  for (const file of themes) {
    const css = await Bun.file(file).text();
    for (const token of Object.values(CSS_MEDIA)) expect(css).not.toContain(`${token}:`);
  }
});

test("a guarda reprova palco claro e controle mais escuro que o palco", () => {
  const good = {
    stage: "#0b0d0f",
    control: "#14171a",
    fg: "#f2f3f0",
    fgMuted: "#b9bfc6",
    border: "#8b9199",
    disabled: "#5b6169",
  };
  expect(checkMediaStage("boa", good).every((finding) => finding.ok)).toBe(true);
  expect(checkMediaStage("clara", { ...good, stage: "#fbfbfa" }).some((f) => !f.ok)).toBe(true);
  expect(
    checkMediaStage("invertida", { ...good, fg: "#0b0d0f", stage: "#000000" }).some((f) => !f.ok),
  ).toBe(true);
  expect(checkMediaStage("sem papel", { ...good, border: undefined }).some((f) => !f.ok)).toBe(
    true,
  );
});
