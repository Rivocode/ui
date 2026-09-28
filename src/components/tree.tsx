"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { ChevronRight } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { matchesSearch } from "../shared/highlight";
import { Checkbox } from "./checkbox";

export type TreeNode = {
  id: string;
  label: ReactNode;
  /** Texto usado na busca. Sem ele, a busca so acha pelo `label` de string. */
  search?: string;
  children?: TreeNode[];
  disabled?: boolean;
};

export type TreeProps = Omit<ComponentPropsWithoutRef<"ul">, "defaultValue" | "children"> & {
  items: TreeNode[];
  /**
   * Ids marcados, quando quem usa controla o estado. Pai marcado nao entra
   * aqui: quem vale e a folha.
   */
  value?: string[];
  /** Os ids iniciais, quando a arvore controla o proprio estado. */
  defaultValue?: string[];
  onValueChange?: (ids: string[]) => void;
  /** Sem isto, so uma folha por vez. */
  multiple?: boolean;
  /** Ids dos galhos abertos, para quem controla. Anda junto com `onOpenChange`. */
  open?: string[];
  /** Os galhos abertos na primeira pintura, sem controlar. */
  defaultOpen?: string[];
  onOpenChange?: (ids: string[]) => void;
  /** Filtra pela busca, mantendo o caminho ate quem casou. */
  filter?: string;
  className?: string;
  /**
   * Os textos da peca, para trocar o idioma: `expand` e `collapse` sao os
   * nomes do botao que abre e fecha um ramo. Passe so os que mudam.
   */
  labels?: Partial<TreeLabels>;
};

export type TreeLabels = {
  expand: string;
  collapse: string;
};

const LABELS: TreeLabels = { expand: "Abrir", collapse: "Fechar" };

export function Tree({
  items,
  value,
  defaultValue,
  onValueChange,
  multiple,
  open,
  defaultOpen,
  onOpenChange,
  filter = "",
  className,
  labels: labelsProp,
  onKeyDown: onKeyDownProp,
  onFocus: onFocusProp,
  ...rest
}: TreeProps) {
  const labels = { ...LABELS, ...labelsProp };
  const [internalOpenIds, setInternalOpenIds] = useState<string[]>(defaultOpen ?? []);
  const openIds = open ?? internalOpenIds;
  const root = useRef<HTMLUListElement>(null);
  const rtl = useDirection() === "rtl";

  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
  const picked = value ?? internalValue;

  function change(ids: string[]) {
    if (!controlled) setInternalValue(ids);
    onValueChange?.(ids);
  }

  const visible = useMemo(() => filterTree(items, filter.trim()), [items, filter]);

  const searching = filter.trim().length > 0;
  const shownIds = shownRows(visible, searching ? null : openIds);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const tabbable = activeId !== undefined && shownIds.includes(activeId) ? activeId : shownIds[0];

  function toggleOpen(id: string) {
    const next = openIds.includes(id) ? openIds.filter((x) => x !== id) : [...openIds, id];
    if (!open) setInternalOpenIds(next);
    onOpenChange?.(next);
  }

  function toggleSelect(node: TreeNode) {
    if (node.disabled) return;

    if (!multiple) {
      if (node.children?.length) return;
      change(picked.includes(node.id) ? [] : [node.id]);
      return;
    }

    const leaves = enabledLeavesOf(node);
    if (leaves.length === 0) return;
    const allChecked = leaves.every((leaf) => picked.includes(leaf));
    const withoutLeaves = picked.filter((id) => !leaves.includes(id));
    change(allChecked ? withoutLeaves : [...withoutLeaves, ...leaves]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    onKeyDownProp?.(event);
    if (event.defaultPrevented) return;

    const rows = [...(root.current?.querySelectorAll<HTMLElement>("[role=treeitem]") ?? [])];
    const current = document.activeElement as HTMLElement | null;
    const index = rows.findIndex((row) => row === current);
    if (index < 0) return;

    const id = rows[index]!.dataset.id!;
    const node = findNode(visible, id);

    const into = rtl ? "ArrowLeft" : "ArrowRight";
    const out = rtl ? "ArrowRight" : "ArrowLeft";

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = rows[index + (event.key === "ArrowDown" ? 1 : -1)];
      next?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? rows[0] : rows[rows.length - 1])?.focus();
    } else if (event.key === into && node?.children?.length) {
      event.preventDefault();
      if (!openIds.includes(id)) toggleOpen(id);
      else rows[index + 1]?.focus();
    } else if (event.key === out) {
      event.preventDefault();
      if (node?.children?.length && openIds.includes(id)) toggleOpen(id);
      else {
        const parent = parentOf(visible, id);
        if (parent) root.current?.querySelector<HTMLElement>(`[data-id="${parent.id}"]`)?.focus();
      }
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (node) toggleSelect(node);
    }
  }

  return (
    <ul
      {...rest}
      ref={root}
      role="tree"
      aria-multiselectable={multiple || undefined}
      onKeyDown={onKeyDown}
      onFocus={(event) => {
        onFocusProp?.(event);
        const id = (event.target as HTMLElement).dataset.id;
        if (id !== undefined && (event.target as HTMLElement).getAttribute("role") === "treeitem") setActiveId(id);
      }}
      className={cn("flex flex-col", className)}
    >
      {visible.map((node) => (
        <Branch
          key={node.id}
          node={node}
          level={0}
          tabbable={tabbable}
          openIds={searching ? null : openIds}
          picked={picked}
          multiple={multiple}
          onToggleOpen={toggleOpen}
          onToggleSelect={toggleSelect}
          labels={labels}
        />
      ))}
    </ul>
  );
}

