import { afterAll, beforeAll, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { Gantt, type GanttTask, type GanttTaskChange } from "../src/components/gantt";
import {
  arrowPath,
  buildRows,
  dragTask,
  headerTiers,
  moveTask,
  resizeTask,
  scaleRange,
  spokenRange,
} from "../src/lib/gantt-layout";
import { RivoProvider } from "../src/provider/rivo-provider";

const VIEWPORT_HEIGHT = 400;
const MEASURED = new Map<string, PropertyDescriptor | undefined>();

beforeAll(() => {
  for (const name of ["offsetHeight", "offsetWidth"]) {
    MEASURED.set(name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));
  }
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => VIEWPORT_HEIGHT,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 1000,
  });
});

afterAll(() => {
  for (const [name, descriptor] of MEASURED) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
});

const day = (month: number, date: number) => new Date(2026, month - 1, date);
const TODAY = day(10, 15);

const TASKS: GanttTask[] = [
  {
    id: "compra",
    title: "Comprar hardware",
    start: day(10, 1),
    end: day(10, 8),
    progress: 100,
    group: "Infraestrutura",
    assignee: "Ana Prado",
  },
  {
    id: "servidor",
    title: "Instalar servidor",
    start: day(10, 12),
    end: day(10, 19),
    progress: 40,
    dependsOn: ["compra"],
    group: "Infraestrutura",
    tone: "info",
  },
  {
    id: "virada",
    title: "Virada do sistema",
    start: day(10, 25),
    end: day(10, 25),
    dependsOn: ["servidor"],
    tone: "accent",
  },
];

function gantt(props: Partial<React.ComponentProps<typeof Gantt>> = {}, dir?: "rtl") {
  return render(
    <RivoProvider scope="local" dir={dir}>
      <Gantt tasks={TASKS} today={TODAY} defaultScale="day" label="Implantação" {...props} />
    </RivoProvider>,
  );
}

function Controlled({
  onChange,
  initial = TASKS,
  apply = true,
  scale = "day" as const,
}: {
  onChange?: (task: GanttTask, change: GanttTaskChange) => void;
  initial?: GanttTask[];
  apply?: boolean;
  scale?: "day" | "week" | "month";
}) {
  const [tasks, setTasks] = useState(initial);
  return (
    <Gantt
      tasks={tasks}
      today={TODAY}
      defaultScale={scale}
      label="Implantação"
      onTaskChange={(task, change) => {
        onChange?.(task, change);
        if (!apply) return;
        setTasks((list) =>
          list.map((item) =>
            item.id === task.id ? { ...item, start: change.start, end: change.end } : item,
          ),
        );
      }}
    />
  );
}

const cell = (container: HTMLElement, rowKey: string, col: number) =>
  container.querySelector<HTMLElement>(`[data-rc-cell="${rowKey}|${col}"]`)!;

const speech = (container: HTMLElement, rowKey: string) =>
  cell(container, rowKey, 4).querySelector(".sr-only")!.textContent;

const liveChange = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-rc-change]")!.textContent;

test("a frase falada diz o intervalo como a pessoa diz: 12 a 18 de outubro", () => {
  expect(spokenRange({ start: day(10, 12), end: day(10, 19) })).toBe("12 a 18 de outubro");
  expect(spokenRange({ start: day(9, 28), end: day(10, 4) })).toBe("28 de setembro a 3 de outubro");
  expect(spokenRange({ start: day(12, 28), end: new Date(2027, 0, 4) })).toBe(
    "28 de dezembro de 2026 a 3 de janeiro de 2027",
  );
  expect(spokenRange({ start: day(3, 5), end: day(3, 6) })).toBe("5 de março");
  expect(spokenRange({ start: day(10, 25), end: day(10, 25) })).toBe("25 de outubro");
});

test("o fim e exclusivo: tarefa que acaba ao meio-dia conta o proprio dia", () => {
  expect(spokenRange({ start: day(10, 12), end: new Date(2026, 9, 18, 12) })).toBe(
    "12 a 18 de outubro",
  );
});

