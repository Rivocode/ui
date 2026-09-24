import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import {
  Badge,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  RivoProvider,
  currencyShort,
  type RivoDensity,
  type RivoTheme,
} from "../src/index";
import { Kanban, SortableList, type KanbanColumn, type KanbanMove } from "../src/dnd/index";

type Note = { id: string; client: string; amount: number; late?: boolean };

const QUEUE: Note[] = [
  { id: "1041", client: "Clínica São Lucas", amount: 3400 },
  { id: "1042", client: "Padaria Pão Quente", amount: 780, late: true },
  { id: "1043", client: "Oficina do Zé", amount: 1250 },
  { id: "1044", client: "Escola Aprender", amount: 5600 },
];

const STAGES = ["Conferir cadastro", "Calcular impostos", "Emitir nota", "Enviar ao cliente"];

const BOARD: KanbanColumn<Note>[] = [
  {
    id: "todo",
    title: "A emitir",
    items: [
      { id: "1051", client: "Clínica São Lucas", amount: 3400 },
      { id: "1052", client: "Padaria Pão Quente", amount: 780, late: true },
    ],
  },
  {
    id: "review",
    title: "Em análise",
    limit: 2,
    items: [
      { id: "1047", client: "Escola Aprender", amount: 5600 },
      { id: "1048", client: "Ótica Visão Clara", amount: 920 },
      { id: "1049", client: "Oficina do Zé", amount: 1250 },
    ],
  },
  { id: "done", title: "Emitida", items: [] },
];

function move(columns: KanbanColumn<Note>[], { itemId, from, to, index }: KanbanMove) {
  const card = columns.find((column) => column.id === from)?.items.find((note) => note.id === itemId);
  if (!card) return columns;
  return columns.map((column) => {
    const items = column.items.filter((note) => note.id !== itemId);
    if (column.id === to) items.splice(index, 0, card);
    return { ...column, items };
  });
}


function useLift(selector: string, keys: string[], active: boolean) {
  const scope = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const target = scope.current?.querySelector<HTMLElement>(selector);
    if (!target) return;
    const press = (element: EventTarget, code: string, key: string) =>
      element.dispatchEvent(new KeyboardEvent("keydown", { code, key, bubbles: true }));
    const timer = window.setTimeout(() => {
      press(target, "Space", " ");
      keys.forEach((code, step) =>
        window.setTimeout(() => press(target, code, code), 120 * (step + 1)),
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [selector, keys, active]);
  return scope;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section data-rc-shot={title} className="flex min-w-0 flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{title}</p>
      {children}
    </section>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-fg-muted">Nota {note.id}</span>
        {note.late && (
          <Badge tone="danger" size="sm">
            Atrasada
          </Badge>
        )}
      </div>
      <span className="font-medium">{note.client}</span>
      <span className="tabular-nums text-fg-muted">{currencyShort(note.amount)}</span>
    </div>
  );
}

const LIST_KEYS = ["ArrowDown"];
const BOARD_KEYS = ["ArrowRight"];

function Queue({ lift }: { lift: boolean }) {
  const [notes, setNotes] = useState(QUEUE);
  const scope = useLift("button[aria-roledescription]", LIST_KEYS, lift);
  return (
    <div ref={scope}>
      <SortableList
        aria-label="Ordem de emissão"
        items={notes}
        getKey={(note) => note.id}
        getLabel={(note) => `Nota ${note.id}`}
        onReorder={setNotes}
        renderItem={(note, { index }) => (
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{note.client}</ItemTitle>
              <ItemDescription>Nota {note.id}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <span className="text-sm tabular-nums text-fg">{currencyShort(note.amount)}</span>
              {index === 0 && (
                <Badge tone="accent" size="sm">
                  Próxima
                </Badge>
              )}
            </ItemActions>
          </Item>
        )}
      />
    </div>
  );
}

function Stages() {
  const [stages, setStages] = useState(STAGES);
  return (
    <SortableList
      aria-label="Etapas do fechamento"
      orientation="horizontal"
      handle={false}
      items={stages}
      getKey={(stage) => stage}
      getLabel={(stage) => stage}
      onReorder={setStages}
      renderItem={(stage, { handleProps, isDragging, index }) => (
        <div
          {...handleProps}
          className={
            "flex cursor-grab items-center gap-2 rounded-md border border-border bg-surface " +
            "px-3 py-2 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring " +
            (isDragging ? "shadow-2" : "")
          }
        >
          <span className="font-mono text-xs text-fg-muted">{index + 1}</span>
          {stage}
        </div>
      )}
    />
  );
}

function Board({ lift }: { lift: boolean }) {
  const [columns, setColumns] = useState(BOARD);
  const scope = useLift("li[aria-roledescription]", BOARD_KEYS, lift);
  return (
    <div ref={scope}>
      <Kanban
        aria-label="Notas de setembro"
        columns={columns}
        getKey={(note) => note.id}
        getLabel={(note) => `Nota ${note.id}`}
        onMove={(change) => setColumns((now) => move(now, change))}
        renderCard={(note) => <NoteCard note={note} />}
      />
    </div>
  );
}

function Sample({
  theme,
  density,
  lift,
}: {
  theme: RivoTheme;
  density: RivoDensity;
  lift?: "list" | "board";
}) {
  return (
    <RivoProvider theme={theme} density={density} scope="local">
      <div className="flex flex-col gap-8 p-6 sm:p-8">
        <p className="font-mono text-xs text-fg-subtle">
          {theme} · {density}
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          <Block title="SortableList">
            <Queue lift={lift === "list"} />
          </Block>

          <Block title="SortableList desabilitada">
            <SortableList
              aria-label="Ordem salvando"
              disabled
              items={QUEUE.slice(0, 2)}
              getKey={(note) => note.id}
              getLabel={(note) => `Nota ${note.id}`}
              onReorder={() => {}}
              renderItem={(note) => (
                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle>{note.client}</ItemTitle>
                  </ItemContent>
                </Item>
              )}
            />
          </Block>
        </div>

        <Block title="SortableList horizontal">
          <Stages />
        </Block>

        <Block title="Kanban">
          <Board lift={lift === "board"} />
        </Block>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample
      theme="rivocode-dark"
      density="comfortable"
      lift={location.hash === "#lista" ? "list" : undefined}
    />
    <Sample
      theme="rivocode-light"
      density="compact"
      lift={location.hash === "#quadro" ? "board" : undefined}
    />
    <Sample theme="rivocode-dark" density="compact" />
    <Sample theme="rivocode-light" density="comfortable" />
  </div>,
);
