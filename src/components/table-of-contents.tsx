"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
} from "react";

import { useLatest } from "../hooks/common/latest";
import { useReducedMotion } from "../hooks/environment";
import { cn } from "../lib/cn";
import { focusLandmark } from "../lib/focus";
import type { Slots } from "../lib/slots";

export type TableOfContentsItem = {
  /** O `id` do titulo na pagina, sem o `#`. */
  id: string;
  /** O texto da linha no indice. */
  label: ReactNode;
  /** O nivel do titulo: 2 para `h2`, 3 para `h3`. O menor nivel da lista e a margem de fora. */
  level?: number;
};

export type TableOfContentsProps = Omit<ComponentPropsWithoutRef<"nav">, "children"> & {
  /**
   * A lista pronta. Com ela a peca nao le a pagina; sem ela, le os titulos que
   * casam com `selector` dentro de `container`.
   */
  items?: TableOfContentsItem[];
  /** Quais titulos entram, quando a lista nao vem pronta. O nivel sai da tag, `h2` a `h6`. */
  selector?: string;
  /**
   * Onde procurar os titulos. Sem ele, o documento inteiro. Conteudo que chega
   * depois (exemplo carregado sob demanda, secao montada tarde) entra sozinho.
   */
  container?: HTMLElement | null;
  /** A caixa que rola, quando nao e a janela. E nela que a secao visivel e medida. */
  root?: HTMLElement | null;
  /**
   * A altura do que gruda no topo (cabecalho fixo), em pixels. O titulo para
   * abaixo dela ao clicar, e a secao so conta como visivel abaixo dela.
   */
  offset?: number;
  /** O nome da regiao de navegacao, que tambem aparece como titulo do indice. */
  label?: string;
  /** Esconde o titulo visivel. O `label` continua nomeando a navegacao para o leitor de tela. */
  hideLabel?: boolean;
  /**
   * Escreve o `#id` na barra de endereco ao clicar, com `history.replaceState`,
   * sem empilhar historico. Desligado por padrao, para nao brigar com o router.
   */
  updateHash?: boolean;
  /** Chamado quando a secao marcada muda: ao rolar ou ao clicar. `null` antes do primeiro titulo. */
  onActiveChange?: (id: string | null) => void;
  /**
   * Chamado no clique de uma linha, antes da rolagem. `event.preventDefault()`
   * cancela a rolagem suave e deixa o navegador seguir o link.
   */
  onItemClick?: (item: TableOfContentsItem, event: MouseEvent<HTMLAnchorElement>) => void;
  classNames?: Slots<"label" | "list" | "item" | "link">;
};

type Entry = { id: string; label: ReactNode; level: number };
type Branch = { entry: Entry; depth: number; children: Branch[] };

const DEPTH = ["ps-3", "ps-6", "ps-9", "ps-12"] as const;
const LINE = 0.3;
const LOCK = 900;

function levelOf(node: Element) {
  const tag = /^H([1-6])$/.exec(node.tagName);
  if (tag) return Number(tag[1]);
  const aria = Number(node.getAttribute("aria-level"));
  return Number.isFinite(aria) && aria > 0 ? aria : 2;
}

