"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";
import { Kbd } from "./kbd";

export type CommandItem = {
  /** Identidade da acao. Precisa ser estavel entre buscas. */
  id: string;
  label: string;
  /** Linha de apoio, para quando o rotulo sozinho nao decide. */
  description?: string;
  icon?: ReactNode;
  /** Atalho proprio da acao, como `"mod+n"`. So mostra; nao registra nada. */
  shortcut?: string;
  /**
   * Outras palavras que acham este item. "nf", "fatura" e "boleto" levando a
   * Notas fiscais e o que separa uma paleta util de uma que so acha quem ja
   * sabe o nome exato.
   */
  keywords?: string;
  disabled?: boolean;
  onSelect: () => void;
};

export type CommandGroup = {
  label?: string;
  items: CommandItem[];
};

export type CommandProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  /** Texto de quando a busca nao acha nada. */
  emptyMessage?: string;
  /**
   * Atalho que abre, combinado com Ctrl ou Cmd. `null` desliga, para quem
   * prefere registrar o atalho na propria aplicacao.
   */
  shortcut?: string | null;
  /** Titulo lido pelo leitor de tela. A paleta nao tem titulo visivel. */
  title?: string;
};

/** Tira acento e caixa, para "Notas" achar "notas" e "Sao" achar "são". */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * A paleta de comandos: um campo, uma lista e o teclado.
 *
 * Ela existe para quem trabalha o dia inteiro na mesma tela e ja sabe para
 * onde quer ir. Navegar por menu custa tres cliques e a memoria de onde a
 * opcao mora; aqui custa o nome da coisa.
 *
 * ```tsx
 * <Command
 *   open={aberta}
 *   onOpenChange={setAberta}
 *   groups={[{ label: "Ir para", items: [{ id: "notas", label: "Notas fiscais", onSelect: ir }] }]}
 * />
 * ```
 *
 * A busca ignora acento e caixa, e le tambem as `keywords` do item. Sem isso a
 * paleta so serve para quem escreve o rotulo exato, que e justamente quem
 * menos precisa dela.
 */
export function Command({
  open,
  onOpenChange,
  groups,
  placeholder = "Buscar comando",
  emptyMessage = "Nada com esse nome",
  shortcut = "k",
  title = "Paleta de comandos",
}: CommandProps) {
  const { portalContainer } = useRivoContext();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === shortcut && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut, open, onOpenChange]);

  // Cada abertura comeca limpa. Uma paleta que guarda a busca da vez passada
  // abre mostrando o resultado de outra pergunta.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const matches = useMemo(() => {
    const termo = normalize(query.trim());
    if (!termo) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          normalize(`${item.label} ${item.description ?? ""} ${item.keywords ?? ""}`).includes(
            termo,
          ),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  /** A lista achatada, que e a ordem em que a seta anda. */
  const reachable = useMemo(
    () => matches.flatMap((group) => group.items).filter((item) => !item.disabled),
    [matches],
  );

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(0, reachable.length - 1)));
  }, [reachable.length]);

  // Traz o item escolhido para a vista quando a seta passa dele.
  useEffect(() => {
    const picked = reachable[active];
    if (!picked || !list.current) return;
    list.current
      .querySelector(`[data-id="${CSS.escape(picked.id)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, reachable]);

  function pick(item: CommandItem) {
    onOpenChange(false);
    item.onSelect();
  }

  function onFieldKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (reachable.length ? (current + 1) % reachable.length : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (reachable.length ? (current - 1 + reachable.length) % reachable.length : 0));
      return;
    }

    if (event.key === "Enter") {
      const picked = reachable[active];
      if (picked) {
        event.preventDefault();
        pick(picked);
      }
    }
  }

  const idDoAtivo = reachable[active]?.id;

  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal container={portalContainer ?? undefined}>
        <BaseDialog.Backdrop
          className={cn(
            "fixed inset-0 z-[var(--rc-z-overlay)] bg-overlay",
            "transition-opacity duration-[var(--rc-duration-base)] ease-[var(--rc-ease)]",
          )}
        />
        <BaseDialog.Popup
          className={cn(
            "fixed left-1/2 z-[var(--rc-z-dialog)] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2",
            // Um pouco acima do meio: a lista cresce para baixo, e centralizada
            // de verdade ela empurra o campo para fora do olhar a cada letra.
            "top-[12vh]",
            "overflow-hidden rounded-xl border border-border bg-surface shadow-3",
            "font-sans text-fg outline-none",
            "max-sm:top-0 max-sm:left-0 max-sm:w-full max-sm:translate-x-0 max-sm:rounded-none",
          )}
        >
          <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>

          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search size={16} aria-hidden="true" className="shrink-0 text-fg-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onFieldKeyDown}
              placeholder={placeholder}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={idDoAtivo ? `${listId}-${idDoAtivo}` : undefined}
              className={cn(
                "h-12 w-full bg-transparent font-sans text-base text-fg",
                "placeholder:text-fg-subtle outline-none",
              )}
            />
          </div>

          <div
            ref={list}
            id={listId}
            role="listbox"
            aria-label={title}
            className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5"
          >
            {reachable.length === 0 && (
              <p className="px-2.5 py-8 text-center text-sm text-fg-subtle">{emptyMessage}</p>
            )}

            {matches.map((group, index) => (
              <div key={group.label ?? index} role="group" aria-label={group.label}>
                {group.label && (
                  <p className="px-2.5 pt-2 pb-1 font-mono text-xs tracking-[0.04em] text-fg-subtle uppercase">
                    {group.label}
                  </p>
                )}

                {group.items.map((item) => {
                  const picked = item.id === idDoAtivo;

                  return (
                    <div
                      key={item.id}
                      id={`${listId}-${item.id}`}
                      data-id={item.id}
                      role="option"
                      aria-selected={picked}
                      aria-disabled={item.disabled || undefined}
                      onClick={() => !item.disabled && pick(item)}
                      onMouseMove={() => {
                        const position = reachable.indexOf(item);
                        if (position !== -1) setActive(position);
                      }}
                      className={cn(
                        "flex cursor-default items-center gap-2.5 rounded-md px-2.5",
                        "py-[var(--rc-item-y)] text-base",
                        picked ? "bg-accent-subtle text-fg" : "text-fg-muted",
                        item.disabled && "text-fg-disabled",
                      )}
                    >
                      {item.icon && (
                        <span className="flex size-4 shrink-0 items-center text-fg-subtle">
                          {item.icon}
                        </span>
                      )}

                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{item.label}</span>
                        {item.description && (
                          <span className="block truncate text-xs text-fg-subtle">
                            {item.description}
                          </span>
                        )}
                      </span>

                      {item.shortcut && <Kbd size="sm" keys={item.shortcut} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
