const DRAG_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);

type PopupKeyEvent = {
  key: string;
  target: EventTarget | null;
  preventBaseUIHandler?: () => void;
};

export function passDragKeys(event: PopupKeyEvent) {
  if (!DRAG_KEYS.has(event.key)) return;
  const target = event.target as Element | null;
  if (target?.closest?.('[aria-roledescription][aria-pressed="true"]'))
    event.preventBaseUIHandler?.();
}