function slugOf(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureId(node: HTMLElement, text: string) {
  if (node.id) return node.id;
  const base = slugOf(text) || "secao";
  let candidate = base;
  for (let index = 2; node.ownerDocument.getElementById(candidate); index += 1) {
    candidate = `${base}-${index}`;
  }
  node.id = candidate;
  return candidate;
}

function nest(entries: Entry[]): Branch[] {
  const top: Branch[] = [];
  const stack: Branch[] = [];
  for (const entry of entries) {
    while (stack.length > 0 && stack[stack.length - 1]!.entry.level >= entry.level) stack.pop();
    const branch: Branch = { entry, depth: stack.length, children: [] };
    (stack[stack.length - 1]?.children ?? top).push(branch);
    stack.push(branch);
  }
  return top;
}

const sameEntries = (a: Entry[], b: Entry[]) =>
  a.length === b.length &&
  a.every((entry, index) => {
    const other = b[index]!;
    return entry.id === other.id && entry.level === other.level && entry.label === other.label;
  });

export function TableOfContents({
  items,
  selector = "h2, h3",
  container,
  root,
  offset = 0,
  label = "Nesta página",
  hideLabel = false,
  updateHash = false,
  onActiveChange,
  onItemClick,
  className,
  classNames,
  ...props
}: TableOfContentsProps) {
  const reduced = useReducedMotion();
  const nav = useRef<HTMLElement>(null);
  const titleId = useId();
  const [read, setRead] = useState<Entry[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const lockedUntil = useRef(0);
  const announce = useLatest(onActiveChange);
  const reported = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (items || typeof document === "undefined") return;
    const scope: ParentNode = container ?? document;

    const collect = () => {
      const nodes = Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(
        (node) => !nav.current?.contains(node),
      );
      const next = nodes.map((node) => {
        const text = (node.textContent ?? "").trim();
        return { id: ensureId(node, text), label: text, level: levelOf(node) };
      });
      setRead((current) => (sameEntries(current, next) ? current : next));
    };

    collect();
    if (typeof MutationObserver === "undefined") return;
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(collect);
    });
    observer.observe(container ?? document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [items, container, selector]);

  const entries: Entry[] = items
    ? items.map((item) => ({ id: item.id, label: item.label, level: item.level ?? 0 }))
    : read;
  const floor = entries.reduce((min, entry) => Math.min(min, entry.level), Infinity);
  const ids = entries.map((entry) => entry.id).join("\n");

  useEffect(() => {
    if (!ids || typeof document === "undefined") return;
    const doc = nav.current?.ownerDocument ?? document;
    const targets = ids
      .split("\n")
      .map((id) => doc.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (targets.length === 0) return;

    const measure = () => {
      if (Date.now() < lockedUntil.current) return;
      const box = root?.getBoundingClientRect();
      const top = box?.top ?? 0;
      const height = box?.height ?? window.innerHeight;
      const line = top + offset + (height - offset) * LINE;
      let current: string | null = null;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line + 1) current = target.id;
      }
      setActive(current);
    };

    measure();
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(measure, {
      root: root ?? null,
      rootMargin: `-${offset}px 0px -${Math.round((1 - LINE) * 100)}% 0px`,
      threshold: [0, 1],
    });
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [ids, root, offset]);

  useEffect(() => {
    if (reported.current === active) return;
    const first = reported.current === undefined;
    reported.current = active;
    if (!first || active !== null) announce.current?.(active);
  }, [active, announce]);

  if (entries.length === 0) return null;

  function go(entry: Entry, event: MouseEvent<HTMLAnchorElement>) {
    onItemClick?.({ id: entry.id, label: entry.label, level: entry.level }, event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const doc = event.currentTarget.ownerDocument;
    const target = doc.getElementById(entry.id);
    if (!target) return;
    event.preventDefault();

    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    const rect = target.getBoundingClientRect();
    if (root) {
      const top = root.scrollTop + rect.top - root.getBoundingClientRect().top - offset;
      root.scrollTo?.({ top, behavior });
    } else {
      window.scrollTo?.({ top: window.scrollY + rect.top - offset, behavior });
    }

    lockedUntil.current = reduced ? 0 : Date.now() + LOCK;
    setActive(entry.id);
    focusLandmark(target);
    if (updateHash) window.history.replaceState(window.history.state, "", `#${entry.id}`);
  }

  function renderList(branches: Branch[], nested: boolean) {
    return (
      <ul
        className={cn(
          "flex flex-col",
          !nested && "border-s border-border",
          !nested && classNames?.list,
        )}
      >
        {branches.map(({ entry, depth, children }) => {
          const current = entry.id === active;
          return (
            <li key={entry.id} className={classNames?.item}>
              <a
                href={`#${entry.id}`}
                aria-current={current ? "location" : undefined}
                data-active={current ? "" : undefined}
                onClick={(event) => go(entry, event)}
                className={cn(
                  "-ms-px block rounded-e-sm border-s-2 py-1 pe-2 font-sans text-sm",
                  "transition-colors duration-fast ease-rc",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  DEPTH[Math.min(depth, DEPTH.length - 1)],
                  current
                    ? "border-accent-text font-rc-medium text-fg"
                    : "border-transparent text-fg-muted hover:text-fg",
                  classNames?.link,
                )}
              >
                {entry.label}
              </a>
              {children.length > 0 && renderList(children, true)}
            </li>
          );
        })}
      </ul>
    );
  }

  const leveled = entries.map((entry) => ({
    ...entry,
    level: Number.isFinite(floor) ? entry.level - floor : 0,
  }));

  return (
    <nav
      {...props}
      ref={nav}
      aria-label={hideLabel ? label : undefined}
      aria-labelledby={hideLabel ? undefined : titleId}
      className={cn("flex flex-col gap-2", className)}
    >
      {!hideLabel && (
        <p
          id={titleId}
          className={cn("font-sans text-sm font-rc-medium text-fg", classNames?.label)}
        >
          {label}
        </p>
      )}
      {renderList(nest(leveled), false)}
    </nav>
  );
}
