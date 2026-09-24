export type Hotkey = {
  key: string;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
};

const ALIASES: Record<string, string> = {
  esc: "escape",
  return: "enter",
  space: " ",
  spacebar: " ",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  del: "delete",
  plus: "+",
};

export function isApple(platform: string): boolean {
  return /mac|iphone|ipad|ipod/i.test(platform);
}

export function parseHotkey(combo: string, apple: boolean): Hotkey {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim());
  const hotkey: Hotkey = { key: "", alt: false, ctrl: false, meta: false, shift: false };

  parts.forEach((part, index) => {
    const last = index === parts.length - 1;
    if (part === "" && last) hotkey.key = "+";
    else if (part === "mod") hotkey[apple ? "meta" : "ctrl"] = true;
    else if (part === "ctrl" || part === "control") hotkey.ctrl = true;
    else if (part === "cmd" || part === "meta") hotkey.meta = true;
    else if (part === "alt" || part === "option") hotkey.alt = true;
    else if (part === "shift") hotkey.shift = true;
    else hotkey.key = ALIASES[part] ?? part;
  });

  return hotkey;
}

type KeyLike = Pick<KeyboardEvent, "key" | "code" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">;

function physicalKey(code: string): string | undefined {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit\d$/.test(code)) return code.slice(5);
  return undefined;
}

export function matchesHotkey(hotkey: Hotkey, event: KeyLike): boolean {
  if (
    event.altKey !== hotkey.alt ||
    event.ctrlKey !== hotkey.ctrl ||
    event.metaKey !== hotkey.meta ||
    event.shiftKey !== hotkey.shift
  ) {
    return false;
  }
  const key = (event.key ?? "").toLowerCase();
  return key === hotkey.key || physicalKey(event.code ?? "") === hotkey.key;
}

const NOT_TYPED = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NOT_TYPED.has(target.type);
  return target.getAttribute("role") === "textbox";
}
