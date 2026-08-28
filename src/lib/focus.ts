export function focusIsLost(target: Element | null): boolean {
  if (!target) return true;
  if (target === target.ownerDocument.body) return true;
  if (!target.isConnected) return true;
  return (target as Partial<HTMLButtonElement>).disabled === true;
}
