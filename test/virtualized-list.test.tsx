import { afterAll, beforeAll, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";

import { VirtualList, type VirtualListHandle } from "../src/components/virtual-list";
import { RivoProvider } from "../src/provider/rivo-provider";

const VIEWPORT_HEIGHT = 400;
const ITEM_HEIGHT = 40;

const MEASURED = new Map<string, PropertyDescriptor | undefined>();

beforeAll(() => {
  for (const name of ["offsetHeight", "offsetWidth"]) {
    MEASURED.set(name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));
  }
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-index") ? ITEM_HEIGHT : VIEWPORT_HEIGHT;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 390,
  });
});

afterAll(() => {
  for (const [name, descriptor] of MEASURED) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
});

type Event = { id: string; message: string };

const EVENTS: Event[] = Array.from({ length: 4000 }, (_, index) => ({
  id: String(index),
  message: `Nota ${9000 + index} enviada para a prefeitura`,
}));

function list(props: Partial<React.ComponentProps<typeof VirtualList<Event>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <VirtualList
        items={EVENTS}
        itemKey={(event) => event.id}
        renderItem={(event) => <p>{event.message}</p>}
        maxHeight={VIEWPORT_HEIGHT}
        label="Log de envio"
        {...props}
      />
    </RivoProvider>,
  );
}

const items = (container: HTMLElement) => [...container.querySelectorAll("[role='listitem']")];

const track = (container: HTMLElement) => container.querySelector("[role='list']") as HTMLElement;

test("four thousand items go in, and only a handful reach the DOM", () => {
  const { container } = list();

  const drawn = items(container).length;
  expect(drawn).toBeGreaterThan(0);
  expect(drawn).toBeLessThan(60);
});

test("the list says how many items exist, and where each one is", () => {
  const { container } = list();

  const first = items(container)[0]!;
  expect(first.getAttribute("aria-setsize")).toBe("4000");
  expect(first.getAttribute("aria-posinset")).toBe("1");

  const second = items(container)[1]!;
  expect(second.getAttribute("aria-posinset")).toBe("2");
});

test("the count follows the list that arrived, and not the one that was drawn", () => {
  const { container } = list({ items: EVENTS.slice(0, 7) });

  for (const item of items(container)) {
    expect(item.getAttribute("aria-setsize")).toBe("7");
  }
});

test("the list name carries the total, and not what is mounted", () => {
  const { container } = list();

  const role = track(container);
  const mounted = items(container).length;

  expect(role.getAttribute("aria-label")).toBe("Log de envio, 4000 itens");
  expect(mounted).toBeGreaterThan(0);
  expect(mounted).toBeLessThan(4000);
});

test("the count agrees with the singular, instead of announcing 1 itens", () => {
  const { container } = list({ items: EVENTS.slice(0, 1) });

  expect(track(container).getAttribute("aria-label")).toBe("Log de envio, 1 item");
});

test("the count is translated along with the name, so the list does not come out in two languages", () => {
  const { container } = list({
    label: "Shipping log",
    labels: { count: (total) => `${total} items` },
  });

  expect(track(container).getAttribute("aria-label")).toBe("Shipping log, 4000 items");
});

test("the frame scrolls inside instead of pushing the page", () => {
  const { container } = list({ maxHeight: 320 });

  const viewport = container.querySelector("[data-rc-viewport]") as HTMLElement;
  expect(viewport).toBeTruthy();
  expect(viewport.style.maxHeight).toBe("320px");
  expect(viewport.className).toContain("overflow-auto");
});

test("with measurement, the item's real height beats the estimate", () => {
  const { container } = list({ itemHeight: 20 });

  const drawn = items(container) as HTMLElement[];
  expect(drawn[1]!.style.transform).toBe(`translateY(${ITEM_HEIGHT}px)`);
  expect(drawn[2]!.style.transform).toBe(`translateY(${2 * ITEM_HEIGHT}px)`);
  expect(drawn[0]!.style.height).toBe("");

  expect(Number.parseInt(track(container).style.height, 10)).toBeGreaterThan(4000 * 20);
});

test("the estimate still applies to items not yet drawn", () => {
  const { container } = list({ itemHeight: 20 });

  const total = Number.parseInt(track(container).style.height, 10);

  expect(total).toBeGreaterThan(4000 * 20);
  expect(total).toBeLessThan(4000 * ITEM_HEIGHT);
});

test("without measurement, the estimate is the law and each item gets the fixed height", () => {
  const { container } = list({ itemHeight: 20, measure: false });

  expect(track(container).style.height).toBe(`${4000 * 20}px`);
  expect((items(container)[0] as HTMLElement).style.height).toBe("20px");
});

