import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import type { ReactElement } from "react";

import { RivoProvider, type RivoProviderProps } from "../src";
import { declaredColor, variableDeclarations } from "./compiled-css";

/** Mounts inside the provider, the way every app mounts. */
const mounted: ReactTestRenderer[] = ((
  globalThis as { __rivoMounted?: ReactTestRenderer[] }
).__rivoMounted ??= []);

export function render(
  element: ReactElement,
  providerProps?: Omit<RivoProviderProps, "children">,
): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<RivoProvider {...providerProps}>{element}</RivoProvider>);
  });
  mounted.push(renderer);
  return renderer;
}

/** All the text in the tree, to assert "this is on screen" without hunting nodes. */
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
  // JSX splits {month} de {year} into three children; a single space between them.
  return chunks.join(" ").replace(/\s+/g, " ");
}

/* Only the host elements: findAll visits the component AND the host it
   rendered, with the same props, and everything would be counted twice. */
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

/** By the host element's name, for what has neither role nor label. */
export function byType(renderer: ReactTestRenderer, type: string): ReactTestInstance[] {
  return hosts(renderer, (node) => node.type === type);
}

export function byClass(renderer: ReactTestRenderer, pattern: RegExp): ReactTestInstance[] {
  return hosts(renderer, (node) => pattern.test(node.props?.className ?? ""));
}

/**
 * What "mounting this breaks" means in React 19: the error comes out of act as
 * an AggregateError, not from create itself. Here it becomes a message again.
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