test("mover anda uma unidade da escala, e o mes preserva a hora", () => {
  const task = { start: new Date(2026, 0, 31, 9), end: new Date(2026, 1, 3, 18) };

  expect(moveTask(task, "day", 1).start).toEqual(new Date(2026, 1, 1, 9));
  expect(moveTask(task, "week", -1).end).toEqual(new Date(2026, 0, 27, 18));

  const month = moveTask(task, "month", 1);
  expect(month.start).toEqual(new Date(2026, 1, 28, 9));
  expect(month.end).toEqual(new Date(2026, 2, 3, 18));
});

test("encolher para no piso de um dia, e nao vira marco sem querer", () => {
  const task = { start: day(10, 12), end: day(10, 14) };

  expect(resizeTask(task, "day", -1).end).toEqual(day(10, 13));
  expect(resizeTask({ start: day(10, 12), end: day(10, 13) }, "day", -1).end).toEqual(day(10, 13));
  expect(resizeTask(task, "week", -1).end).toEqual(day(10, 13));
});

test("arrastar a borda de inicio para no dia anterior ao fim", () => {
  const task = { start: day(10, 12), end: day(10, 19) };

  expect(dragTask(task, "start", 2).start).toEqual(day(10, 14));
  expect(dragTask(task, "start", 20).start).toEqual(day(10, 18));
  expect(dragTask(task, "end", -20).end).toEqual(day(10, 13));
  expect(dragTask(task, "move", -3)).toEqual({ start: day(10, 9), end: day(10, 16) });
});

test("o agrupamento guarda a ordem de chegada, e recolher tira so os filhos", () => {
  const rows = buildRows(TASKS, new Set());
  expect(rows.map((row) => row.key)).toEqual(["g:Infraestrutura", "t:compra", "t:servidor", "t:virada"]);

  const group = rows[0]!;
  expect(group.kind === "group" && group.end).toEqual(day(10, 19));

  const closed = buildRows(TASKS, new Set(["Infraestrutura"]));
  expect(closed.map((row) => row.key)).toEqual(["g:Infraestrutura", "t:virada"]);
});

test("o cabecalho do dia tem um rotulo por dia e marca o fim de semana", () => {
  const range = scaleRange(TASKS, "day", TODAY);
  const [months, days] = headerTiers(range, "day");

  expect(months[0]!.label).toBe("setembro de 2026");
  expect(days.length).toBeGreaterThan(20);
  const saturday = days.find((cell) => cell.label === "S 3");
  expect(saturday?.weekend).toBe(true);
});

test("a seta contorna quando a sucessora comeca antes do fim da anterior", () => {
  expect(arrowPath({ x: 0, y: 20 }, { x: 100, y: 60 }, 40)).toBe("M 0 20 H 8 V 60 H 100");
  expect(arrowPath({ x: 100, y: 20 }, { x: 50, y: 60 }, 40)).toBe(
    "M 100 20 H 108 V 40 H 42 V 60 H 50",
  );
});

test("a grade e treegrid com nome, contagem real e titulo como cabecalho da linha", () => {
  const { container } = gantt();

  const grid = screen.getByRole("treegrid", { name: "Implantação" });
  expect(grid.getAttribute("aria-rowcount")).toBe("5");
  expect(grid.getAttribute("aria-colcount")).toBe("5");

  expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "Tarefa",
    "Início",
    "Fim",
    "Responsável",
    expect.stringContaining("Implantação, de"),
  ]);

  expect(screen.getByRole("rowheader", { name: "Instalar servidor" })).toBeTruthy();
  expect(cell(container, "t:servidor", 2).textContent).toBe("18/10/2026");

  const group = container.querySelector<HTMLElement>('[data-rc-row="group"]')!;
  expect(group.getAttribute("aria-level")).toBe("1");
  expect(group.getAttribute("aria-expanded")).toBe("true");
});

test("sem grupo, a grade e grid, e a coluna de responsavel so entra quando alguem tem", () => {
  const loose = TASKS.map(({ group: _group, assignee: _assignee, ...task }) => task);
  const { container } = gantt({ tasks: loose });

  expect(screen.queryByRole("treegrid")).toBeNull();
  expect(screen.getByRole("grid", { name: "Implantação" })).toBeTruthy();
  expect(screen.getAllByRole("columnheader")).toHaveLength(4);
  expect(container.querySelector("[aria-level]")).toBeNull();
});

