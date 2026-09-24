"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { GripHorizontal, GripVertical } from "lucide-react";
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import {
  adjust,
  boundsAt,
  initialLayout,
  isCollapsed,
  isValidLayout,
  near,
  normalize,
  resizeAt,
  type PanelConstraints,
} from "../lib/panel-layout";
import type { Slots } from "../lib/slots";

export type ResizableStorage = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
};

export type ResizablePanelGroupProps = Omit<ComponentProps<"div">, "onChange"> & {
  /** `horizontal` poe os paineis lado a lado; `vertical` empilha, e a divisoria deita. */
  orientation?: "horizontal" | "vertical";
  /** Controlado: a medida de cada painel, em porcentagem e na ordem do documento, somando 100. */
  layout?: number[];
  /** O layout inteiro, em porcentagem, a cada mudanca: arraste, teclado, colapso ou chamada por ref. */
  onLayoutChange?: (sizes: number[]) => void;
  /** Guarda o layout entre sessoes sob esta chave. A mesma chave em duas telas divide o mesmo layout. */
  autoSaveId?: string;
  /** Onde o `autoSaveId` guarda. Padrao `localStorage`; falha de leitura ou escrita e ignorada, e o grupo volta ao `defaultSize`. */
  storage?: ResizableStorage;
};

export type ResizablePanelHandle = {
  collapse: () => void;
  expand: () => void;
  resize: (size: number) => void;
  getSize: () => number;
  isCollapsed: () => boolean;
};

export type ResizablePanelProps = ComponentPropsWithoutRef<"div"> & {
  /** Medida inicial, em porcentagem do grupo. Sem ela, o painel divide o que sobra com os outros sem medida. */
  defaultSize?: number;
  /** Menor medida, em porcentagem. Padrao 10. */
  minSize?: number;
  /** Maior medida, em porcentagem. Padrao 100. */
  maxSize?: number;
  /** Deixa o painel recolher ate o `collapsedSize`: arrastando abaixo da metade do `minSize`, pela seta, por `Home` ou por `Enter` na divisoria. */
  collapsible?: boolean;
  /** A medida do painel recolhido, em porcentagem, padrao 0. Em 0 o painel some e o conteudo sai do `Tab`. */
  collapsedSize?: number;
  onCollapse?: () => void;
  onExpand?: () => void;
  /** A medida nova deste painel, em porcentagem, a cada mudanca. */
  onResize?: (size: number) => void;
  /** A API imperativa: `collapse()`, `expand()`, `resize(size)`, `getSize()` e `isCollapsed()`. */
  ref?: Ref<ResizablePanelHandle>;
};

export type ResizableHandleProps = ComponentPropsWithoutRef<"div"> & {
  /** Desenha a pegadinha no meio da linha. O alvo de 24px existe com ou sem ela. */
  withHandle?: boolean;
  /** Classe por parte: `grip`, a pegadinha do `withHandle`. */
  classNames?: Slots<"grip">;
};

type PanelLive = {
  defaultSize?: number;
  constraints: PanelConstraints;
  onCollapse?: () => void;
  onExpand?: () => void;
  onResize?: (size: number) => void;
};

type Entry =
  | {
      kind: "panel";
      key: string;
      domId: string;
      node: RefObject<HTMLElement | null>;
      live: RefObject<PanelLive>;
    }
  | { kind: "handle"; key: string; node: RefObject<HTMLElement | null> };

type Arrangement = { panels: string[]; pivots: Record<string, number>; sizes: number[] };

type Actions = {
  register: (entry: Entry) => () => void;
  startDrag: (key: string, event: ReactPointerEvent<HTMLElement>) => void;
  keyDown: (key: string, event: KeyboardEvent<HTMLElement>) => void;
  collapse: (key: string) => void;
  expand: (key: string) => void;
  resize: (key: string, size: number) => void;
  sizeOf: (key: string) => number | undefined;
};

type Estimate = {
  sizes: number[];
  constraints: PanelConstraints[];
  ids: string[];
  claim: (key: string, kind: "panel" | "handle", domId?: string) => number;
};

type GroupContextValue = {
  vertical: boolean;
  estimate: Estimate | null;
  actions: Actions;
  sizes: number[];
  panels: string[];
  pivots: Record<string, number>;
  entries: RefObject<Map<string, Entry>>;
};

const GroupContext = createContext<GroupContextValue | null>(null);

const STEP = 2;
const EMPTY: Arrangement = { panels: [], pivots: {}, sizes: [] };
const FREE: PanelConstraints = { minSize: 0, maxSize: 100, collapsible: false, collapsedSize: 0 };