function Branch({
  node,
  level,
  tabbable,
  openIds,
  picked,
  multiple,
  onToggleOpen,
  onToggleSelect,
  labels,
}: {
  node: TreeNode;
  level: number;
  tabbable: string | undefined;
  /** `null` quer dizer tudo aberto, que e o estado da busca. */
  openIds: string[] | null;
  picked: string[];
  multiple?: boolean;
  onToggleOpen: (id: string) => void;
  onToggleSelect: (node: TreeNode) => void;
  labels: TreeLabels;
}) {
  const rtl = useDirection() === "rtl";
  const hasChildren = Boolean(node.children?.length);
  const isOpen = openIds === null || openIds.includes(node.id);
  const leaves = leavesOf(node);
  const checkedLeaves = leaves.filter((leaf) => picked.includes(leaf)).length;
  const full = checkedLeaves > 0 && checkedLeaves === leaves.length;
  const mixed = checkedLeaves > 0 && !full;

  return (
    <li role="none">
      <div
        role="treeitem"
        data-id={node.id}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-selected={full}
        aria-disabled={node.disabled || undefined}
        tabIndex={node.id === tabbable ? 0 : -1}
        onClick={() => !node.disabled && onToggleSelect(node)}
        style={{ paddingInlineStart: `${level * 1.25 + 0.25}rem` }}
        className={cn(
          "flex cursor-default items-center gap-2 rounded-sm py-[var(--rc-item-y)] pe-2",
          "text-base text-fg outline-none select-none",
          "hover:bg-accent-subtle focus-visible:ring-2 focus-visible:ring-ring",
          node.disabled && "cursor-not-allowed text-fg-disabled hover:bg-transparent",
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={isOpen ? labels.collapse : labels.expand}
            onClick={(event) => {
              event.stopPropagation();
              onToggleOpen(node.id);
            }}
            className="relative flex size-4 shrink-0 items-center justify-center text-fg-subtle after:absolute after:-inset-1"
          >
            <ChevronRight
              size={14}
              aria-hidden="true"
              className={cn(
                "transition-transform duration-[var(--rc-duration-fast)] ease-rc",
                isOpen ? "rotate-90" : rtl && "rotate-180",
              )}
            />
          </button>
        ) : (
          <span className="size-4 shrink-0" aria-hidden="true" />
        )}

        {multiple && (
          <Checkbox
            checked={full}
            indeterminate={mixed}
            disabled={node.disabled}
            tabIndex={-1}
            aria-hidden="true"
            className="after:hidden"
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={() => onToggleSelect(node)}
          />
        )}

        <span
          title={typeof node.label === "string" ? node.label : undefined}
          className="min-w-0 flex-1 truncate"
        >
          {node.label}
        </span>
      </div>

      {hasChildren && isOpen && (
        <ul role="group" className="flex flex-col">
          {node.children!.map((child) => (
            <Branch
              key={child.id}
              node={child}
              level={level + 1}
              tabbable={tabbable}
              openIds={openIds}
              picked={picked}
              multiple={multiple}
              onToggleOpen={onToggleOpen}
              onToggleSelect={onToggleSelect}
              labels={labels}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function leavesOf(node: TreeNode): string[] {
  if (!node.children?.length) return [node.id];
  return node.children.flatMap(leavesOf);
}

function enabledLeavesOf(node: TreeNode): string[] {
  if (node.disabled) return [];
  if (!node.children?.length) return [node.id];
  return node.children.flatMap(enabledLeavesOf);
}

function shownRows(items: TreeNode[], openIds: string[] | null): string[] {
  return items.flatMap((node) => [
    node.id,
    ...(node.children?.length && (openIds === null || openIds.includes(node.id))
      ? shownRows(node.children, openIds)
      : []),
  ]);
}

function text(node: TreeNode): string {
  return node.search ?? (typeof node.label === "string" ? node.label : "");
}

function filterTree(items: TreeNode[], query: string): TreeNode[] {
  if (!query) return items;

  return items.flatMap((node) => {
    const children = node.children ? filterTree(node.children, query) : [];
    if (matchesSearch(text(node), query)) return [node];
    if (children.length) return [{ ...node, children: children }];
    return [];
  });
}

function findNode(items: TreeNode[], id: string): TreeNode | undefined {
  for (const node of items) {
    if (node.id === id) return node;
    const inside = node.children ? findNode(node.children, id) : undefined;
    if (inside) return inside;
  }
  return undefined;
}

function parentOf(items: TreeNode[], id: string, parent?: TreeNode): TreeNode | undefined {
  for (const node of items) {
    if (node.id === id) return parent;
    const inside = node.children ? parentOf(node.children, id, node) : undefined;
    if (inside) return inside;
  }
  return undefined;
}
