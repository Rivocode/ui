"use client";

import { useEffect } from "react";

export function InertBackground({
  container,
  below = [],
}: {
  container: HTMLElement | null;
  below?: readonly string[];
}) {
  const key = below.join("\n");

  useEffect(() => {
    if (!container) return;

    const portal = container;
    const body = portal.ownerDocument.body;
    const marked = new Set<Element>();

    function sweep() {
      const lower = key ? key.split("\n") : [];
      const opener = (child: Element) =>
        [child, ...Array.from(child.querySelectorAll("[data-rc-layer]"))].some((node) =>
          lower.includes(node.getAttribute("data-rc-layer") ?? ""),
        );
      const candidates = new Set([
        ...Array.from(body.children),
        ...Array.from(portal.children).filter(opener),
        ...marked,
      ]);

      for (const child of candidates) {
        if (child === container) continue;

        if (child.getAttribute("aria-hidden") !== "true") {
          if (marked.has(child)) {
            child.removeAttribute("inert");
            marked.delete(child);
          }
          continue;
        }

        if (marked.has(child) || child.hasAttribute("inert")) continue;

        child.setAttribute("inert", "");
        marked.add(child);
      }
    }

    sweep();

    const watcher = new MutationObserver(sweep);
    watcher.observe(body, { attributes: true, attributeFilter: ["aria-hidden"], subtree: true });

    return () => {
      watcher.disconnect();
      for (const child of marked) child.removeAttribute("inert");
    };
  }, [container, key]);

  return null;
}
