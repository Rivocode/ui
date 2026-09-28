import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Kanban, SortableList, type KanbanColumn, type KanbanMove } from "../src/dnd/index";
import * as dnd from "../src/dnd/index";
import * as root from "../src/index";

function withTheme(node: ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(/\s+/);

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

async function press(element: Element, key: string) {
  const code = key === " " ? "Space" : key;
  await act(async () => {
    fireEvent.keyDown(element, { key, code });
    await tick();
  });
}

function announced() {
  const regions = [...document.querySelectorAll('[role="status"][aria-live="assertive"]')];
  expect(regions.length).toBe(1);
  return regions[0]!.textContent ?? "";
}

let restoreRects: (() => void) | undefined;

function layOut(rect: (element: HTMLElement) => { left: number; top: number; width: number; height: number }) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const { left, top, width, height } = rect(this);
    return {
      x: left,
      y: top,
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      toJSON() {},
    } as DOMRect;
  };
  restoreRects = () => {
    HTMLElement.prototype.getBoundingClientRect = original;
  };
}

const positionIn = (li: Element) => [...li.parentElement!.children].indexOf(li);

function layOutList(orientation: "vertical" | "horizontal" = "vertical") {
  layOut((element) => {
    const li = element.closest("li");
    const at = li ? positionIn(li) : 0;
    return orientation === "vertical"
      ? { left: 0, top: at * 48, width: 240, height: 44 }
      : { left: at * 128, top: 0, width: 120, height: 44 };
  });
}

function layOutBoard() {
  layOut(function place(element): { left: number; top: number; width: number; height: number } {
    const moving = document.querySelector<HTMLElement>("li[data-dragging]");
    if (!element.closest("section") && moving) return place(moving);
    const section = element.closest("section");
    const column = section ? positionIn(section) : 0;
    const left = column * 300;
    const li = element.closest("li");
    if (li) return { left: left + 8, top: 50 + positionIn(li) * 60, width: 284, height: 52 };
    return { left, top: 40, width: 296, height: 560 };
  });
}

afterEach(() => {
  restoreRects?.();
  restoreRects = undefined;
});

type Note = { id: number; client: string };

const NOTES: Note[] = [
  { id: 1041, client: "Clínica São Lucas" },
  { id: 1042, client: "Padaria Pão Quente" },
  { id: 1043, client: "Oficina do Zé" },
  { id: 1044, client: "Escola Aprender" },
];

function Notes(props: Partial<Parameters<typeof SortableList<Note>>[0]>) {
  return (
    <SortableList
      aria-label="Ordem de emissão"
      items={NOTES}
      getKey={(note) => note.id}
      getLabel={(note) => `Nota ${note.id}`}
      onReorder={() => {}}
      renderItem={(note) => <span>{note.client}</span>}
      {...props}
    />
  );
}

