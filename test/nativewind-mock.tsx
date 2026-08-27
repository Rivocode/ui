import { createElement, useEffect, useState, type ReactNode } from "react";

import { declaredColor } from "../native/test/css-compilado";

type Scheme = "light" | "dark" | null;

type ColorSchemeSource = {
  get: () => Scheme;
  subscribe: (listener: () => void) => () => void;
};

let source: ColorSchemeSource = { get: () => null, subscribe: () => () => {} };

export function connectColorScheme(next: ColorSchemeSource) {
  source = next;
}

function useScheme(): "light" | "dark" {
  const [scheme, setScheme] = useState<Scheme>(source.get);
  useEffect(() => {
    setScheme(source.get());
    return source.subscribe(() => setScheme(source.get()));
  }, []);
  return scheme === "light" ? "light" : "dark";
}

export function useCssElement(
  component: (props: Record<string, unknown>) => unknown,
  props: Record<string, unknown>,
  _mapping: Record<string, string>,
) {
  const scheme = useScheme();
  const { className, ...rest } = props;
  const worn = String(className ?? "").split(/\s+/);
  const backgroundColor = declaredColor(worn, "background-color", scheme);
  const color = declaredColor(worn, "color", scheme);
  const style =
    backgroundColor === undefined && color === undefined ? null : { backgroundColor, color };

  return createElement(component as never, { ...rest, style });
}

export function VariableContextProvider({
  value,
  children,
}: {
  value: Record<string, string>;
  children: ReactNode;
}) {
  return createElement("VariableContextProvider", { value }, children);
}

export function vars(value: Record<string, string>) {
  return value;
}