test("a celula da linha do tempo diz datas, progresso e dependencia", () => {
  const { container } = gantt();

  expect(speech(container, "t:servidor")).toBe(
    "12 a 18 de outubro, 40% concluído, depende de Comprar hardware",
  );
  expect(speech(container, "t:virada")).toBe("marco em 25 de outubro, depende de Instalar servidor");
  expect(speech(container, "g:Infraestrutura")).toBe("2 tarefas, 1 a 18 de outubro");
});

test("a dependencia atrasada vira seta tracejada e e dita em voz alta", () => {
  const late = TASKS.map((task) =>
    task.id === "servidor" ? { ...task, start: day(10, 5), end: day(10, 10) } : task,
  );
  const { container } = gantt({ tasks: late });

  const arrows = [...container.querySelectorAll("[data-rc-arrow]")];
  expect(arrows).toHaveLength(2);
  expect(arrows.filter((arrow) => arrow.getAttribute("data-rc-arrow") === "late")).toHaveLength(1);
  expect(speech(container, "t:servidor")).toContain(
    "depende de Comprar hardware, e começa antes de ela terminar",
  );
});

test("seta e anuncia: mover pelo teclado chama onTaskChange e diz o novo intervalo", () => {
  const onChange = mock();
  const { container } = render(
    <RivoProvider scope="local">
      <Controlled onChange={onChange} />
    </RivoProvider>,
  );

  const timeline = cell(container, "t:servidor", 4);
  act(() => timeline.focus());
  fireEvent.keyDown(timeline, { key: "ArrowRight" });

  expect(onChange).toHaveBeenCalledTimes(1);
  const [task, change] = onChange.mock.calls[0]!;
  expect(task.id).toBe("servidor");
  expect(change).toEqual({ start: day(10, 13), end: day(10, 20), kind: "move" });
  expect(liveChange(container)).toBe("Instalar servidor: 13 a 19 de outubro");

  fireEvent.keyDown(cell(container, "t:servidor", 4), { key: "ArrowRight", shiftKey: true });
  expect(onChange.mock.calls[1]![1]).toEqual({ start: day(10, 13), end: day(10, 21), kind: "resize" });
  expect(liveChange(container)).toBe("Instalar servidor: 13 a 20 de outubro");
});

test("a unidade da seta segue a escala: semana anda sete dias, mes anda um mes", () => {
  const onChange = mock();
  const { container, unmount } = render(
    <RivoProvider scope="local">
      <Controlled onChange={onChange} scale="week" apply={false} />
    </RivoProvider>,
  );

  fireEvent.keyDown(cell(container, "t:servidor", 4), { key: "ArrowLeft" });
  expect(onChange.mock.calls[0]![1].start).toEqual(day(10, 5));
  unmount();

  const monthly = mock();
  const second = render(
    <RivoProvider scope="local">
      <Controlled onChange={monthly} scale="month" apply={false} />
    </RivoProvider>,
  );
  fireEvent.keyDown(cell(second.container, "t:servidor", 4), { key: "ArrowRight" });
  expect(monthly.mock.calls[0]![1].start).toEqual(day(11, 12));
});

test("se quem controla nao aplica a mudanca, nada e anunciado", () => {
  const onChange = mock();
  const { container } = render(
    <RivoProvider scope="local">
      <Controlled onChange={onChange} apply={false} />
    </RivoProvider>,
  );

  fireEvent.keyDown(cell(container, "t:servidor", 4), { key: "ArrowRight" });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(liveChange(container)).toBe("");
});

test("o marco anda, mas Shift com seta nao inventa duracao para ele", () => {
  const onChange = mock();
  const { container } = render(
    <RivoProvider scope="local">
      <Controlled onChange={onChange} apply={false} />
    </RivoProvider>,
  );

  const timeline = cell(container, "t:virada", 4);
  fireEvent.keyDown(timeline, { key: "ArrowRight", shiftKey: true });
  expect(onChange).not.toHaveBeenCalled();

  fireEvent.keyDown(timeline, { key: "ArrowRight" });
  expect(onChange.mock.calls[0]![1]).toEqual({ start: day(10, 26), end: day(10, 26), kind: "move" });
});

