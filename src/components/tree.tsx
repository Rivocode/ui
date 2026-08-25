"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Checkbox } from "./checkbox";

export type TreeNode = {
  id: string;
  label: ReactNode;
  /** Texto usado na busca. Sem ele, a busca so acha pelo `label` de string. */
  search?: string;
  children?: TreeNode[];
  disabled?: boolean;
};

export type TreeProps = {
  items: TreeNode[];
  /** Ids marcados. Pai marcado nao entra aqui: quem vale e a folha. */
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  /** Sem isto, so uma folha por vez. */
  multiple?: boolean;
  /** Ids abertos. Sem controle, a arvore abre e fecha sozinha. */
  expanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Filtra pela busca, mantendo o caminho ate quem casou. */
  filter?: string;
  className?: string;
};

/**
 * Arvore de escolha.
 *
 * A regra que organiza tudo: **quem vale e a folha**. Marcar um pai marca
 * todas as folhas debaixo dele, e o pai passa a mostrar o estado das filhas,
 * cheio ou misto. Guardar o pai junto criaria dois jeitos de dizer a mesma
 * coisa, e quem consome teria que descobrir se "financeiro" quer dizer o setor
 * ou todo mundo dentro dele.
 *
 * A busca nao esconde pai de quem casou: sem o caminho, o resultado aparece
 * solto e ninguem sabe de onde ele veio.
 */
export function Tree({
  items,
  selected,
  onSelectedChange,
  multiple,
  expanded,
  onExpandedChange,
  filter = "",
  className,
}: TreeProps) {
  const [abertosInternos, setAbertosInternos] = useState<string[]>([]);
  const abertos = expanded ?? abertosInternos;
  const root = useRef<HTMLUListElement>(null);

  const visiveis = useMemo(() => filtrar(items, filter.trim().toLowerCase()), [items, filter]);

  // Buscando, tudo abre: fechar o caminho ate o resultado esconde o resultado.
  const searching = filter.trim().length > 0;

  function alternarAberto(id: string) {
    const novo = abertos.includes(id) ? abertos.filter((x) => x !== id) : [...abertos, id];
    if (!expanded) setAbertosInternos(novo);
    onExpandedChange?.(novo);
  }

  function toggleSelect(node: TreeNode) {
    const leaves = leavesOf(node);

    if (!multiple) {
      // Sem multipla, so folha escolhe, e a escolha troca em vez de somar.
      if (node.children?.length) return;
      onSelectedChange(selected.includes(node.id) ? [] : [node.id]);
      return;
    }

    const allChecked = leaves.every((leaf) => selected.includes(leaf));
    const withoutLeaves = selected.filter((id) => !leaves.includes(id));
    onSelectedChange(allChecked ? withoutLeaves : [...withoutLeaves, ...leaves]);
  }

  /**
   * Setas andam pelas linhas que estao na tela, e nao pela arvore inteira: a
   * navegacao segue o que o olho ve.
   */
  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const rows = [...(root.current?.querySelectorAll<HTMLElement>("[role=treeitem]") ?? [])];
    const current = document.activeElement as HTMLElement | null;
    const index = rows.findIndex((row) => row === current);
    if (index < 0) return;

    const id = rows[index]!.dataset.id!;
    const node = achar(visiveis, id);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = rows[index + (event.key === "ArrowDown" ? 1 : -1)];
      next?.focus();
    } else if (event.key === "ArrowRight" && node?.children?.length) {
      event.preventDefault();
      if (!abertos.includes(id)) alternarAberto(id);
      else rows[index + 1]?.focus();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (node?.children?.length && abertos.includes(id)) alternarAberto(id);
      else {
        const parent = paiDe(visiveis, id);
        if (parent) root.current?.querySelector<HTMLElement>(`[data-id="${parent.id}"]`)?.focus();
      }
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (node) toggleSelect(node);
    }
  }

  return (
    <ul
      ref={root}
      role="tree"
      aria-multiselectable={multiple || undefined}
      onKeyDown={onKeyDown}
      className={cn("flex flex-col", className)}
    >
      {visiveis.map((node, index) => (
        <Ramo
          key={node.id}
          node={node}
          level={0}
          isFirst={index === 0}
          abertos={searching ? null : abertos}
          selected={selected}
          multiple={multiple}
          onAlternarAberto={alternarAberto}
          onToggleSelect={toggleSelect}
        />
      ))}
    </ul>
  );
}