test("the estimate can vary by index", () => {
  const { container } = list({
    items: EVENTS.slice(0, 4),
    measure: false,
    itemHeight: (index) => (index % 2 === 0 ? 30 : 70),
  });

  expect(track(container).style.height).toBe("200px");
  expect((items(container)[0] as HTMLElement).style.height).toBe("30px");
  expect((items(container)[1] as HTMLElement).style.height).toBe("70px");
});

test("the gap between items enters the scroll math", () => {
  const withoutGap = list({ items: EVENTS.slice(0, 10), measure: false, itemHeight: 20 });
  expect(track(withoutGap.container).style.height).toBe("200px");
  withoutGap.unmount();

  const withGap = list({ items: EVENTS.slice(0, 10), measure: false, itemHeight: 20, gap: 8 });
  expect(track(withGap.container).style.height).toBe(`${200 + 9 * 8}px`);
});

test("loading does not fake a list: a skeleton renders and no item is announced", () => {
  const { container } = list({ items: undefined, skeletonItems: 3 });

  expect(items(container)).toEqual([]);
  expect(track(container)).toBeNull();
  expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
});

test("the skeleton takes the height the items will take", () => {
  const { container } = list({ items: undefined, skeletonItems: 2, itemHeight: 56 });

  const fakes = [...container.querySelectorAll("[aria-hidden='true'] > div")] as HTMLElement[];
  expect(fakes.map((fake) => fake.style.height)).toEqual(["56px", "56px"]);
});

test("error beats loading", () => {
  const { container } = list({ items: undefined, isError: true });

  expect(screen.getByText("Não foi possível carregar")).toBeTruthy();
  expect(container.querySelector("[data-rc-viewport]")).toBeNull();
});

test("the error mentions the list that failed when given its name", () => {
  const retry = mock();
  list({
    items: undefined,
    isError: true,
    errorTitle: "Não foi possível carregar o log",
    errorMessage: "A prefeitura não respondeu.",
    onRetry: retry,
  });

  expect(screen.getByText("Não foi possível carregar o log")).toBeTruthy();
  expect(screen.getByText("A prefeitura não respondeu.")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
  expect(retry).toHaveBeenCalledTimes(1);
});

test("the empty state only applies after the query returned", () => {
  const blank = {
    title: "Nenhum evento",
    description: "Quando a primeira nota for enviada, ela aparece aqui.",
  };

  const pending = list({ items: undefined, empty: blank });
  expect(screen.queryByText("Nenhum evento")).toBeNull();
  pending.unmount();

  list({ items: [], empty: blank });
  expect(screen.getByText("Nenhum evento")).toBeTruthy();
  expect(screen.getByText("Quando a primeira nota for enviada, ela aparece aqui.")).toBeTruthy();
});

test("an empty list without `empty` is still an empty frame, and not a hole", () => {
  const { container } = list({ items: [] });

  expect(container.querySelector("[data-rc-viewport]")).toBeTruthy();
  expect(items(container)).toEqual([]);
});

test("classNames dresses each part without anyone reaching the inner node", () => {
  const { container } = list({
    className: "border-dashed",
    classNames: { list: "bg-elevated", item: "px-4" },
  });

  const viewport = container.querySelector("[data-rc-viewport]") as HTMLElement;
  expect(viewport.className).toContain("border-dashed");
  expect(track(container).className).toContain("bg-elevated");
  expect((items(container)[0] as HTMLElement).className).toContain("px-4");
});

test("an item that is not in the DOM can be reached", () => {
  const ref = createRef<VirtualListHandle>();
  const { container } = list({ ref, measure: false, itemHeight: ITEM_HEIGHT });

  const viewport = container.querySelector("[data-rc-viewport]") as HTMLElement;
  Object.defineProperty(viewport, "scrollHeight", {
    configurable: true,
    value: 4000 * ITEM_HEIGHT,
  });
  Object.defineProperty(viewport, "clientHeight", {
    configurable: true,
    value: VIEWPORT_HEIGHT,
  });

  const scrollTo = mock();
  viewport.scrollTo = scrollTo as unknown as HTMLElement["scrollTo"];

  expect(items(container).some((item) => item.getAttribute("data-index") === "3000")).toBe(false);

  act(() => {
    ref.current!.scrollToIndex(3000, { align: "start" });
  });

  expect(scrollTo).toHaveBeenCalled();
  const [call] = scrollTo.mock.calls as [{ top: number }][];
  expect(call![0].top).toBe(3000 * ITEM_HEIGHT);
});

test("the drawn item carries the index the virtualizer needs to measure", () => {
  const { container } = list();

  expect(items(container).map((item) => item.getAttribute("data-index"))).toEqual(
    items(container).map((_, index) => String(index)),
  );
});
