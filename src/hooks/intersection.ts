"use client";

import { useEffect, useState } from "react";

import { useLatest } from "./common/latest";

export type UseIntersectionOptions = {
  /** The scrolling element. Without it, the window. */
  root?: Element | null;
  /** Slack around the root, in `margin` syntax: `"200px"` notifies before the target appears. */
  rootMargin?: string;
  /** How much of the target needs to be visible, from 0 to 1, to count. */
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
  /**
   * Asks for the next page. Called when the sentinel enters the slack and there is more to fetch.
   */
  onLoadMore: () => void;
  /**
   * Whether there is still a page after this one. With `false` the sentinel stops being observed.
   */
  hasMore: boolean;
  /** Whether a page is on its way. While it is `true`, nothing new is requested. */
  loading: boolean;
  /** The scrolling element. Without it, the window. */
  root?: Element | null;
  /** How far before the end the next page is requested, in `margin` syntax. */
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
