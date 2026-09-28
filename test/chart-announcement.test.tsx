import { expect, test } from "bun:test";
import { fireEvent, render, waitFor } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartContainer, type ChartConfig } from "../src/chart/chart";
import { ChartTooltipContent } from "../src/chart/chart-tooltip";

/*
 * The chart tooltip was not announced.
 *
 * Recharts moves from point to point with the arrows, and `ChartContainer`
 * already provides `role="img"` with a name - but screen reader users heard
 * only the chart name: the tooltip showed on screen and nothing read it. The
 * exact value was available only to sighted users.
 *
 * What is proven here is the container's mechanism: there is a live region,
 * it copies the tooltip when the change came from the keyboard, and it stays
 * silent on pointer.
 *
 * The tooltip enters the DOM by the test's hand, and not through Recharts,
 * because of an environment limitation: `ResponsiveContainer` measures the
 * parent, happy-dom answers 0x0 and Recharts draws no chart here - it warns
 * about it on the console and returns an empty tree. So the test plays its
 * part: it inserts into the container the same `.recharts-tooltip-wrapper` it
 * inserts, with the HTML our `ChartTooltipContent` really produces.
 */

const CONFIG: ChartConfig = { pagas: { label: "Pagas" } };

/** The HTML our tooltip draws, so the test does not invent markup. */
function tipHtml(label: string, value: number) {
  const { container, unmount } = render(
    <ChartTooltipContent
      active
      label={label}
      config={CONFIG}
      payload={[{ dataKey: "pagas", value }] as never}
    />,
  );
  const html = container.innerHTML;
  unmount();
  return html;
}

function activePoint() {
  return document.querySelector<HTMLElement>("[data-rc-active-point]")!;
}

function chart() {
  const view = render(
    <RivoProvider scope="local">
      <ChartContainer config={CONFIG} className="h-40">
        <svg />
      </ChartContainer>
    </RivoProvider>,
  );

  const root = view.container.querySelector<HTMLElement>("[data-rc-chart]")!;

  /** What Recharts does at each point: put the tooltip in the container, or swap it. */
  const showTip = (label: string, value: number) => {
    const wrapper =
      root.querySelector<HTMLElement>(".recharts-tooltip-wrapper") ??
      root.appendChild(
        Object.assign(document.createElement("div"), { className: "recharts-tooltip-wrapper" }),
      );
    wrapper.innerHTML = tipHtml(label, value);
  };

  return { root, showTip };
}

test("the container publishes a live region, and it starts silent", () => {
  chart();

  const live = activePoint();
  expect(live.getAttribute("aria-live")).toBe("polite");
  expect(live.className).toContain("sr-only");
  expect(live.textContent).toBe("");
});

test("the arrow announces the active point, with label and value", async () => {
  const { root, showTip } = chart();

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Março", 1200);

  await waitFor(() => {
    expect(activePoint().textContent).toBe("Março, Pagas, 1.200");
  });
});

test("moving to the next point changes what the region says", async () => {
  const { root, showTip } = chart();

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Março", 1200);
  await waitFor(() => expect(activePoint().textContent).toContain("Março"));

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Abril", 900);
  await waitFor(() => {
    expect(activePoint().textContent).toBe("Abril, Pagas, 900");
  });
});

/*
 * The pointer crosses twelve months in a second, and the screen reader queues
 * everything the live region writes: announcing on pointer would make the
 * person hear March while the cursor is already on December. Sighted users
 * already have the tooltip on screen.
 */
test("the pointer announces nothing", async () => {
  const { root, showTip } = chart();

  fireEvent.pointerMove(root);
  showTip("Março", 1200);

  await Promise.resolve();
  expect(activePoint().textContent).toBe("");
});

test("after the pointer, the key announces again", async () => {
  const { root, showTip } = chart();

  fireEvent.pointerMove(root);
  showTip("Março", 1200);

  fireEvent.keyDown(root, { key: "ArrowLeft" });
  showTip("Abril", 900);

  await waitFor(() => {
    expect(activePoint().textContent).toBe("Abril, Pagas, 900");
  });
});

/*
 * A live region only speaks when the text CHANGES. Without clearing on leave,
 * coming back to the same point later would be silence.
 */
test("leaving the chart clears what was said", async () => {
  const { root, showTip } = chart();

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Março", 1200);
  await waitFor(() => expect(activePoint().textContent).toContain("Março"));

  fireEvent.focusOut(root);
  await waitFor(() => expect(activePoint().textContent).toBe(""));
});

/*
 * The chart name is already in the surface `aria-label`. Repeating it at each
 * point would make the reader say "Grafico de Pagas" twelve times in a row.
 */
test("the announcement does not repeat the chart name", async () => {
  const { root, showTip } = chart();

  fireEvent.keyDown(root, { key: "ArrowRight" });
  showTip("Março", 1200);

  await waitFor(() => expect(activePoint().textContent).toContain("Março"));
  expect(activePoint().textContent).not.toContain("Gráfico");
});