test("em RTL a seta da esquerda leva a tarefa para depois", () => {
  const onChange = mock();
  const { container } = render(
    <RivoProvider scope="local" dir="rtl">
      <Controlled onChange={onChange} apply={false} />
    </RivoProvider>,
  );

  fireEvent.keyDown(cell(container, "t:servidor", 4), { key: "ArrowLeft" });
  expect(onChange.mock.calls[0]![1].start).toEqual(day(10, 13));
});

test("so leitura: sem onTaskChange as setas navegam, e a grade se declara readonly", () => {
  const { container } = gantt();

  expect(screen.getByRole("treegrid").getAttribute("aria-readonly")).toBe("true");

  const timeline = cell(container, "t:servidor", 4);
  expect(timeline.getAttribute("aria-describedby")).toBeNull();
  act(() => timeline.focus());
  fireEvent.keyDown(timeline, { key: "ArrowLeft" });
  expect(document.activeElement).toBe(cell(container, "t:servidor", 3));
});

test("um so ponto de tabulacao, e as setas andam pelas celulas", () => {
  const { container } = gantt();

  const stops = [...container.querySelectorAll('[data-rc-cell][tabindex="0"]')];
  expect(stops).toHaveLength(1);
  expect(stops[0]!.getAttribute("data-rc-cell")).toBe("g:Infraestrutura|0");

  const first = cell(container, "g:Infraestrutura", 0);
  act(() => first.focus());
  fireEvent.keyDown(first, { key: "ArrowDown" });
  expect(document.activeElement).toBe(cell(container, "t:compra", 0));

  fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
  expect(document.activeElement).toBe(cell(container, "t:compra", 1));

  fireEvent.keyDown(document.activeElement!, { key: "End" });
  expect(document.activeElement).toBe(cell(container, "t:compra", 4));

  fireEvent.keyDown(document.activeElement!, { key: "Home" });
  expect(document.activeElement).toBe(cell(container, "t:compra", 0));

  fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
  expect(document.activeElement).toBe(cell(container, "g:Infraestrutura", 0));

  fireEvent.keyDown(document.activeElement!, { key: "End", ctrlKey: true });
  expect(document.activeElement).toBe(cell(container, "t:virada", 0));
});

test("o grupo recolhe pelo teclado e pelo clique, e avisa quem controla", () => {
  const onCollapse = mock();
  const { container } = gantt({ onCollapsedGroupsChange: onCollapse });

  const group = cell(container, "g:Infraestrutura", 0);
  act(() => group.focus());
  fireEvent.keyDown(group, { key: "ArrowLeft" });

  expect(onCollapse).toHaveBeenLastCalledWith(["Infraestrutura"]);
  expect(container.querySelector('[data-rc-cell="t:compra|0"]')).toBeNull();
  expect(screen.getByRole("treegrid").getAttribute("aria-rowcount")).toBe("3");
  expect(
    container.querySelector('[data-rc-row="group"]')!.getAttribute("aria-expanded"),
  ).toBe("false");

  fireEvent.click(cell(container, "g:Infraestrutura", 0));
  expect(onCollapse).toHaveBeenLastCalledWith([]);
  expect(cell(container, "t:compra", 0)).toBeTruthy();
});

test("Enter e clique no titulo escolhem a tarefa", () => {
  const onSelect = mock();
  const { container } = gantt({ onTaskSelect: onSelect });

  fireEvent.click(cell(container, "t:servidor", 0));
  expect(onSelect.mock.calls[0]![0].id).toBe("servidor");

  const timeline = cell(container, "t:virada", 4);
  act(() => timeline.focus());
  fireEvent.keyDown(timeline, { key: "Enter" });
  expect(onSelect.mock.calls[1]![0].id).toBe("virada");
});

