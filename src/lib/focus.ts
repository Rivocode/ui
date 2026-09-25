export function focusIsLost(target: Element | null): boolean {
  if (!target) return true;
  if (target === target.ownerDocument.body) return true;
  if (!target.isConnected) return true;
  return (target as Partial<HTMLButtonElement>).disabled === true;
}

const FOCUSABLE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/;

export function focusLandmark(target: HTMLElement): void {
  const reachable = target.hasAttribute("tabindex") || FOCUSABLE.test(target.tagName);
  if (!reachable) {
    target.setAttribute("tabindex", "-1");
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }
  target.focus({ preventScroll: true });
}
