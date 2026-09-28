import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../src/components/tooltip";

function Example() {
  return (
    <Tooltip defaultOpen>
      <TooltipTrigger aria-label="Excluir">x</TooltipTrigger>
      <TooltipContent>Excluir nota</TooltipContent>
    </Tooltip>
  );
}

test("the tooltip shows and says what the icon button does", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByText("Excluir nota")).toBeDefined();
});

test("the tooltip needs no provider of its own, RivoProvider already carries one", () => {
  expect(() =>
    render(
      <RivoProvider>
        <Example />
      </RivoProvider>,
    ),
  ).not.toThrow();
});

test("the tooltip opens inside the container that carries the theme", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Example />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Excluir nota");
});

/* ---------------------------------------------------------------------------
 * The tooltip is for people who cannot see, too
 *
 * Measured with the tooltip open in the browser: `aria-describedby` on the
 * trigger was `null` and there was no `[role=tooltip]` in the document - the
 * popup existed, with the text inside, and without a role. Base UI 1.7.0 does
 * not do this wiring by its own decision: its documentation treats the tooltip
 * as a visual element and says to label the trigger. But the reach of that is
 * larger than the component: the `Stat` `hint` is a tooltip and exists only to
 * explain the number, and the collapsed sidebar uses the same mechanism to say
 * the name of each destination.
 *
 * What these tests do not reach: happy-dom has no accessibility tree, so here
 * the DOM wiring is proven - the role on the popup and the trigger's
 * `aria-describedby` pointing at its `id` - and not that the screen reader
 * reads the description together with the name.
 * ------------------------------------------------------------------------- */

test("the open tooltip presents itself as a tooltip and the trigger points at it", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );

  const tip = document.querySelector('[role="tooltip"]');
  expect(tip).not.toBeNull();
  expect(tip!.textContent).toBe("Excluir nota");

  const trigger = screen.getByRole("button", { name: "Excluir" });
  expect(tip!.id).not.toBe("");
  expect(trigger.getAttribute("aria-describedby")).toBe(tip!.id);
});

test("closed, the trigger does not point at an id that no longer exists", () => {
  render(
    <RivoProvider>
      <Tooltip>
        <TooltipTrigger aria-label="Excluir">x</TooltipTrigger>
        <TooltipContent>Excluir nota</TooltipContent>
      </Tooltip>
    </RivoProvider>,
  );

  const trigger = screen.getByRole("button", { name: "Excluir" });
  expect(trigger.getAttribute("aria-describedby")).toBeNull();
});

test("the caller's aria-describedby still applies alongside ours", () => {
  render(
    <RivoProvider>
      <p id="ajuda">A nota some da listagem.</p>
      <Tooltip defaultOpen>
        <TooltipTrigger aria-label="Excluir" aria-describedby="ajuda">
          x
        </TooltipTrigger>
        <TooltipContent>Excluir nota</TooltipContent>
      </Tooltip>
    </RivoProvider>,
  );

  const tip = document.querySelector('[role="tooltip"]')!;
  const described = screen
    .getByRole("button", { name: "Excluir" })
    .getAttribute("aria-describedby");
  expect(described!.split(" ")).toEqual(["ajuda", tip.id]);
});