test("arrastar a barra move em dias, e arrastar a borda muda a duracao", () => {
  const onChange = mock();
  const { container } = render(
    <RivoProvider scope="local">
      <Controlled onChange={onChange} apply={false} />
    </RivoProvider>,
  );

  const bar = cell(container, "t:servidor", 4).querySelector<HTMLElement>("[data-rc-bar]")!;
  fireEvent.pointerDown(bar, { button: 0, clientX: 100, pointerId: 1, pointerType: "mouse" });
  fireEvent.pointerMove(bar, { clientX: 181, pointerId: 1, pointerType: "mouse" });
  fireEvent.pointerUp(bar, { clientX: 181, pointerId: 1, pointerType: "mouse" });

  expect(onChange.mock.calls[0]![1]).toEqual({ start: day(10, 14), end: day(10, 21), kind: "move" });

  const edge = bar.querySelector<HTMLElement>('[data-rc-edge="end"]')!;
  fireEvent.pointerDown(edge, { button: 0, clientX: 300, pointerId: 2, pointerType: "mouse" });
  fireEvent.pointerMove(bar, { clientX: 220, pointerId: 2, pointerType: "mouse" });
  fireEvent.pointerUp(bar, { clientX: 220, pointerId: 2, pointerType: "mouse" });

  expect(onChange.mock.calls[1]![1]).toEqual({ start: day(10, 12), end: day(10, 17), kind: "resize" });
});

test("o dedo nao arrasta: no toque a moldura rola, e a barra fica onde estava", () => {
  const onChange = mock();
  const { container } = render(
    <RivoProvider scope="local">
      <Controlled onChange={onChange} apply={false} />
    </RivoProvider>,
  );

  const bar = cell(container, "t:servidor", 4).querySelector<HTMLElement>("[data-rc-bar]")!;
  fireEvent.pointerDown(bar, { button: 0, clientX: 100, pointerId: 1, pointerType: "touch" });
  fireEvent.pointerMove(bar, { clientX: 300, pointerId: 1, pointerType: "touch" });
  fireEvent.pointerUp(bar, { clientX: 300, pointerId: 1, pointerType: "touch" });

  expect(onChange).not.toHaveBeenCalled();
});

test("a barra veste o tom e o progresso, e a linha de hoje aparece no periodo", () => {
  const { container } = gantt();

  const bar = cell(container, "t:servidor", 4).querySelector<HTMLElement>("[data-rc-bar]")!;
  expect(bar.className.split(" ")).toContain("bg-info-subtle");
  expect(bar.className.split(" ")).toContain("border-border-strong");
  const fill = bar.querySelector<HTMLElement>("[data-rc-progress]")!;
  expect(fill.style.width).toBe("40%");
  expect(fill.className.split(" ")).toContain("bg-info-text");

  const milestone = cell(container, "t:virada", 4).querySelector<HTMLElement>("[data-rc-milestone]")!;
  expect(milestone.className.split(" ")).toContain("bg-accent-text");

  expect(container.querySelectorAll("[data-rc-today]").length).toBe(2);
});

