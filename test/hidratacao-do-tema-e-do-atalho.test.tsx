import { afterEach, expect, test } from "bun:test";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";

import { Kbd } from "../src/components/kbd";
import { RivoProvider } from "../src/provider/rivo-provider";

const realMatchMedia = window.matchMedia;
const realPlatform = Object.getOwnPropertyDescriptor(navigator, "platform");
const roots: Root[] = [];

afterEach(() => {
  window.matchMedia = realMatchMedia;
  if (realPlatform) Object.defineProperty(navigator, "platform", realPlatform);
  else delete (navigator as { platform?: string }).platform;
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.innerHTML = "";
});

function prefersLight(light: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches: light && query.includes("light"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

function platform(value: string) {
  Object.defineProperty(navigator, "platform", { value, configurable: true });
}

async function hydrate(ui: ReactNode, html: string) {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  const errors: unknown[] = [];
  await act(async () => {
    roots.push(hydrateRoot(host, ui, { onRecoverableError: (error) => errors.push(error) }));
  });
  return { host, errors };
}

test("o tema do sistema hidrata igual ao servidor e so depois segue a preferencia clara", async () => {
  const ui = (
    <RivoProvider theme="system" scope="local">
      <p>conteudo</p>
    </RivoProvider>
  );

  prefersLight(true);
  const html = renderToString(ui);
  expect(html).toContain('data-rc-theme="rivocode-dark"');

  const { host, errors } = await hydrate(ui, html);

  expect(errors).toEqual([]);
  expect(host.querySelector("[data-rc-theme]")!.getAttribute("data-rc-theme")).toBe(
    "rivocode-light",
  );
});

test("o atalho sai na forma neutra no servidor e vira o simbolo do Mac depois de montar", async () => {
  platform("MacIntel");
  const ui = <Kbd keys="mod+k" />;

  const html = renderToString(ui);
  expect(html).toContain("Ctrl");
  expect(html).not.toContain("⌘");

  const { host, errors } = await hydrate(ui, html);

  expect(errors).toEqual([]);
  const keys = [...host.querySelectorAll("kbd")].map((key) => key.textContent);
  expect(keys).toEqual(["⌘", "K"]);
  expect(host.querySelector("[role=img]")!.getAttribute("aria-label")).toBe("Command mais K");
});

test("fora do Mac o atalho continua Ctrl depois de montar", async () => {
  platform("Win32");
  const ui = <Kbd keys="mod+k" />;
  const { host, errors } = await hydrate(ui, renderToString(ui));

  expect(errors).toEqual([]);
  expect([...host.querySelectorAll("kbd")].map((key) => key.textContent)).toEqual(["Ctrl", "K"]);
});