function Ramo({
  node,
  level,
  isFirst,
  abertos,
  selected,
  multiple,
  onAlternarAberto,
  onToggleSelect,
}: {
  node: TreeNode;
  level: number;
  isFirst: boolean;
  /** `null` quer dizer tudo aberto, que e o estado da busca. */
  abertos: string[] | null;
  selected: string[];
  multiple?: boolean;
  onAlternarAberto: (id: string) => void;
  onToggleSelect: (node: TreeNode) => void;
}) {
  const temFilhos = Boolean(node.children?.length);
  const isOpen = abertos === null || abertos.includes(node.id);
  const leaves = leavesOf(node);
  const checkedLeaves = leaves.filter((leaf) => selected.includes(leaf)).length;
  const cheio = checkedLeaves > 0 && checkedLeaves === leaves.length;
  const misto = checkedLeaves > 0 && !cheio;

  return (
    <li>
      <div
        role="treeitem"
        data-id={node.id}
        aria-expanded={temFilhos ? isOpen : undefined}
        aria-selected={cheio}
        aria-disabled={node.disabled || undefined}
        tabIndex={isFirst && level === 0 ? 0 : -1}
        onClick={() => !node.disabled && onToggleSelect(node)}
        style={{ paddingLeft: `${level * 1.25 + 0.25}rem` }}
        className={cn(
          "flex cursor-default items-center gap-2 rounded-sm py-[var(--rc-item-y)] pr-2",
          "text-base text-fg outline-none select-none",
          "hover:bg-accent-subtle focus-visible:ring-2 focus-visible:ring-ring",
          node.disabled && "cursor-not-allowed text-fg-disabled hover:bg-transparent",
        )}
      >
        {temFilhos ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={isOpen ? "Fechar" : "Abrir"}
            onClick={(event) => {
              event.stopPropagation();
              onAlternarAberto(node.id);
            }}
            className="flex size-4 shrink-0 items-center justify-center text-fg-subtle"
          >
            <ChevronRight
              size={14}
              aria-hidden="true"
              className={cn(
                "transition-transform duration-[var(--rc-duration-fast)] ease-rc",
                isOpen && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="size-4 shrink-0" aria-hidden="true" />
        )}

        {multiple && (
          <Checkbox
            checked={cheio}
            indeterminate={misto}
            disabled={node.disabled}
            tabIndex={-1}
            aria-hidden="true"
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={() => onToggleSelect(node)}
          />
        )}

        <span className="min-w-0 flex-1 truncate">{node.label}</span>
      </div>

      {temFilhos && isOpen && (
        <ul role="group" className="flex flex-col">
          {node.children!.map((filho) => (
            <Ramo
              key={filho.id}
              node={filho}
              level={level + 1}
              isFirst={false}
              abertos={abertos}
              selected={selected}
              multiple={multiple}
              onAlternarAberto={onAlternarAberto}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Todas as folhas debaixo de um no. Um no sem filhos e a propria folha. */
export function leavesOf(node: TreeNode): string[] {
  if (!node.children?.length) return [node.id];
  return node.children.flatMap(leavesOf);
}

function text(node: TreeNode): string {
  return (node.search ?? (typeof node.label === "string" ? node.label : "")).toLowerCase();
}

/** Mantem quem casou e o caminho ate ele. */
function filtrar(items: TreeNode[], busca: string): TreeNode[] {
  if (!busca) return items;

  return items.flatMap((node) => {
    const children = node.children ? filtrar(node.children, busca) : [];
    if (text(node).includes(busca)) return [node];
    if (children.length) return [{ ...node, children: children }];
    return [];
  });
}

function achar(items: TreeNode[], id: string): TreeNode | undefined {
  for (const node of items) {
    if (node.id === id) return node;
    const dentro = node.children ? achar(node.children, id) : undefined;
    if (dentro) return dentro;
  }
  return undefined;
}

function paiDe(items: TreeNode[], id: string, parent?: TreeNode): TreeNode | undefined {
  for (const node of items) {
    if (node.id === id) return parent;
    const dentro = node.children ? paiDe(node.children, id, node) : undefined;
    if (dentro) return dentro;
  }
  return undefined;
}