test("a linha de hoje passa por baixo dos rotulos: vem antes no DOM e o rotulo e opaco", () => {
  const { container } = gantt();

  const header = container.querySelector<HTMLElement>(`[role="columnheader"][aria-colindex="5"]`)!;
  const today = header.querySelector<HTMLElement>("[data-rc-today]")!;
  const label = [...header.querySelectorAll<HTMLElement>("[data-rc-label]")].find(
    (element) => element.textContent === "Q 15",
  )!;
  expect(label).toBeDefined();
  expect(today.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(label.className.split(" ")).toContain("bg-surface");

  const caption = cell(container, "t:servidor", 4).querySelector<HTMLElement>("[data-rc-caption]")!;
  expect(caption.textContent).toBe("Instalar servidor · 40%");
  expect(caption.className.split(" ")).toContain("bg-surface");
});

test("o rotulo da barra que tem sucessora abre espaco para a seta que sai dela", () => {
  const { container } = gantt();
  const offset = (id: string) => {
    const timeline = cell(container, `t:${id}`, 4);
    const bar = timeline.querySelector<HTMLElement>("[data-rc-bar]");
    const caption = timeline.querySelector<HTMLElement>("[data-rc-caption]")!.parentElement!;
    const end = bar
      ? parseFloat(bar.style.insetInlineStart) + parseFloat(bar.style.width)
      : parseFloat(timeline.querySelector<HTMLElement>("[data-rc-milestone]")!.style.insetInlineStart) + 14;
    return parseFloat(caption.style.insetInlineStart) - end;
  };

  expect(offset("servidor")).toBeGreaterThanOrEqual(16);
  expect(offset("compra")).toBeGreaterThanOrEqual(16);
  expect(offset("virada")).toBeLessThan(16);
});

test("o mes que comeca antes da area visivel encolhe o rotulo ao pedaco que sobrou", () => {
  const { container } = gantt({ defaultScale: "week" });
  const viewport = container.querySelector<HTMLElement>('[role="treegrid"]')!;
  const labels = () =>
    [...container.querySelectorAll<HTMLElement>("[data-rc-month]")].map((element) => ({
      text: element.textContent,
      width: parseFloat(element.style.maxWidth),
    }));

  const scrollTo = (value: number) =>
    act(() => {
      viewport.scrollLeft = value;
      fireEvent.scroll(viewport);
    });
  const september = () => labels().find((label) => label.text === "setembro de 2026")!.width;

  scrollTo(0);
  expect(september()).toBe(164);
  scrollTo(100);
  expect(september()).toBe(64);
  scrollTo(400);
  expect(september()).toBe(0);
});

test("quinhentas tarefas entram, e so um punhado de linhas vai para o DOM", () => {
  const many: GanttTask[] = Array.from({ length: 500 }, (_, index) => ({
    id: String(index),
    title: `Tarefa ${index}`,
    start: day(10, 1 + (index % 20)),
    end: day(10, 3 + (index % 20)),
  }));
  const { container } = gantt({ tasks: many });

  expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("501");
  const drawn = container.querySelectorAll('[role="row"][data-rc-row]').length;
  expect(drawn).toBeGreaterThan(0);
  expect(drawn).toBeLessThan(60);
});

test("carregando: esqueleto, voz de espera e nenhuma grade vazia fingindo dado", () => {
  const { container } = gantt({ tasks: undefined });

  expect(screen.queryByRole("treegrid")).toBeNull();
  expect(screen.queryByRole("grid")).toBeNull();
  expect(container.querySelector("[data-rc-status]")!.textContent).toBe("Carregando…");
  expect(screen.getByRole("group", { name: "Implantação" }).getAttribute("aria-busy")).toBe("true");
});

test("erro vence carregando, e oferece tentar de novo", () => {
  const onRetry = mock();
  gantt({ tasks: undefined, isError: true, onRetry });

  expect(screen.getByText("Não foi possível carregar")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("grid")).toBeNull();
});

test("vazio: o EmptyState quando existe, e a grade parada em foco quando nao", () => {
  const { unmount } = gantt({
    tasks: [],
    empty: { title: "Nenhuma tarefa", description: "Crie a primeira para ver o cronograma." },
  });
  expect(screen.getByText("Nenhuma tarefa")).toBeTruthy();
  expect(screen.queryByRole("grid")).toBeNull();
  unmount();

  gantt({ tasks: [] });
  const grid = screen.getByRole("grid");
  expect(grid.getAttribute("aria-rowcount")).toBe("1");
  expect(grid.getAttribute("tabindex")).toBe("0");
});

test("coluna propria entra pela ordem pedida, e o titulo continua primeiro", () => {
  gantt({
    columns: [
      "end",
      { id: "status", header: "Situação", cell: (task) => (task.progress === 100 ? "Feita" : "Aberta") },
    ],
  });

  expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
    "Tarefa",
    "Fim",
    "Situação",
    expect.stringContaining("Implantação"),
  ]);
  expect(screen.getAllByText("Feita")).toHaveLength(1);
});

test("no celular sobra so o titulo, e a divisoria da tabela sai", () => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    gantt();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.queryByRole("separator")).toBeNull();
  } finally {
    window.matchMedia = original;
  }
});