function constraintsFrom(props: ResizablePanelProps): PanelConstraints {
  return {
    minSize: props.minSize ?? 10,
    maxSize: props.maxSize ?? 100,
    collapsible: props.collapsible ?? false,
    collapsedSize: props.collapsedSize ?? 0,
  };
}

function panelsIn(children: ReactNode): ResizablePanelProps[] | null {
  const found: ResizablePanelProps[] = [];
  let readable = true;

  const visit = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (!readable || !isValidElement(child)) return;
      const props = child.props as { children?: ReactNode };
      if (child.type === ResizablePanel) found.push(child.props as ResizablePanelProps);
      else if (child.type === ResizableHandle) return;
      else if (child.type === Fragment || typeof child.type === "string") visit(props.children);
      else readable = false;
    });
  };

  visit(children);
  return readable && found.length > 0 ? found : null;
}

function estimateOf(children: ReactNode, layout: number[] | undefined): Estimate | null {
  const found = panelsIn(children);
  if (!found) return null;

  const constraints = found.map(constraintsFrom);
  const sizes =
    layout && layout.length === found.length
      ? layout
      : initialLayout(
          found.map((props) => props.defaultSize),
          constraints,
        );
  const claimed = new Map<string, number>();
  const ids: string[] = [];

  return {
    sizes,
    constraints,
    ids,
    claim(key, kind, domId) {
      const known = claimed.get(key);
      if (known !== undefined) return known;
      const at = kind === "panel" ? ids.length : ids.length - 1;
      if (kind === "panel") ids.push(domId ?? "");
      claimed.set(key, at);
      return at;
    },
  };
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

function localStorageOrNothing(): ResizableStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function byDocument(a: Entry, b: Entry) {
  const position = a.node.current!.compareDocumentPosition(b.node.current!);
  return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

function sameArrangement(a: Arrangement, b: Arrangement) {
  const pivots = Object.keys(a.pivots);
  return (
    a.panels.length === b.panels.length &&
    a.panels.every((key, index) => key === b.panels[index]) &&
    a.sizes.length === b.sizes.length &&
    a.sizes.every((size, index) => near(size, b.sizes[index]!)) &&
    pivots.length === Object.keys(b.pivots).length &&
    pivots.every((key) => a.pivots[key] === b.pivots[key])
  );
}

export function ResizablePanelGroup({
  orientation = "horizontal",
  layout,
  onLayoutChange,
  autoSaveId,
  storage,
  className,
  children,
  ref,
  ...props
}: ResizablePanelGroupProps) {
  const frame = useRef<HTMLDivElement>(null);
  const setFrame = useCallback(
    (node: HTMLDivElement | null) => {
      frame.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  const entries = useRef(new Map<string, Entry>());
  const [version, setVersion] = useState(0);
  const [arrangement, setArrangement] = useState<Arrangement>(EMPTY);
  const [dragging, setDragging] = useState(false);
  const rtl = useDirection() === "rtl";
  const vertical = orientation === "vertical";

  const controlled = layout !== undefined && layout.length === arrangement.panels.length;
  const sizes = controlled ? layout : arrangement.sizes;
  const estimate = arrangement.panels.length === 0 ? estimateOf(children, layout) : null;

  const latest = useRef({ sizes, arrangement, controlled, onLayoutChange, rtl, vertical });
  const store = useRef({ autoSaveId, storage });
  const remembered = useRef(new Map<string, number>());
  const previous = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    latest.current = { sizes, arrangement, controlled, onLayoutChange, rtl, vertical };
    store.current = { autoSaveId, storage };
  });

  const actions = useMemo<Actions>(() => {
    const constraintsOf = (keys: string[]) =>
      keys.map((key) => {
        const entry = entries.current.get(key);
        return entry?.kind === "panel" ? entry.live.current.constraints : FREE;
      });

    const commit = (next: number[]) => {
      const { sizes: current, controlled: isControlled } = latest.current;
      if (
        next.length !== current.length ||
        next.every((size, index) => near(size, current[index]!))
      )
        return;

      if (!isControlled) setArrangement((before) => ({ ...before, sizes: next }));
      latest.current.onLayoutChange?.(next);
    };

    const indexOf = (key: string) => latest.current.arrangement.panels.indexOf(key);

    const pivotOf = (key: string) => {
      const { panels, pivots } = latest.current.arrangement;
      const pivot = pivots[key];
      return pivot === undefined || pivot < 0 || pivot + 1 >= panels.length ? -1 : pivot;
    };

    const collapseAt = (index: number) => {
      const { sizes: current, arrangement: now } = latest.current;
      const constraints = constraintsOf(now.panels);
      const c = constraints[index];
      if (!c?.collapsible || isCollapsed(c, current[index]!)) return;

      remembered.current.set(now.panels[index]!, current[index]!);
      commit(resizeAt(current, constraints, index, c.collapsedSize, "eager"));
    };

    const expandAt = (index: number) => {
      const { sizes: current, arrangement: now } = latest.current;
      const constraints = constraintsOf(now.panels);
      const c = constraints[index];
      if (!c || !isCollapsed(c, current[index]!)) return;

      const key = now.panels[index]!;
      const entry = entries.current.get(key);
      const fallback = entry?.kind === "panel" ? entry.live.current.defaultSize : undefined;
      const target = Math.max(c.minSize, remembered.current.get(key) ?? fallback ?? c.minSize);
      commit(resizeAt(current, constraints, index, target, "eager"));
    };

    return {
      register(entry) {
        entries.current.set(entry.key, entry);
        setVersion((value) => value + 1);
        return () => {
          entries.current.delete(entry.key);
          setVersion((value) => value + 1);
        };
      },

      startDrag(key, event) {
        if (event.button > 0) return;
        const pivot = pivotOf(key);
        const box = frame.current?.getBoundingClientRect();
        if (pivot < 0 || !box) return;

        const { vertical: isVertical, rtl: isRtl, sizes: base, arrangement: now } = latest.current;
        let handles = 0;
        for (const entry of entries.current.values()) {
          if (entry.kind !== "handle" || !entry.node.current) continue;
          const rect = entry.node.current.getBoundingClientRect();
          const style = getComputedStyle(entry.node.current);
          const margins = isVertical
            ? [style.marginTop, style.marginBottom]
            : [style.marginLeft, style.marginRight];
          handles +=
            (isVertical ? rect.height : rect.width) +
            margins.reduce((sum, margin) => sum + (Number.parseFloat(margin) || 0), 0);
        }

        const span = (isVertical ? box.height : box.width) - handles;
        if (span <= 0) return;

        event.currentTarget.setPointerCapture?.(event.pointerId);
        const constraints = constraintsOf(now.panels);
        const origin = isVertical ? event.clientY : event.clientX;
        setDragging(true);

        const onMove = (pointer: PointerEvent) => {
          const moved = (isVertical ? pointer.clientY : pointer.clientX) - origin;
          const along = !isVertical && isRtl ? -moved : moved;
          commit(adjust(base, constraints, pivot, (along / span) * 100, "half"));
        };

        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          setDragging(false);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      },

      keyDown(key, event) {
        const pivot = pivotOf(key);
        if (pivot < 0) return;

        const {
          vertical: isVertical,
          rtl: isRtl,
          sizes: current,
          arrangement: now,
        } = latest.current;
        const constraints = constraintsOf(now.panels);
        const back = isVertical ? "ArrowUp" : isRtl ? "ArrowRight" : "ArrowLeft";
        const forward = isVertical ? "ArrowDown" : isRtl ? "ArrowLeft" : "ArrowRight";
        const bounds = boundsAt(current, constraints, pivot);
        const size = current[pivot]!;

        if (event.key === back) commit(adjust(current, constraints, pivot, -STEP, "eager"));
        else if (event.key === forward) commit(adjust(current, constraints, pivot, STEP, "eager"));
        else if (event.key === "Home")
          commit(adjust(current, constraints, pivot, bounds.min - size, "eager"));
        else if (event.key === "End")
          commit(adjust(current, constraints, pivot, bounds.max - size, "eager"));
        else if (event.key === "Enter") {
          const target = constraints[pivot]!.collapsible
            ? pivot
            : constraints[pivot + 1]!.collapsible
              ? pivot + 1
              : -1;
          if (target < 0) return;
          if (isCollapsed(constraints[target]!, current[target]!)) expandAt(target);
          else collapseAt(target);
        } else return;

        event.preventDefault();
      },

      collapse(key) {
        const index = indexOf(key);
        if (index >= 0) collapseAt(index);
      },

      expand(key) {
        const index = indexOf(key);
        if (index >= 0) expandAt(index);
      },

      resize(key, size) {
        const index = indexOf(key);
        if (index < 0) return;
        const { sizes: current, arrangement: now } = latest.current;
        commit(resizeAt(current, constraintsOf(now.panels), index, size, "half"));
      },

      sizeOf(key) {
        const index = indexOf(key);
        return index < 0 ? undefined : latest.current.sizes[index];
      },
    };
  }, []);

  useLayoutEffect(() => {
    const sorted = [...entries.current.values()]
      .filter((entry) => entry.node.current)
      .sort(byDocument);
    const panels: string[] = [];
    const pivots: Record<string, number> = {};

    for (const entry of sorted) {
      if (entry.kind === "panel") panels.push(entry.key);
      else pivots[entry.key] = panels.length - 1;
    }

    const lives = panels.map((key) => {
      const entry = entries.current.get(key);
      return entry?.kind === "panel" ? entry.live.current : undefined;
    });
    const constraints = lives.map((live) => live?.constraints ?? FREE);
    const defaults = lives.map((live) => live?.defaultSize);
    const before = latest.current.arrangement;

    let next: number[];
    if (before.panels.length === 0) {
      let saved: unknown;
      const { autoSaveId: id, storage: chosen } = store.current;
      if (id) {
        try {
          const raw = (chosen ?? localStorageOrNothing())?.getItem(`rivocode-ui:resizable:${id}`);
          saved = raw ? JSON.parse(raw) : undefined;
        } catch {
          saved = undefined;
        }
      }
      next = isValidLayout(saved, constraints) ? saved : initialLayout(defaults, constraints);
    } else {
      const kept = panels.map((key) => {
        const at = before.panels.indexOf(key);
        return at < 0 ? undefined : before.sizes[at];
      });
      next = kept.every((size) => size !== undefined)
        ? normalize(kept as number[], constraints)
        : normalize(
            kept.map((size, index) => size ?? defaults[index] ?? 100 / panels.length),
            constraints,
            kept.map((size) => size === undefined),
          );
    }

    const candidate = { panels, pivots, sizes: next };
    if (!sameArrangement(candidate, before)) {
      latest.current.arrangement = candidate;
      setArrangement(candidate);
    }
  }, [version]);

  const panelsKey = arrangement.panels.join(" ");
  const sizesKey = sizes.join(" ");

  useEffect(() => {
    const { panels } = latest.current.arrangement;
    const { sizes } = latest.current;
    if (panels.length === 0) return;

    panels.forEach((key, index) => {
      const size = sizes[index];
      const entry = entries.current.get(key);
      const before = previous.current.get(key);
      if (size === undefined || before === undefined || near(before, size)) return;
      if (entry?.kind !== "panel") return;

      const live = entry.live.current;
      live.onResize?.(size);
      const was = isCollapsed(live.constraints, before);
      const is = isCollapsed(live.constraints, size);
      if (!was && is) live.onCollapse?.();
      else if (was && !is) live.onExpand?.();
    });

    previous.current = new Map(panels.map((key, index) => [key, sizes[index]!]));

    const { autoSaveId: id, storage: chosen } = store.current;
    if (!id) return;
    try {
      (chosen ?? localStorageOrNothing())?.setItem(
        `rivocode-ui:resizable:${id}`,
        JSON.stringify(sizes),
      );
    } catch {
      return;
    }
  }, [sizesKey, panelsKey]);

  const value = useMemo<GroupContextValue>(
    () => ({
      vertical,
      estimate,
      actions,
      sizes,
      panels: arrangement.panels,
      pivots: arrangement.pivots,
      entries,
    }),
    [vertical, estimate, actions, sizes, arrangement],
  );

  return (
    <GroupContext.Provider value={value}>
      <div
        {...props}
        ref={setFrame}
        data-orientation={orientation}
        data-resizing={dragging ? "" : undefined}
        className={cn(
          "flex h-full w-full items-stretch",
          vertical ? "flex-col" : "flex-row",
          dragging && "select-none",
          dragging && (vertical ? "cursor-row-resize" : "cursor-col-resize"),
          className,
        )}
      >
        {children}
      </div>
    </GroupContext.Provider>
  );
}

export function ResizablePanel({
  defaultSize,
  minSize = 10,
  maxSize = 100,
  collapsible = false,
  collapsedSize = 0,
  onCollapse,
  onExpand,
  onResize,
  ref,
  id,
  className,
  style,
  ...props
}: ResizablePanelProps) {
  const group = useContext(GroupContext);
  const key = useId();
  const domId = id ?? key;
  const node = useRef<HTMLDivElement>(null);
  const constraints = { minSize, maxSize, collapsible, collapsedSize };
  const live = useRef<PanelLive>({ defaultSize, constraints, onCollapse, onExpand, onResize });
  const actions = group?.actions;

  useLayoutEffect(() => {
    live.current = { defaultSize, constraints, onCollapse, onExpand, onResize };
  });

  useLayoutEffect(
    () => actions?.register({ kind: "panel", key, domId, node, live }),
    [actions, key, domId],
  );

  useImperativeHandle(
    ref,
    () => ({
      collapse: () => actions?.collapse(key),
      expand: () => actions?.expand(key),
      resize: (size: number) => actions?.resize(key, size),
      getSize: () => actions?.sizeOf(key) ?? live.current.defaultSize ?? 0,
      isCollapsed: () =>
        isCollapsed(
          live.current.constraints,
          actions?.sizeOf(key) ?? live.current.defaultSize ?? 0,
        ),
    }),
    [actions, key],
  );

  const index = group ? group.panels.indexOf(key) : -1;
  let size: number | undefined;
  if (index >= 0) size = group!.sizes[index];
  else if (group?.estimate) size = group.estimate.sizes[group.estimate.claim(key, "panel", domId)];
  const collapsed = size !== undefined && isCollapsed(constraints, size);
  const flex =
    size !== undefined
      ? `${size} 1 0%`
      : defaultSize !== undefined
        ? `0 1 ${defaultSize}%`
        : "1 1 0%";

  return (
    <div
      {...props}
      ref={node}
      id={domId}
      data-panel=""
      data-collapsed={collapsed ? "" : undefined}
      inert={collapsed && collapsedSize === 0 ? true : undefined}
      className={cn("min-h-0 min-w-0 overflow-auto", className)}
      style={{ flex, ...style }}
    />
  );
}

export function ResizableHandle({
  withHandle = false,
  className,
  classNames,
  onPointerDown,
  onKeyDown,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ResizableHandleProps) {
  const group = useContext(GroupContext);
  const key = useId();
  const node = useRef<HTMLDivElement>(null);
  const actions = group?.actions;
  const vertical = group?.vertical ?? false;

  useLayoutEffect(() => actions?.register({ kind: "handle", key, node }), [actions, key]);

  let info: {
    controls: string;
    now: number;
    min: number;
    max: number;
    edge: "start" | "end" | null;
  } | null = null;
  if (group) {
    const early = group.panels.length === 0 ? group.estimate : null;
    const pivot = early ? early.claim(key, "handle") : group.pivots[key];
    const sizes = early ? early.sizes : group.sizes;
    if (pivot !== undefined && pivot >= 0 && pivot + 1 < sizes.length) {
      const constraints = early
        ? early.constraints
        : group.panels.map((panel) => {
            const entry = group.entries.current.get(panel);
            return entry?.kind === "panel" ? entry.live.current.constraints : FREE;
          });
      const entry = early ? undefined : group.entries.current.get(group.panels[pivot]!);
      const bounds = boundsAt(sizes, constraints, pivot);
      const before = sizes.slice(0, pivot + 1).reduce((sum, size) => sum + size, 0);
      const after = sizes.slice(pivot + 1).reduce((sum, size) => sum + size, 0);
      info = {
        controls: early ? (early.ids[pivot] ?? "") : entry?.kind === "panel" ? entry.domId : "",
        now: Math.round(sizes[pivot]!),
        min: Math.round(bounds.min),
        max: Math.round(bounds.max),
        edge: near(before, 0) ? "start" : near(after, 0) ? "end" : null,
      };
    }
  }
  const edge = info?.edge;

  const Grip = vertical ? GripHorizontal : GripVertical;

  return (
    <div
      {...props}
      ref={node}
      role="separator"
      tabIndex={info ? 0 : undefined}
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : "Redimensionar painéis")}
      aria-labelledby={ariaLabelledBy}
      aria-orientation={vertical ? "horizontal" : "vertical"}
      aria-valuenow={info?.now}
      aria-valuemin={info?.min}
      aria-valuemax={info?.max}
      aria-valuetext={info ? `${info.now}%` : undefined}
      aria-controls={info?.controls || undefined}
      data-orientation={vertical ? "vertical" : "horizontal"}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) actions?.startDrag(key, event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) actions?.keyDown(key, event);
      }}
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-border-strong",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-line-hover focus-visible:bg-accent",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        vertical ? "h-px w-full cursor-row-resize" : "w-px cursor-col-resize",
        edge === "start" && (vertical ? "mt-1.5" : "ms-1.5"),
        edge === "end" && (vertical ? "mb-1.5" : "me-1.5"),
        vertical
          ? "after:absolute after:inset-x-0 after:-inset-y-3"
          : "after:absolute after:inset-y-0 after:-inset-x-3",
        className,
      )}
    >
      {withHandle ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none flex shrink-0 items-center justify-center rounded-sm",
            "border border-border-strong bg-surface text-fg-muted",
            vertical ? "h-3 w-5" : "h-5 w-3",
            classNames?.grip,
          )}
        >
          <Grip className="size-3" />
        </span>
      ) : null}
      {children}
    </div>
  );
}
