"use client";

import { useEffect, useState } from "react";

import { useLatest } from "./common/latest";

export type UseIntersectionOptions = {
  /** O elemento que rola. Sem ele, a janela. */
  root?: Element | null;
  /** Folga em volta da raiz, na sintaxe de `margin`: `"200px"` avisa antes de o alvo aparecer. */
  rootMargin?: string;
  /** Quanto do alvo precisa estar visivel, de 0 a 1, para contar. */
  threshold?: number | number[];
};

export type IntersectionResult<T extends Element> = {
  ref: (node: T | null) => void;
  entry: IntersectionObserverEntry | null;
};

export function useIntersection<T extends Element = Element>(
  options: UseIntersectionOptions = {},
): IntersectionResult<T> {
  const { root = null, rootMargin, threshold } = options;
  const [node, setNode] = useState<T | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const thresholds = JSON.stringify(threshold ?? 0);

  useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) setEntry(last);
      },
      { root, rootMargin, threshold: JSON.parse(thresholds) as number | number[] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, root, rootMargin, thresholds]);

  return { ref: setNode, entry };
}

export type UseInfiniteScrollOptions = {
  /** Pede a proxima pagina. Chamado quando a sentinela entra na folga e ha mais para buscar. */
  onLoadMore: () => void;
  /** Se ainda ha pagina depois desta. Com `false` a sentinela para de ser observada. */
  hasMore: boolean;
  /** Se uma pagina esta a caminho. Enquanto for `true`, nada novo e pedido. */
  loading: boolean;
  /** O elemento que rola. Sem ele, a janela. */
  root?: Element | null;
  /** Quanto antes do fim a proxima pagina e pedida, na sintaxe de `margin`. */
  rootMargin?: string;
};

export function useInfiniteScroll<T extends Element = HTMLDivElement>(
  options: UseInfiniteScrollOptions,
): { sentinelRef: (node: T | null) => void } {
  const { onLoadMore, hasMore, loading, root = null, rootMargin = "200px" } = options;
  const [node, setNode] = useState<T | null>(null);
  const latest = useLatest(onLoadMore);

  useEffect(() => {
    if (!node || !hasMore || loading || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) latest.current();
      },
      { root, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, hasMore, loading, root, rootMargin, latest]);

  return { sentinelRef: setNode };
}
