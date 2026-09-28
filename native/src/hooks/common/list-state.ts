/* Gerado de src/hooks/common/list-state.ts por bun run gen:compartilhado. Nao editar. */

"use client";

import { useMemo, useState } from "react";

import {
  appendItems,
  insertItems,
  prependItems,
  removeItems,
  reorderItems,
  replaceItem,
  swapItems,
  updateItems,
} from "../../shared/list";

export type ListMove = { from: number; to: number };

export type ListHandlers<T> = {
  set: (list: T[]) => void;
  append: (...items: T[]) => void;
  prepend: (...items: T[]) => void;
  insert: (index: number, ...items: T[]) => void;
  remove: (...indices: number[]) => void;
  reorder: (move: ListMove) => void;
  swap: (move: ListMove) => void;
  replace: (index: number, item: T) => void;
  update: (
    update: (item: T, index: number) => T,
    when?: (item: T, index: number) => boolean,
  ) => void;
  filter: (keep: (item: T, index: number) => boolean) => void;
};

export function useListState<T>(initial: T[] = []): [T[], ListHandlers<T>] {
  const [list, setList] = useState<T[]>(initial);

  const handlers = useMemo<ListHandlers<T>>(
    () => ({
      set: (next) => setList(next),
      append: (...items) => setList((current) => appendItems(current, items)),
      prepend: (...items) => setList((current) => prependItems(current, items)),
      insert: (index, ...items) => setList((current) => insertItems(current, index, items)),
      remove: (...indices) => setList((current) => removeItems(current, indices)),
      reorder: ({ from, to }) => setList((current) => reorderItems(current, from, to)),
      swap: ({ from, to }) => setList((current) => swapItems(current, from, to)),
      replace: (index, item) => setList((current) => replaceItem(current, index, item)),
      update: (update, when) => setList((current) => updateItems(current, update, when)),
      filter: (keep) => setList((current) => current.filter(keep)),
    }),
    [],
  );

  return [list, handlers];
}