test("no celular o titulo quebra em duas linhas, e o cabecalho da linha guarda o nome inteiro", () => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  const long = "Ordem de serviço 1042 da manutenção preventiva do galpão";
  try {
    const { container } = gantt({
      tasks: [{ ...TASKS[2]!, id: "os", title: long, group: "Oficina" }],
    });
    const header = cell(container, "t:os", 0);
    expect(header.getAttribute("title")).toBe(long);
    const text = header.querySelector("span")!;
    expect(text.className.split(" ")).toContain("line-clamp-2");
    expect(text.className.split(" ")).not.toContain("truncate");

    const group = cell(container, "g:Oficina", 0);
    expect(group.getAttribute("title")).toBe("Oficina");
  } finally {
    window.matchMedia = original;
  }
});

test("na mesa o titulo corta numa linha, e o nome inteiro continua no title", () => {
  const { container } = gantt();
  const header = cell(container, "t:servidor", 0);
  expect(header.getAttribute("title")).toBe("Instalar servidor");
  expect(header.querySelector("span")!.className.split(" ")).toContain("truncate");
});

test("a divisoria da tabela anda pelo teclado e respeita o piso", () => {
  gantt();

  const handle = screen.getByRole("separator", { name: "Largura da tabela" });
  const before = Number(handle.getAttribute("aria-valuenow"));
  expect(before).toBe(532);

  fireEvent.keyDown(handle, { key: "ArrowLeft" });
  expect(Number(handle.getAttribute("aria-valuenow"))).toBe(before - 16);

  fireEvent.keyDown(handle, { key: "Home" });
  expect(handle.getAttribute("aria-valuenow")).toBe(handle.getAttribute("aria-valuemin"));
});

test("trocar a escala troca o cabecalho e avisa quem controla", () => {
  const onScale = mock();
  gantt({ onScaleChange: onScale });

  fireEvent.click(screen.getByRole("button", { name: "Mês" }));
  expect(onScale).toHaveBeenCalledWith("month");
  expect(screen.getAllByText("out").length).toBeGreaterThan(0);
});

test("soltar vale onde o ponteiro soltou, mesmo sem o ultimo movimento ter desenhado", () => {
  const onChange = mock();
  const { container } = render(
    <RivoProvider scope="local">
      <Controlled onChange={onChange} apply={false} />
    </RivoProvider>,
  );

  const bar = cell(container, "t:servidor", 4).querySelector<HTMLElement>("[data-rc-bar]")!;
  fireEvent.pointerDown(bar, { button: 0, clientX: 100, pointerId: 1, pointerType: "mouse" });
  fireEvent.pointerMove(bar, { clientX: 140, pointerId: 1, pointerType: "mouse" });
  fireEvent.pointerUp(bar, { clientX: 221, pointerId: 1, pointerType: "mouse" });

  expect(onChange.mock.calls[0]![1].start).toEqual(day(10, 15));
});

test("a linha segue a densidade: 40 no confortavel, 32 no compacto", () => {
  const { container, unmount } = gantt();
  expect(container.querySelector<HTMLElement>('[data-rc-row="task"]')!.style.height).toBe("40px");
  unmount();

  const compact = render(
    <RivoProvider scope="local" density="compact">
      <Gantt tasks={TASKS} today={TODAY} label="Implantação" />
    </RivoProvider>,
  );
  expect(
    compact.container.querySelector<HTMLElement>('[data-rc-row="task"]')!.style.height,
  ).toBe("32px");
});

test("a divisoria para de seguir o ponteiro quando o arrasto e cancelado ou perde a captura", () => {
  for (const ending of ["pointerCancel", "lostPointerCapture"] as const) {
    const { unmount } = gantt();
    const handle = screen.getByRole("separator", { name: "Largura da tabela" });

    fireEvent.pointerDown(handle, { button: 0, clientX: 532, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });
    const during = handle.getAttribute("aria-valuenow");
    expect(during).not.toBe("532");

    fireEvent[ending](handle, { pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 600, pointerId: 1 });
    expect(handle.getAttribute("aria-valuenow")).toBe(during);
    unmount();
  }
});

