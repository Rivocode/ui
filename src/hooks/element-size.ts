"use client";

import { useEffect, useState } from "react";

export type ElementSize<T extends Element> = {
  ref: (node: T | null) => void;
  width: number;
  height: number;
};

export function useElementSize<T extends Element = HTMLDivElement>(): ElementSize<T> {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[entries.length - 1]?.contentRect;
      if (!rect) return;
      setSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref: setNode, width: size.width, height: size.height };
}
