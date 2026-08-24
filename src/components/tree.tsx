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
  const raiz = useRef<HTMLUListElement>(null);

  const visiveis = useMemo(() => filtrar(items, filter.trim().toLowerCase()), [items, filter]);

  // Buscando, tudo abre: fechar o caminho ate o resultado esconde o resultado.
  const buscando = filter.trim().length > 0;

  function alternarAberto(id: string) {
    const novo = abertos.includes(id) ? abertos.filter((x) => x !== id) : [...abertos, id];
    if (!expanded) setAbertosInternos(novo);
    onExpandedChange?.(novo);
  }

  function alternarEscolha(no: TreeNode) {
    const folhas = leavesOf(no);

    if (!multiple) {
      // Sem multipla, so folha escolhe, e a escolha troca em vez de somar.
      if (no.children?.length) return;
      onSelectedChange(selected.includes(no.id) ? [] : [no.id]);
      return;
    }

    const todasMarcadas = folhas.every((folha) => selected.includes(folha));
    const semAsFolhas = selected.filter((id) => !folhas.includes(id));
    onSelectedChange(todasMarcadas ? semAsFolhas : [...semAsFolhas, ...folhas]);
  }

  /**
   * Setas andam pelas linhas que estao na tela, e nao pela arvore inteira: a
   * navegacao segue o que o olho ve.
   */
  function aoTeclar(evento: KeyboardEvent<HTMLUListElement>) {
    const linhas = [...(raiz.current?.querySelectorAll<HTMLElement>("[role=treeitem]") ?? [])];
    const atual = document.activeElement as HTMLElement | null;
    const indice = linhas.findIndex((linha) => linha === atual);
    if (indice < 0) return;

    const id = linhas[indice]!.dataset.id!;
    const no = achar(visiveis, id);

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      const proximo = linhas[indice + (evento.key === "ArrowDown" ? 1 : -1)];
      proximo?.focus();
    } else if (evento.key === "ArrowRight" && no?.children?.length) {
      evento.preventDefault();
      if (!abertos.includes(id)) alternarAberto(id);
      else linhas[indice + 1]?.focus();
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      if (no?.children?.length && abertos.includes(id)) alternarAberto(id);
      else {
        const pai = paiDe(visiveis, id);
        if (pai) raiz.current?.querySelector<HTMLElement>(`[data-id="${pai.id}"]`)?.focus();
      }
    } else if (evento.key === " " || evento.key === "Enter") {
      evento.preventDefault();
      if (no) alternarEscolha(no);
    }
  }

  return (
    <ul
      ref={raiz}
      role="tree"
      aria-multiselectable={multiple || undefined}
      onKeyDown={aoTeclar}
      className={cn("flex flex-col", className)}
    >
      {visiveis.map((no, indice) => (
        <Ramo
          key={no.id}
          no={no}
          nivel={0}
          primeiro={indice === 0}
          abertos={buscando ? null : abertos}
          selected={selected}
          multiple={multiple}
          onAlternarAberto={alternarAberto}
          onAlternarEscolha={alternarEscolha}
        />
      ))}
    </ul>
  );
}

function Ramo({
  no,
  nivel,
  primeiro,
  abertos,
  selected,
  multiple,
  onAlternarAberto,
  onAlternarEscolha,
}: {
  no: TreeNode;
  nivel: number;
  primeiro: boolean;
  /** `null` quer dizer tudo aberto, que e o estado da busca. */
  abertos: string[] | null;
  selected: string[];
  multiple?: boolean;
  onAlternarAberto: (id: string) => void;
  onAlternarEscolha: (no: TreeNode) => void;
}) {
  const temFilhos = Boolean(no.children?.length);
  const aberto = abertos === null || abertos.includes(no.id);
  const folhas = leavesOf(no);
  const marcadas = folhas.filter((folha) => selected.includes(folha)).length;
  const cheio = marcadas > 0 && marcadas === folhas.length;
  const misto = marcadas > 0 && !cheio;

  return (
    <li>
      <div
        role="treeitem"
        data-id={no.id}
        aria-expanded={temFilhos ? aberto : undefined}
        aria-selected={cheio}
        aria-disabled={no.disabled || undefined}
        tabIndex={primeiro && nivel === 0 ? 0 : -1}
        onClick={() => !no.disabled && onAlternarEscolha(no)}
        style={{ paddingLeft: `${nivel * 1.25 + 0.25}rem` }}
        className={cn(
          "flex cursor-default items-center gap-2 rounded-sm py-[var(--rc-item-y)] pr-2",
          "text-base text-fg outline-none select-none",
          "hover:bg-accent-subtle focus-visible:ring-2 focus-visible:ring-ring",
          no.disabled && "cursor-not-allowed text-fg-disabled hover:bg-transparent",
        )}
      >
        {temFilhos ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={aberto ? "Fechar" : "Abrir"}
            onClick={(evento) => {
              evento.stopPropagation();
              onAlternarAberto(no.id);
            }}
            className="flex size-4 shrink-0 items-center justify-center text-fg-subtle"
          >
            <ChevronRight
              size={14}
              aria-hidden="true"
              className={cn(
                "transition-transform duration-[var(--rc-duration-fast)] ease-rc",
                aberto && "rotate-90",
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
            disabled={no.disabled}
            tabIndex={-1}
            aria-hidden="true"
            onClick={(evento) => evento.stopPropagation()}
            onCheckedChange={() => onAlternarEscolha(no)}
          />
        )}

        <span className="flex-1 truncate">{no.label}</span>
      </div>

      {temFilhos && aberto && (
        <ul role="group" className="flex flex-col">
          {no.children!.map((filho) => (
            <Ramo
              key={filho.id}
              no={filho}
              nivel={nivel + 1}
              primeiro={false}
              abertos={abertos}
              selected={selected}
              multiple={multiple}
              onAlternarAberto={onAlternarAberto}
              onAlternarEscolha={onAlternarEscolha}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Todas as folhas debaixo de um no. Um no sem filhos e a propria folha. */
export function leavesOf(no: TreeNode): string[] {
  if (!no.children?.length) return [no.id];
  return no.children.flatMap(leavesOf);
}

function texto(no: TreeNode): string {
  return (no.search ?? (typeof no.label === "string" ? no.label : "")).toLowerCase();
}

/** Mantem quem casou e o caminho ate ele. */
function filtrar(items: TreeNode[], busca: string): TreeNode[] {
  if (!busca) return items;

  return items.flatMap((no) => {
    const filhos = no.children ? filtrar(no.children, busca) : [];
    if (texto(no).includes(busca)) return [no];
    if (filhos.length) return [{ ...no, children: filhos }];
    return [];
  });
}

function achar(items: TreeNode[], id: string): TreeNode | undefined {
  for (const no of items) {
    if (no.id === id) return no;
    const dentro = no.children ? achar(no.children, id) : undefined;
    if (dentro) return dentro;
  }
  return undefined;
}

function paiDe(items: TreeNode[], id: string, pai?: TreeNode): TreeNode | undefined {
  for (const no of items) {
    if (no.id === id) return pai;
    const dentro = no.children ? paiDe(no.children, id, no) : undefined;
    if (dentro) return dentro;
  }
  return undefined;
}
