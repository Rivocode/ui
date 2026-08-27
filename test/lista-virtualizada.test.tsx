import { afterAll, beforeAll, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";

import { VirtualList, type VirtualListHandle } from "../src/components/virtual-list";
import { RivoProvider } from "../src/provider/rivo-provider";

const VIEWPORT_HEIGHT = 400;
const ITEM_HEIGHT = 40;

beforeAll(() => {
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
  Reflect.deleteProperty(HTMLElement.prototype, "offsetHeight");
  Reflect.deleteProperty(HTMLElement.prototype, "offsetWidth");
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

test("quatro mil itens entram, e so um punhado vai para o DOM", () => {
  const { container } = list();

  const drawn = items(container).length;
  expect(drawn).toBeGreaterThan(0);
  expect(drawn).toBeLessThan(60);
});

test("a lista diz quantos itens existem, e onde cada um esta", () => {
  const { container } = list();

  const first = items(container)[0]!;
  expect(first.getAttribute("aria-setsize")).toBe("4000");
  expect(first.getAttribute("aria-posinset")).toBe("1");

  const second = items(container)[1]!;
  expect(second.getAttribute("aria-posinset")).toBe("2");
});

test("a contagem acompanha a lista que chegou, e nao a que foi desenhada", () => {
  const { container } = list({ items: EVENTS.slice(0, 7) });

  for (const item of items(container)) {
    expect(item.getAttribute("aria-setsize")).toBe("7");
  }
});

test("o nome da lista carrega o total, e nao o que esta montado", () => {
  const { container } = list();

  const role = track(container);
  const montados = items(container).length;

  expect(role.getAttribute("aria-label")).toBe("Log de envio, 4000 itens");
  expect(montados).toBeGreaterThan(0);
  expect(montados).toBeLessThan(4000);
});

test("a contagem concorda com o singular, em vez de anunciar 1 itens", () => {
  const { container } = list({ items: EVENTS.slice(0, 1) });

  expect(track(container).getAttribute("aria-label")).toBe("Log de envio, 1 item");
});

test("a contagem se traduz junto com o nome, para a lista nao sair em duas linguas", () => {
  const { container } = list({
    label: "Shipping log",
    labels: { count: (total) => `${total} items` },
  });

  expect(track(container).getAttribute("aria-label")).toBe("Shipping log, 4000 items");
});

test("a moldura rola por dentro em vez de empurrar a pagina", () => {
  const { container } = list({ maxHeight: 320 });

  const viewport = container.querySelector("[data-rc-viewport]") as HTMLElement;
  expect(viewport).toBeTruthy();
  expect(viewport.style.maxHeight).toBe("320px");
  expect(viewport.className).toContain("overflow-auto");
});

test("com medicao, a altura real do item vence o palpite", () => {
  const { container } = list({ itemHeight: 20 });

  const drawn = items(container) as HTMLElement[];
  expect(drawn[1]!.style.transform).toBe(`translateY(${ITEM_HEIGHT}px)`);
  expect(drawn[2]!.style.transform).toBe(`translateY(${2 * ITEM_HEIGHT}px)`);
  expect(drawn[0]!.style.height).toBe("");

  expect(Number.parseInt(track(container).style.height, 10)).toBeGreaterThan(4000 * 20);
});

test("o palpite continua valendo para quem ainda nao foi desenhado", () => {
  const { container } = list({ itemHeight: 20 });

  const total = Number.parseInt(track(container).style.height, 10);

  expect(total).toBeGreaterThan(4000 * 20);
  expect(total).toBeLessThan(4000 * ITEM_HEIGHT);
});

test("sem medicao, o palpite e a lei e cada item recebe a altura cravada", () => {
  const { container } = list({ itemHeight: 20, measure: false });

  expect(track(container).style.height).toBe(`${4000 * 20}px`);
  expect((items(container)[0] as HTMLElement).style.height).toBe("20px");
});

test("o palpite pode variar por indice", () => {
  const { container } = list({
    items: EVENTS.slice(0, 4),
    measure: false,
    itemHeight: (index) => (index % 2 === 0 ? 30 : 70),
  });

  expect(track(container).style.height).toBe("200px");
  expect((items(container)[0] as HTMLElement).style.height).toBe("30px");
  expect((items(container)[1] as HTMLElement).style.height).toBe("70px");
});

test("o respiro entre itens entra na conta da rolagem", () => {
  const withoutGap = list({ items: EVENTS.slice(0, 10), measure: false, itemHeight: 20 });
  expect(track(withoutGap.container).style.height).toBe("200px");
  withoutGap.unmount();

  const withGap = list({ items: EVENTS.slice(0, 10), measure: false, itemHeight: 20, gap: 8 });
  expect(track(withGap.container).style.height).toBe(`${200 + 9 * 8}px`);
});

test("carregando nao finge lista: sai esqueleto e nenhum item anunciado", () => {
  const { container } = list({ items: undefined, skeletonItems: 3 });

  expect(items(container)).toEqual([]);
  expect(track(container)).toBeNull();
  expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
});

test("o esqueleto ocupa a altura que os itens vao ocupar", () => {
  const { container } = list({ items: undefined, skeletonItems: 2, itemHeight: 56 });

  const fakes = [...container.querySelectorAll("[aria-hidden='true'] > div")] as HTMLElement[];
  expect(fakes.map((fake) => fake.style.height)).toEqual(["56px", "56px"]);
});

test("o erro vence o carregando", () => {
  const { container } = list({ items: undefined, isError: true });

  expect(screen.getByText("Não foi possível carregar")).toBeTruthy();
  expect(container.querySelector("[data-rc-viewport]")).toBeNull();
});

test("o erro fala da lista que falhou quando lhe dizem o nome", () => {
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

test("o vazio so vale depois que a consulta voltou", () => {
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

test("lista vazia sem `empty` continua sendo uma moldura vazia, e nao um buraco", () => {
  const { container } = list({ items: [] });

  expect(container.querySelector("[data-rc-viewport]")).toBeTruthy();
  expect(items(container)).toEqual([]);
});

test("classNames veste cada parte sem ninguem alcancar o no interno", () => {
  const { container } = list({
    className: "border-dashed",
    classNames: { list: "bg-elevated", item: "px-4" },
  });

  const viewport = container.querySelector("[data-rc-viewport]") as HTMLElement;
  expect(viewport.className).toContain("border-dashed");
  expect(track(container).className).toContain("bg-elevated");
  expect((items(container)[0] as HTMLElement).className).toContain("px-4");
});

test("da para chegar num item que nao esta no DOM", () => {
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

test("o item desenhado carrega o indice que o virtualizador precisa medir", () => {
  const { container } = list();

  expect(items(container).map((item) => item.getAttribute("data-index"))).toEqual(
    items(container).map((_, index) => String(index)),
  );
});
