"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { inputVariants } from "./field";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { leavesOf, Tree, type TreeNode } from "./tree";

export type TreeSelectProps = Omit<ComponentProps<"button">, "value" | "onChange"> & {
  items: TreeNode[];
  /** Ids das folhas escolhidas. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (ids: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  /** Mostra o campo de busca dentro do painel. */
  searchable?: boolean;
  size?: "sm" | "md" | "lg";
};

/**
 * Escolha dentro de uma arvore: setor e equipe, categoria e subcategoria,
 * conta e centro de custo.
 *
 * O gatilho resume em vez de listar. Com muitas folhas marcadas, os nomes nao
 * cabem, e uma linha cortada no meio de um nome diz menos do que "7
 * escolhidos". Ate tres, os nomes aparecem, porque ai eles cabem e dizem mais.
 */
export function TreeSelect({
  items,
  value,
  defaultValue = [],
  onValueChange,
  multiple = true,
  placeholder = "Escolha",
  searchable = true,
  size,
  className,
  disabled,
  ...props
}: TreeSelectProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const selected = controlled ? value : internal;

  const [busca, setBusca] = useState("");

  const names = useMemo(() => namesOf(items, selected), [items, selected]);
  // A conta e sempre sobre as folhas que existem na arvore, e nunca sobre a
  // lista crua: id que sobrou de uma arvore antiga contaria como escolha e o
  // gatilho mentiria o numero.
  const label =
    names.length === 0
      ? placeholder
      : names.length <= 3
        ? names.join(", ")
        : `${names.length} escolhidos`;

  return (
    <Popover onOpenChange={(isOpen) => !isOpen && setBusca("")}>
      <PopoverTrigger
        render={
          <button
            {...props}
            type="button"
            disabled={disabled}
            className={cn(
              inputVariants({ size }),
              "flex items-center justify-between gap-2 text-left",
              names.length === 0 && "text-fg-subtle",
              className,
            )}
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-fg-subtle" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-2">
        {searchable && (
          <div className="relative mb-2">
            <Search
              size={14}
              aria-hidden="true"
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-subtle"
            />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar"
              aria-label="Buscar na arvore"
              className={cn(inputVariants({ size: "sm" }), "pl-8")}
            />
          </div>
        )}

        <div className="max-h-72 overflow-y-auto">
          <Tree
            items={items}
            selected={selected}
            multiple={multiple}
            filter={busca}
            onSelectedChange={(ids) => {
              if (!controlled) setInternal(ids);
              onValueChange?.(ids);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Os nomes das folhas marcadas, na ordem em que aparecem na arvore. */
function namesOf(items: TreeNode[], ids: string[]): string[] {
  const output: string[] = [];

  function andar(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (!node.children?.length && ids.includes(node.id)) {
        output.push(typeof node.label === "string" ? node.label : node.id);
      }
      if (node.children) andar(node.children);
    }
  }

  andar(items);
  return output;
}

export { leavesOf };
export type { TreeNode };
