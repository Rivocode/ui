import { expect, test } from "bun:test";
import type { ReactTestInstance } from "react-test-renderer";

import { ImageViewer, type ImageViewerImage } from "../src";
import { tokens } from "../tokens";
import { byLabel, byType, render } from "./helpers";

const PHOTOS: ImageViewerImage[] = [
  { src: "https://exemplo.com.br/sala-1.jpg", alt: "Sala, foto 1", caption: "Recepção" },
  { src: "https://exemplo.com.br/sala-2.jpg", alt: "Sala, foto 2" },
];

const MEDIA = tokens.media;

function flat(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  if (style && typeof style === "object") return style as Record<string, unknown>;
  return {};
}

const styleOf = (node: ReactTestInstance) => flat(node.props.style);

function classesOf(node: ReactTestInstance): string[] {
  return String(node.props.className ?? "").split(/\s+/);
}

test("o palco tem valor fixo, fora dos temas, e e escuro", () => {
  expect(MEDIA["media-stage"]).toBe(tokens.palette["p-graphite-950"]);
  for (const theme of Object.values(tokens.themes)) {
    for (const role of Object.keys(MEDIA)) expect(Object.keys(theme)).not.toContain(role);
  }
});

test("a tela cheia abre no palco escuro, e nao no fundo do tema", () => {
  const screen = render(<ImageViewer images={PHOTOS} index={0} onIndexChange={() => {}} />);
  const [modal] = byType(screen, "Modal");
  expect(modal).toBeDefined();
  const layer = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.accessibilityViewIsModal === true,
  )[0]!;
  expect(styleOf(layer).backgroundColor).toBe(MEDIA["media-stage"]);
  expect(classesOf(layer)).not.toContain("bg-bg");
});

test("os controles, o contador e a legenda vestem o palco", () => {
  const screen = render(<ImageViewer images={PHOTOS} index={0} onIndexChange={() => {}} />);
  const names = ["Diminuir o zoom", "Aumentar o zoom", "Fechar", "Imagem anterior", "Próxima imagem"];
  for (const name of names) {
    const [control] = byLabel(screen, name);
    expect(control).toBeDefined();
    expect(styleOf(control!).backgroundColor).toBe(MEDIA["media-control"]);
    expect(styleOf(control!).borderColor).toBe(MEDIA["media-border"]);
  }

  const counter = byLabel(screen, "1 de 2: Sala, foto 1")[0]!;
  expect(styleOf(counter).color).toBe(MEDIA["media-fg-muted"]);
  expect(classesOf(counter)).not.toContain("text-fg-muted");

  const caption = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.children === "Recepção",
  )[0]!;
  expect(styleOf(caption).color).toBe(MEDIA["media-fg"]);
  expect(classesOf(caption)).not.toContain("text-fg");

  const glyphs = screen.root.findAll(
    (node) =>
      typeof node.type === "string" &&
      classesOf(node).includes("bg-fg") &&
      styleOf(node).backgroundColor === MEDIA["media-fg"],
  );
  expect(glyphs.length).toBeGreaterThan(3);
});
