import { expect, mock, test } from "bun:test";
import { Glob } from "bun";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CookieConsent } from "../src/components/cookie-consent";
import { QueryBoundary } from "../src/components/query-boundary";
import { RivoProvider } from "../src/provider/rivo-provider";

const ROOT = join(import.meta.dir, "..");
const PUBLIC_DEFAULT = new Set(["src/components/button.tsx", "src/components/icon-button.tsx"]);

function openingTags(source: string) {
  const found: { tag: string; line: number }[] = [];
  const pattern = /<(Button|IconButton|button)(\s|>)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    let index = match.index + 1;
    let depth = 0;
    for (; index < source.length; index++) {
      const char = source[index];
      if (char === "{") depth++;
      else if (char === "}") depth--;
      else if (char === ">" && depth === 0 && source[index - 1] !== "=") break;
    }
    found.push({
      tag: source.slice(match.index, index + 1),
      line: source.slice(0, match.index).split("\n").length,
    });
  }
  return found;
}

test("todo botao que uma peca desenha por dentro declara type, e nao envia o formulario em volta", () => {
  const files = [...new Glob("src/**/*.tsx").scanSync(ROOT)].filter(
    (file) => !PUBLIC_DEFAULT.has(file),
  );
  expect(files.length).toBeGreaterThan(100);

  let seen = 0;
  const missing: string[] = [];
  for (const file of files) {
    for (const { tag, line } of openingTags(readFileSync(join(ROOT, file), "utf8"))) {
      seen++;
      if (!/\btype=/.test(tag)) missing.push(`${file}:${line}`);
    }
  }

  expect(seen).toBeGreaterThan(60);
  expect(missing).toEqual([]);
});

function insideForm(ui: React.ReactNode) {
  const onSubmit = mock((event: React.FormEvent) => event.preventDefault());
  render(
    <RivoProvider scope="local">
      <form onSubmit={onSubmit}>{ui}</form>
    </RivoProvider>,
  );
  return onSubmit;
}

test("tentar de novo no QueryBoundary dentro de um formulario nao envia o formulario", () => {
  const onRetry = mock(() => {});
  const onSubmit = insideForm(
    <QueryBoundary isError onRetry={onRetry} data={undefined}>
      {() => null}
    </QueryBoundary>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(onSubmit).not.toHaveBeenCalled();
});

test("decidir no aviso de cookies dentro de um formulario nao envia o formulario", () => {
  const onSubmit = insideForm(
    <CookieConsent open onDecision={() => {}} policyHref="/privacidade" />,
  );

  for (const button of screen.getAllByRole("button")) fireEvent.click(button);

  expect(onSubmit).not.toHaveBeenCalled();
});