test("desmontar no meio do arrasto da divisoria solta os ouvintes", () => {
  const { unmount } = gantt();
  const handle = screen.getByRole("separator", { name: "Largura da tabela" });
  const added: string[] = [];
  const removed: string[] = [];
  const add = handle.addEventListener.bind(handle);
  const remove = handle.removeEventListener.bind(handle);
  handle.addEventListener = ((type: string, ...rest: [never, never]) => {
    added.push(type);
    return add(type, ...rest);
  }) as typeof handle.addEventListener;
  handle.removeEventListener = ((type: string, ...rest: [never, never]) => {
    removed.push(type);
    return remove(type, ...rest);
  }) as typeof handle.removeEventListener;

  fireEvent.pointerDown(handle, { button: 0, clientX: 532, pointerId: 1 });
  expect(added).toContain("pointermove");
  unmount();
  expect(removed.sort()).toEqual(added.sort());
});

test("mover por mes desloca o inicio e leva o fim junto, sem perder dia no fim do mes", () => {
  const cases: [Date, Date, number][] = [
    [new Date(2027, 0, 29), new Date(2027, 1, 1), 3],
    [new Date(2027, 0, 30), new Date(2027, 0, 31), 1],
    [new Date(2027, 0, 31), new Date(2027, 1, 2), 2],
    [new Date(2027, 1, 28), new Date(2027, 2, 3), 3],
    [new Date(2028, 0, 30), new Date(2028, 1, 1), 2],
  ];
  expect(cases.length).toBeGreaterThan(3);

  for (const [start, end, length] of cases) {
    for (const amount of [1, -1, 2]) {
      const moved = moveTask({ start, end }, "month", amount);
      expect(Math.round((moved.end.getTime() - moved.start.getTime()) / 86400000)).toBe(length);
    }
  }

  expect(moveTask({ start: new Date(2027, 0, 30), end: new Date(2027, 0, 31) }, "month", 1)).toEqual({
    start: new Date(2027, 1, 28),
    end: new Date(2027, 2, 1),
  });
  expect(moveTask({ start: new Date(2027, 0, 29), end: new Date(2027, 1, 1) }, "month", 1)).toEqual({
    start: new Date(2027, 1, 28),
    end: new Date(2027, 2, 3),
  });
  expect(moveTask({ start: new Date(2028, 0, 29), end: new Date(2028, 0, 29) }, "month", 1)).toEqual({
    start: new Date(2028, 1, 29),
    end: new Date(2028, 1, 29),
  });
});

test("seta na escala por mes nao transforma a tarefa curta em marco", () => {
  const onChange = mock();
  const initial: GanttTask[] = [
    { id: "revisao", title: "Revisão", start: new Date(2027, 0, 30), end: new Date(2027, 0, 31) },
  ];
  const { container } = render(
    <RivoProvider scope="local">
      <Controlled onChange={onChange} initial={initial} scale="month" />
    </RivoProvider>,
  );

  fireEvent.keyDown(cell(container, "t:revisao", 3), { key: "ArrowRight" });
  expect(onChange.mock.calls[0]![1]).toEqual({
    start: new Date(2027, 1, 28),
    end: new Date(2027, 2, 1),
    kind: "move",
  });
  const timeline = cell(container, "t:revisao", 3);
  expect(timeline.querySelector("[data-rc-milestone]")).toBeNull();
  expect(timeline.querySelector("[data-rc-bar]")).not.toBeNull();
});

test("a barra, as escalas e o que o leitor de tela ouve saem de labels, e os meses do locale", () => {
  const { container } = gantt({
    locale: "en-US",
    labels: {
      today: "Today",
      day: "Day",
      week: "Week",
      month: "Month",
      scales: "Timeline scale",
      range: (from, to) => `${from} to ${to}`,
      progress: (percent) => `${percent}% done`,
      dependsOn: (title) => `after ${title}`,
      milestone: (when) => `milestone on ${when}`,
    },
  });
  expect(screen.getByRole("button", { name: "Today" })).toBeDefined();
  expect(screen.getByRole("group", { name: "Timeline scale" })).toBeDefined();
  expect(screen.getByText("Week")).toBeDefined();
  expect(container.textContent).toContain("October 2026");
  expect(speech(container, "t:servidor")).toBe(
    "12 to October 18, 40% done, after Comprar hardware",
  );
  expect(speech(container, "t:virada")).toBe("milestone on October 25, after Instalar servidor");
  expect(container.textContent).not.toContain("outubro");
});
