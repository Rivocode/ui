"use client";

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
import { Checkbox } from "./checkbox";

export type TreeNode = {
  id: string;
  label: ReactNode;
  /** Texto usado na busca. Sem ele, a busca so acha pelo `label` de string. */
  search?: string;
  children?: TreeNode[];
  disabled?: boolean;
};

/*
 * Duas omissoes, e as duas por colisao com a `<ul>`:
 *
 * `defaultValue` existe em `HTMLAttributes` como `string | number | readonly
 * string[]`, e aqui ele e a lista de ids marcados. Sem o `Omit`, o tipo vira a
 * interseccao dos dois e o erro cai no ponto de chamada, longe daqui.
 *
 * `children` sai porque a arvore desenha os galhos a partir de `items`: filho
 * escrito por fora seria descartado sem aviso.
 *
 * Sem `ref` de proposito: a raiz ja carrega o `ref` interno que a navegacao
 * por seta usa para achar as linhas, e duas fontes de `ref` no mesmo elemento
 * so podem apagar uma a outra.
 */
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
  value,
  defaultValue,
  onValueChange,
  multiple,
  expanded,
  onExpandedChange,
  filter = "",
  className,
  onKeyDown: onKeyDownProp,
  ...rest
}: TreeProps) {
  const [internalOpenIds, setInternalOpenIds] = useState<string[]>([]);
  const openIds = expanded ?? internalOpenIds;
  const root = useRef<HTMLUListElement>(null);

  /*
   * A escolha deixou de ser obrigatoria.
   *
   * Ela nascia exigida, e o `TreeSelect`, que embrulha esta peca, ja aceitava
   * `value`/`defaultValue`/`onValueChange` opcionais. Quem trocava o painel
   * pela arvore inline reescrevia o binding inteiro, e ainda tinha que
   * inventar um `useState` para uma arvore que so queria abrir e fechar. Agora
   * ela guarda a propria escolha quando ninguem controla, como todo o resto do
   * catalogo.
   */
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
  const picked = value ?? internalValue;

  function change(ids: string[]) {
    if (!controlled) setInternalValue(ids);
    onValueChange?.(ids);
  }

  const visible = useMemo(() => filterTree(items, filter.trim().toLowerCase()), [items, filter]);

  // Buscando, tudo abre: fechar o caminho ate o resultado esconde o resultado.
  const searching = filter.trim().length > 0;

  function toggleOpen(id: string) {
    const next = openIds.includes(id) ? openIds.filter((x) => x !== id) : [...openIds, id];
    if (!expanded) setInternalOpenIds(next);
    onExpandedChange?.(next);
  }

  function toggleSelect(node: TreeNode) {
    const leaves = leavesOf(node);

    if (!multiple) {
      // Sem multipla, so folha escolhe, e a escolha troca em vez de somar.
      if (node.children?.length) return;
      change(picked.includes(node.id) ? [] : [node.id]);
      return;
    }

    const allChecked = leaves.every((leaf) => picked.includes(leaf));
    const withoutLeaves = picked.filter((id) => !leaves.includes(id));
    change(allChecked ? withoutLeaves : [...withoutLeaves, ...leaves]);
  }

  /**
   * Setas andam pelas linhas que estao na tela, e nao pela arvore inteira: a
   * navegacao segue o que o olho ve.
   */
  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    // O handler de quem chama corre primeiro, e desiste da navegacao daqui com
    // `preventDefault`. Sem isso o espalhamento tinha que escolher um dos dois:
    // ou o `onKeyDown` de fora apaga as setas da arvore, ou as setas o apagam.
    onKeyDownProp?.(event);
    if (event.defaultPrevented) return;

    const rows = [...(root.current?.querySelectorAll<HTMLElement>("[role=treeitem]") ?? [])];
    const current = document.activeElement as HTMLElement | null;
    const index = rows.findIndex((row) => row === current);
    if (index < 0) return;

    const id = rows[index]!.dataset.id!;
    const node = findNode(visible, id);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = rows[index + (event.key === "ArrowDown" ? 1 : -1)];
      next?.focus();
    } else if (event.key === "ArrowRight" && node?.children?.length) {
      event.preventDefault();
      if (!openIds.includes(id)) toggleOpen(id);
      else rows[index + 1]?.focus();
    } else if (event.key === "ArrowLeft") {
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
      className={cn("flex flex-col", className)}
    >
      {visible.map((node, index) => (
        <Branch
          key={node.id}
          node={node}
          level={0}
          isFirst={index === 0}
          openIds={searching ? null : openIds}
          picked={picked}
          multiple={multiple}
          onToggleOpen={toggleOpen}
          onToggleSelect={toggleSelect}
        />
      ))}
    </ul>
  );
}

function Branch({
  node,
  level,
  isFirst,
  openIds,
  picked,
  multiple,
  onToggleOpen,
  onToggleSelect,
}: {
  node: TreeNode;
  level: number;
  isFirst: boolean;
  /** `null` quer dizer tudo aberto, que e o estado da busca. */
  openIds: string[] | null;
  picked: string[];
  multiple?: boolean;
  onToggleOpen: (id: string) => void;
  onToggleSelect: (node: TreeNode) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isOpen = openIds === null || openIds.includes(node.id);
  const leaves = leavesOf(node);
  const checkedLeaves = leaves.filter((leaf) => picked.includes(leaf)).length;
  const full = checkedLeaves > 0 && checkedLeaves === leaves.length;
  const mixed = checkedLeaves > 0 && !full;

  return (
    <li>
      <div
        role="treeitem"
        data-id={node.id}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-selected={full}
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
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={isOpen ? "Fechar" : "Abrir"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleOpen(node.id);
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
            checked={full}
            indeterminate={mixed}
            disabled={node.disabled}
            tabIndex={-1}
            aria-hidden="true"
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={() => onToggleSelect(node)}
          />
        )}

        {/*
          * O nome do no chega em `items` e ainda perde largura para cada nivel
          * de indentacao, entao o corte aparece cedo. O `title` e a unica
          * saida para quem enxerga - nada mais na tela mostra o nome inteiro.
          * Sem `aria-label`: o texto segue no DOM e o leitor de tela ja o le.
          */}
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
              isFirst={false}
              openIds={openIds}
              picked={picked}
              multiple={multiple}
              onToggleOpen={onToggleOpen}
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
function filterTree(items: TreeNode[], query: string): TreeNode[] {
  if (!query) return items;

  return items.flatMap((node) => {
    const children = node.children ? filterTree(node.children, query) : [];
    if (text(node).includes(query)) return [node];
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