describe("SortableList", () => {
  beforeEach(() => layOutList());

  test("each item gets a named handle, and the keyboard instruction is linked to it", () => {
    withTheme(<Notes />);

    const list = screen.getByRole("list", { name: "Ordem de emissão" });
    expect(list.querySelectorAll("li").length).toBe(4);
    expect(list.getAttribute("aria-orientation")).toBeNull();
    expect(list.getAttribute("data-orientation")).toBe("vertical");

    const handle = screen.getByRole("button", { name: "Reordenar Nota 1043" });
    expect(handle.getAttribute("aria-roledescription")).toBe("item reordenável");
    const help = document.getElementById(handle.getAttribute("aria-describedby")!);
    expect(help?.textContent).toContain("Espaço para pegar");
    expect(help?.textContent).toContain("Esc para cancelar");
  });

  test("Space picks up, the arrows move, Space drops, and the new order comes out ready", async () => {
    const onReorder = mock<(items: Note[], move: unknown) => void>(() => {});
    withTheme(<Notes onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1041" });
    handle.focus();

    await press(handle, " ");
    expect(announced()).toBe("Item Nota 1041 pego. Posição 1 de 4.");

    await press(handle, "ArrowDown");
    expect(announced()).toBe("Item Nota 1041 movido para a posição 2 de 4.");
    await press(handle, "ArrowDown");
    expect(announced()).toBe("Item Nota 1041 movido para a posição 3 de 4.");

    await press(handle, " ");
    expect(announced()).toBe("Item Nota 1041 solto na posição 3 de 4.");
    expect(onReorder).toHaveBeenCalledTimes(1);
    const [items, move] = onReorder.mock.calls[0]!;
    expect(items.map((note) => note.id)).toEqual([1042, 1043, 1041, 1044]);
    expect(move).toEqual({ key: 1041, from: 0, to: 2 });
  });

  test("the handle locks scrolling on touch, and the whole row as a handle does not", () => {
    const { unmount } = withTheme(<Notes />);
    expect(tokens(screen.getByRole("button", { name: "Reordenar Nota 1041" }))).toContain(
      "touch-none",
    );
    unmount();

    let received: Record<string, unknown> = {};
    withTheme(
      <Notes
        handle={false}
        renderItem={(note, { handleProps }) => {
          if (note.id === 1041) received = handleProps as unknown as Record<string, unknown>;
          return <div {...handleProps}>{note.client}</div>;
        }}
      />,
    );
    expect(typeof received.onTouchStart).toBe("function");
    expect(typeof received.onMouseDown).toBe("function");
    expect(received.onPointerDown).toBeUndefined();
  });

  test("the pointer drags by the handle, and a short touch does not pick up", async () => {
    const onReorder = mock<(items: Note[]) => void>(() => {});
    withTheme(<Notes onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1041" });

    await act(async () => {
      fireEvent.pointerDown(handle, { clientX: 10, clientY: 20, isPrimary: true, button: 0 });
      fireEvent.pointerMove(document, { clientX: 10, clientY: 22 });
      fireEvent.pointerUp(document, { clientX: 10, clientY: 22 });
      await tick();
    });
    expect(onReorder).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.pointerDown(handle, { clientX: 10, clientY: 20, isPrimary: true, button: 0 });
      await tick();
    });
    await act(async () => {
      fireEvent.pointerMove(document, { clientX: 10, clientY: 60 });
      await tick();
    });
    await act(async () => {
      fireEvent.pointerMove(document, { clientX: 10, clientY: 118 });
      await tick();
    });
    await act(async () => {
      fireEvent.pointerUp(document, { clientX: 10, clientY: 118 });
      await tick();
    });

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder.mock.calls[0]![0].map((note) => note.id)).toEqual([1042, 1043, 1041, 1044]);
  });

  test("Esc cancels: the order does not change and the announcement says where the item went back to", async () => {
    const onReorder = mock(() => {});
    withTheme(<Notes onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1042" });
    handle.focus();

    await press(handle, " ");
    await press(handle, "ArrowDown");
    await press(handle, "Escape");

    expect(onReorder).not.toHaveBeenCalled();
    expect(announced()).toBe("Movimento cancelado. Item Nota 1042 voltou para a posição 2 de 4.");
  });

  test("dropping in the same place does not call onReorder", async () => {
    const onReorder = mock(() => {});
    withTheme(<Notes onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1044" });
    handle.focus();

    await press(handle, " ");
    await press(handle, " ");

    expect(onReorder).not.toHaveBeenCalled();
    expect(announced()).toBe("Item Nota 1044 solto na posição 4 de 4.");
  });

  test("the piece is controlled: unless the parent swaps items, the on-screen order does not change", async () => {
    withTheme(<Notes />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1041" });
    handle.focus();
    await press(handle, " ");
    await press(handle, "ArrowDown");
    await press(handle, " ");

    const order = [...document.querySelectorAll("li")].map((li) => li.textContent);
    expect(order).toEqual(NOTES.map((note) => note.client));
  });

  test("with state in the parent, the list comes back in the new order", async () => {
    function Controlled() {
      const [items, setItems] = useState(NOTES);
      return <Notes items={items} onReorder={setItems} />;
    }
    withTheme(<Controlled />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1044" });
    handle.focus();
    await press(handle, " ");
    await press(handle, "ArrowUp");
    await press(handle, " ");

    const order = [...document.querySelectorAll("li")].map((li) => li.textContent);
    expect(order).toEqual(["Clínica São Lucas", "Padaria Pão Quente", "Escola Aprender", "Oficina do Zé"]);
  });

  test("labels replaces the announcements, the instruction and the handle name", async () => {
    withTheme(
      <Notes
        labels={{
          handle: (label) => `Move ${label}`,
          picked: (label, position, total) => `Picked ${label}, ${position} of ${total}.`,
          instructions: "Press space to pick up.",
        }}
      />,
    );
    const handle = screen.getByRole("button", { name: "Move Nota 1043" });
    expect(document.getElementById(handle.getAttribute("aria-describedby")!)?.textContent).toBe(
      "Press space to pick up.",
    );
    handle.focus();
    await press(handle, " ");
    expect(announced()).toBe("Picked Nota 1043, 3 of 4.");
  });

  test("without handle, the element receiving handleProps is the one that drags", async () => {
    const onReorder = mock<(items: Note[]) => void>(() => {});
    withTheme(
      <Notes
        handle={false}
        onReorder={onReorder}
        renderItem={(note, { handleProps, isDragging }) => (
          <div {...handleProps} data-testid={`linha-${note.id}`} data-dragging={isDragging || undefined}>
            {note.client}
          </div>
        )}
      />,
    );

    expect(screen.queryByRole("button", { name: /Reordenar/ })).toBeNull();
    const row = screen.getByTestId("linha-1041");
    expect(row.getAttribute("role")).toBe("button");
    row.focus();

    await press(row, " ");
    expect(row.getAttribute("data-dragging")).toBe("true");
    await press(row, "ArrowDown");
    await press(row, " ");

    expect(onReorder.mock.calls[0]![0].map((note) => note.id)).toEqual([1042, 1041, 1043, 1044]);
  });

  test("when disabled, the handle does not pick up the item", async () => {
    const onReorder = mock(() => {});
    withTheme(<Notes disabled onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1041" }) as HTMLButtonElement;

    expect(handle.disabled).toBe(true);
    await press(handle, " ");
    await press(handle, "ArrowDown");
    await press(handle, " ");

    expect(onReorder).not.toHaveBeenCalled();
    expect(handle.getAttribute("aria-pressed")).not.toBe("true");
  });

  test("an empty list mounts with no item and no handle", () => {
    withTheme(<Notes items={[]} />);
    const list = screen.getByRole("list", { name: "Ordem de emissão" });
    expect(list.querySelectorAll("li").length).toBe(0);
    expect(screen.queryAllByRole("button").length).toBe(0);
  });

  test("classNames reaches item, handle and content, and the dragged item lifts with a shadow", async () => {
    withTheme(<Notes classNames={{ item: "gap-4", handle: "text-fg", content: "py-1" }} />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1041" });
    const item = handle.closest("li")!;

    expect(tokens(item)).toContain("gap-4");
    expect(tokens(handle)).toContain("text-fg");
    expect(tokens(handle)).not.toContain("text-fg-muted");
    expect(tokens(handle.nextElementSibling!)).toContain("py-1");
    expect(tokens(item)).not.toContain("shadow-2");

    handle.focus();
    await press(handle, " ");
    expect(item.getAttribute("data-dragging")).toBe("true");
    expect(tokens(item)).toContain("shadow-2");
    expect(tokens(item)).toContain("z-[var(--rc-z-sticky)]");
  });

  test("the neighbors move with the token spring, which zeroes when the system asks for less motion", async () => {
    withTheme(<Notes />);
    const handle = screen.getByRole("button", { name: "Reordenar Nota 1041" });
    handle.focus();
    await press(handle, " ");
    await press(handle, "ArrowDown");

    const neighbour = screen.getByRole("button", { name: "Reordenar Nota 1042" }).closest("li")!;
    expect(neighbour.style.transform).toContain("translate3d");
    expect(tokens(neighbour)).toContain("transition-transform");
    expect(tokens(neighbour)).toContain("duration-spatial");
    expect(tokens(neighbour)).toContain("ease-rc-spatial");

    const shape = await Bun.file("src/tokens/forma.css").text();
    const reduced = shape.slice(shape.indexOf("@media (prefers-reduced-motion"));
    expect(reduced).toContain("--rc-duration-spatial: 0ms");
  });
});

describe("SortableList horizontal", () => {
  beforeEach(() => layOutList("horizontal"));

  test("moves with the side arrows, and the orientation stays in data-orientation", async () => {
    const onReorder = mock<(items: Note[]) => void>(() => {});
    withTheme(<Notes orientation="horizontal" onReorder={onReorder} />);
    const list = screen.getByRole("list", { name: "Ordem de emissão" });
    expect(list.getAttribute("aria-orientation")).toBeNull();
    expect(list.getAttribute("data-orientation")).toBe("horizontal");
    expect(tokens(list)).toContain("flex-row");
    expect(tokens(list)).toContain("overflow-x-auto");

    const handle = screen.getByRole("button", { name: "Reordenar Nota 1041" });
    handle.focus();
    await press(handle, " ");
    await press(handle, "ArrowRight");
    await press(handle, " ");

    expect(onReorder.mock.calls[0]![0].map((note) => note.id)).toEqual([1042, 1041, 1043, 1044]);
  });
});

type Card = { id: string; title: string };

const card = (id: string): Card => ({ id, title: `Nota ${id}` });

function board(): KanbanColumn<Card>[] {
  return [
    { id: "todo", title: "A fazer", items: [card("1041"), card("1042"), card("1043")] },
    { id: "review", title: "Em análise", items: [card("1050")], limit: 1 },
    { id: "done", title: "Emitida", items: [] },
  ];
}

function Board(props: Partial<Parameters<typeof Kanban<Card>>[0]>) {
  return (
    <Kanban
      aria-label="Notas do mês"
      columns={board()}
      getKey={(item) => item.id}
      getLabel={(item) => item.title}
      onMove={() => {}}
      renderCard={(item) => <span>{item.title}</span>}
      {...props}
    />
  );
}

const cardOf = (title: string) =>
  screen.getByText(title).closest<HTMLElement>("[aria-roledescription]")!;

describe("Kanban", () => {
  beforeEach(() => layOutBoard());

  test("each column states its name and count, and the empty one shows where to drop", () => {
    withTheme(<Board />);

    const todo = screen.getByRole("region", { name: "A fazer" });
    expect(todo.textContent).toContain("3 cartões");
    expect(screen.getByRole("list", { name: "A fazer" }).querySelectorAll("li").length).toBe(3);

    const done = screen.getByRole("region", { name: "Emitida" });
    expect(done.textContent).toContain("0 cartões");
    expect(done.textContent).toContain("Nenhum cartão. Solte um aqui.");
    expect(todo.textContent).not.toContain("Nenhum cartão");
  });

  test("the work limit warns in text and tone, and not before it is exceeded", () => {
    const columns = board();
    columns[1] = { ...columns[1]!, items: [card("1050"), card("1051")] };
    withTheme(<Board columns={columns} />);

    const review = screen.getByRole("region", { name: "Em análise" });
    expect(review.textContent).toContain("2 de 1 cartões");
    expect(review.textContent).toContain("Acima do limite");
    expect(review.getAttribute("data-over-limit")).toBe("true");
    const count = review.querySelector("header span[class*='rounded-pill']")!;
    expect(tokens(count)).toContain("bg-warning-subtle");

    const todo = screen.getByRole("region", { name: "A fazer" });
    expect(todo.textContent).not.toContain("Acima do limite");
  });

  test("at the exact limit, the column does not warn", () => {
    withTheme(<Board />);
    const review = screen.getByRole("region", { name: "Em análise" });
    expect(review.textContent).toContain("1 de 1 cartões");
    expect(review.textContent).not.toContain("Acima do limite");
    expect(review.getAttribute("data-over-limit")).toBeNull();
  });

  test("the card is the handle: focus, role name and keyboard instruction", () => {
    withTheme(<Board />);
    const item = cardOf("Nota 1042");

    expect(item.tagName).toBe("DIV");
    expect(item.parentElement!.tagName).toBe("LI");

    expect(item.getAttribute("role")).toBe("button");
    expect(item.getAttribute("tabindex")).toBe("0");
    expect(item.getAttribute("aria-roledescription")).toBe("cartão arrastável");
    expect(document.getElementById(item.getAttribute("aria-describedby")!)?.textContent).toContain(
      "entre posições e colunas",
    );
    expect(tokens(item)).toContain("focus-visible:ring-2");
  });

  test("inside the column, the keyboard reorders and onMove states the final position", async () => {
    const onMove = mock(() => {});
    withTheme(<Board onMove={onMove} />);
    const item = cardOf("Nota 1041");
    item.focus();

    await press(item, " ");
    expect(announced()).toBe("Cartão Nota 1041 pego, na coluna A fazer. Posição 1 de 3.");
    await press(item, "ArrowDown");
    expect(announced()).toBe("Cartão Nota 1041 movido para A fazer, posição 2 de 3.");
    await press(item, " ");

    expect(onMove).toHaveBeenCalledWith({ itemId: "1041", from: "todo", to: "todo", index: 1 });
  });

  test("between columns, the announcement names the new column and warns about the exceeded limit", async () => {
    const onMove = mock<(move: KanbanMove) => void>(() => {});
    withTheme(<Board onMove={onMove} />);
    const item = cardOf("Nota 1041");
    item.focus();

    await press(item, " ");
    await press(item, "ArrowRight");
    expect(announced()).toBe(
      "Cartão Nota 1041 movido para Em análise, posição 1 de 2. A coluna Em análise passa do limite de 1.",
    );

    await press(document.activeElement!, " ");
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove.mock.calls[0]).toEqual([{ itemId: "1041", from: "todo", to: "review", index: 0 }]);
    expect(announced()).toBe(
      "Cartão Nota 1041 solto em Em análise, posição 1 de 2. A coluna Em análise passa do limite de 1.",
    );
  });

  test("the empty column receives the card", async () => {
    const onMove = mock<(move: KanbanMove) => void>(() => {});
    const columns = board();
    withTheme(<Board columns={[columns[1]!, columns[2]!]} onMove={onMove} />);
    const item = cardOf("Nota 1050");
    item.focus();

    await press(item, " ");
    await press(item, "ArrowRight");
    expect(announced()).toBe("Cartão Nota 1050 movido para Emitida, posição 1 de 1.");
    await press(document.activeElement!, " ");

    expect(onMove.mock.calls[0]).toEqual([{ itemId: "1050", from: "review", to: "done", index: 0 }]);
  });

  test("Esc cancels, the board goes back to what came by props, and nothing is emitted", async () => {
    const onMove = mock(() => {});
    withTheme(<Board onMove={onMove} />);
    const item = cardOf("Nota 1042");
    item.focus();

    await press(item, " ");
    await press(item, "ArrowRight");
    await press(document.activeElement!, "Escape");

    expect(onMove).not.toHaveBeenCalled();
    expect(announced()).toBe(
      "Movimento cancelado. Cartão Nota 1042 voltou para A fazer, posição 2 de 3.",
    );
    expect(screen.getByRole("list", { name: "A fazer" }).textContent).toContain("Nota 1042");
    expect(screen.getByRole("list", { name: "Em análise" }).textContent).not.toContain("Nota 1042");
  });

  test("controlled: dropping without the parent changing columns puts the card back", async () => {
    withTheme(<Board />);
    const item = cardOf("Nota 1041");
    item.focus();
    await press(item, " ");
    await press(item, "ArrowRight");
    await press(document.activeElement!, " ");

    expect(screen.getByRole("list", { name: "A fazer" }).textContent).toContain("Nota 1041");
    expect(screen.getByRole("list", { name: "Em análise" }).textContent).not.toContain("Nota 1041");
  });

  test("when disabled, the card does not move", async () => {
    const onMove = mock(() => {});
    withTheme(<Board disabled onMove={onMove} />);
    const item = cardOf("Nota 1041");
    item.focus();
    await press(item, " ");
    await press(item, "ArrowDown");
    await press(item, " ");

    expect(onMove).not.toHaveBeenCalled();
    expect(item.getAttribute("aria-disabled")).toBe("true");
  });

  test("on touch, the card lets the board scroll: press and hold, and not just touch", async () => {
    const onMove = mock(() => {});
    withTheme(<Board onMove={onMove} />);
    const item = cardOf("Nota 1041");

    expect(tokens(item)).not.toContain("touch-none");

    await act(async () => {
      fireEvent.touchStart(item, { touches: [{ clientX: 20, clientY: 60 }] });
      fireEvent.touchMove(item, { touches: [{ clientX: 20, clientY: 200 }] });
      fireEvent.touchEnd(item, { touches: [] });
      await tick();
    });
    expect(onMove).not.toHaveBeenCalled();
    expect(item.getAttribute("aria-pressed")).not.toBe("true");
  });

  test("the list item stays an item: no role, no focus and no listener", () => {
    withTheme(<Board />);
    const items = [...screen.getByRole("list", { name: "A fazer" }).children];
    expect(items.length).toBe(3);
    for (const li of items) {
      expect(li.tagName).toBe("LI");
      expect(li.getAttribute("role")).toBeNull();
      expect(li.getAttribute("tabindex")).toBeNull();
      expect(li.getAttribute("aria-roledescription")).toBeNull();
      expect(tokens(li)).toContain("list-none");
      expect(li.querySelectorAll('[role="button"]').length).toBe(1);
    }
  });

  test("the screen-reader-only text stays inside the column, and does not widen the page", () => {
    withTheme(<Board />);
    const root = screen.getByRole("region", { name: "A fazer" }).parentElement!;
    const hidden = [...root.querySelectorAll(".sr-only")];
    expect(hidden.length).toBeGreaterThan(2);
    const positioned = ["relative", "absolute", "fixed", "sticky"];
    for (const element of hidden) {
      let parent = element.parentElement;
      let anchored = false;
      while (parent && root.contains(parent)) {
        if (tokens(parent).some((token) => positioned.includes(token))) anchored = true;
        parent = parent.parentElement;
      }
      expect(anchored).toBe(true);
    }
  });

  test("the drop-here ring fits within the row clipping, and a long title wraps instead of vanishing", () => {
    withTheme(<Board />);
    const todo = screen.getByRole("region", { name: "A fazer" });
    const root = todo.parentElement!;
    for (const token of ["px-1", "pt-1", "scroll-px-1"]) expect(tokens(root)).toContain(token);

    const title = todo.querySelector("h3")!;
    expect(tokens(title)).not.toContain("truncate");
    expect(tokens(title)).toContain("break-words");
    expect(tokens(title)).toContain("line-clamp-2");
    expect(title.getAttribute("title")).toBe("A fazer");
  });

  test("the row scrolls sideways on mobile and snaps column by column", () => {
    withTheme(<Board />);
    const root = screen.getByRole("region", { name: "A fazer" }).parentElement!;
    expect(root.getAttribute("aria-label")).toBe("Notas do mês");
    expect(tokens(root)).toContain("overflow-x-auto");
    expect(tokens(root)).toContain("snap-x");
    expect(tokens(root)).toContain("sm:snap-none");
  });

  test("classNames reaches the parts by name", () => {
    withTheme(
      <Board
        classNames={{
          column: "bg-bg",
          header: "py-4",
          title: "text-base",
          count: "px-3",
          list: "gap-3",
          card: "p-4",
          empty: "py-10",
        }}
      />,
    );
    const todo = screen.getByRole("region", { name: "A fazer" });
    expect(tokens(todo)).toContain("bg-bg");
    expect(tokens(todo)).not.toContain("bg-surface");
    expect(tokens(todo.querySelector("header")!)).toContain("py-4");
    expect(tokens(todo.querySelector("h3")!)).toContain("text-base");
    expect(tokens(screen.getByRole("list", { name: "A fazer" }))).toContain("gap-3");
    expect(tokens(cardOf("Nota 1041"))).toContain("p-4");
    expect(tokens(cardOf("Nota 1041"))).not.toContain("p-3");
    const empty = screen.getByText("Nenhum cartão. Solte um aqui.");
    expect(tokens(empty)).toContain("py-10");
  });
});

describe("the subpath", () => {
  test("the two pieces come from @rivocode/ui/dnd, and from no other entry", () => {
    for (const name of ["SortableList", "Kanban"]) {
      expect(name in dnd).toBe(true);
      expect(name in root).toBe(false);
    }
  });
});
