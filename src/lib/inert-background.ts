"use client";

import { useEffect } from "react";

export function InertBackground({ container }: { container: HTMLElement | null }) {
  useEffect(() => {
    if (!container) return;

    const body = container.ownerDocument.body;
    const marked = new Set<Element>();

    function sweep() {
      for (const child of Array.from(body.children)) {
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
  }, [container]);

  return null;
}
