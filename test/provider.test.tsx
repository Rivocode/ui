import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider, useRivoContext, type RivoThemeSetting } from "../src/provider/rivo-provider";

function Spy() {
  const { theme, density, portalContainer } = useRivoContext();
  return (
    <span data-testid="spy" data-portal={portalContainer ? "yes" : "no"}>
      {theme}/{density}
    </span>
  );
}

test("global mode marks the theme on the document root element", () => {
  render(
    <RivoProvider scope="global" theme="rivocode-dark">
      <p>hello</p>
    </RivoProvider>,
  );
  expect(document.documentElement.dataset.rcTheme).toBe("rivocode-dark");
  expect(document.documentElement.dataset.rcDensity).toBe("comfortable");
});

test("scoped mode marks its own element and does not touch the document", () => {
  document.documentElement.removeAttribute("data-rc-theme");
  render(
    <RivoProvider scope="local" theme="rivocode-light" density="compact">
      <p>hello</p>
    </RivoProvider>,
  );
  const scope = document.querySelector('div[data-rc-theme="rivocode-light"]');
  expect(scope).not.toBeNull();
  expect(scope?.getAttribute("data-rc-density")).toBe("compact");
  expect(document.documentElement.dataset.rcTheme).toBeUndefined();
});

test("the context delivers theme, density and portal container", () => {
  render(
    <RivoProvider theme="rivocode-dark" density="compact">
      <Spy />
    </RivoProvider>,
  );
  expect(screen.getByTestId("spy").textContent).toBe("rivocode-dark/compact");
  expect(screen.getByTestId("spy").dataset.portal).toBe("yes");
});

test("the portal container carries the theme, otherwise the dialog comes out unstyled", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <p>hello</p>
    </RivoProvider>,
  );
  const portals = document.body.querySelectorAll(
    ':scope > [data-rc-portal][data-rc-theme="rivocode-light"]',
  );
  expect(portals.length).toBe(1);
});

test("using the context outside the Provider gives an error that explains what to do", () => {
  expect(() => render(<Spy />)).toThrow(/RivoProvider/);
});

test("a client theme dresses the tree, and the type accepts its name", () => {
  // The theming guide ends in <RivoProvider theme="acme">, and until now that
  // line did not compile: RivoTheme is a union closed over the two house
  // themes, so the whole customization guide - the white-label promise - ended
  // in a type error, and every client learned to write `as` at the system's
  // entry point.
  const { container } = render(
    <RivoProvider scope="local" theme="acme">
      <span>Nota</span>
    </RivoProvider>,
  );

  expect(container.querySelector('[data-rc-theme="acme"]')).not.toBeNull();
});

test("the theme switcher has its own type, with no hand-written union", () => {
  // Whoever writes a theme switcher - the first thing one writes - keeps the
  // state in this type.
  const choices: RivoThemeSetting[] = ["rivocode-dark", "rivocode-light", "system", "acme"];

  expect(choices.length).toBe(4);
});
