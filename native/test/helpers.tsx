import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import type { ReactElement } from "react";

import { RivoProvider, type RivoProviderProps } from "../src";
import { declaredColor, variableDeclarations } from "./css-compilado";

/** Monta dentro do provider, como todo app monta. */
export function render(
  element: ReactElement,
  providerProps?: Omit<RivoProviderProps, "children">,
): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<RivoProvider {...providerProps}>{element}</RivoProvider>);
  });
  return renderer;
}

/** O texto todo da arvore, para afirmar "isto esta na tela" sem caçar nos. */
export function textOf(renderer: ReactTestRenderer): string {
  const chunks: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === "string" || typeof node === "number") {
      chunks.push(String(node));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object" && "children" in node) {
      walk((node as { children: unknown }).children);
    }
  };
  walk(renderer.toJSON());
  // JSX fragmenta {mes} de {ano} em tres filhos; um espaco so entre eles.
  return chunks.join(" ").replace(/\s+/g, " ");
}

/* So os host elements: o findAll visita o componente E o host que ele
   rendeu, com as mesmas props, e tudo sairia contado em dobro. */
const hosts = (
  renderer: ReactTestRenderer,
  predicate: (node: ReactTestInstance) => boolean,
): ReactTestInstance[] =>
  renderer.root.findAll((node) => typeof node.type === "string" && predicate(node));

export function byRole(renderer: ReactTestRenderer, role: string): ReactTestInstance[] {
  return hosts(renderer, (node) => node.props?.accessibilityRole === role);
}

export function byLabel(renderer: ReactTestRenderer, label: string): ReactTestInstance[] {
  return hosts(renderer, (node) => node.props?.accessibilityLabel === label);
}

/** Pelo nome do elemento host, para o que nao tem papel nem rotulo. */
export function byType(renderer: ReactTestRenderer, type: string): ReactTestInstance[] {
  return hosts(renderer, (node) => node.type === type);
}

export function byClass(renderer: ReactTestRenderer, pattern: RegExp): ReactTestInstance[] {
  return hosts(renderer, (node) => pattern.test(node.props?.className ?? ""));
}

/**
 * O que "montar isto quebra" quer dizer no React 19: o erro sai do act como
 * AggregateError, nao da propria create. Aqui ele volta a ser uma mensagem.
 */
export function renderError(element: ReactElement): string {
  try {
    act(() => {
      create(element);
    });
  } catch (error) {
    const first = (error as AggregateError).errors?.[0] ?? error;
    return String(first);
  }
  return "";
}

export function paintedColor(
  node: ReactTestInstance,
  property: string,
  scheme: "light" | "dark",
): string | undefined {
  return declaredColor(String(node.props?.className ?? "").split(/\s+/), property, scheme);
}

export { act, variableDeclarations };
