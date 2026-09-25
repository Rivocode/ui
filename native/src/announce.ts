import { isValidElement, useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, Platform } from "react-native";

export type AnnounceOptions = {
  liveRegion?: boolean;
};

export type UseAnnounceOptions = AnnounceOptions & {
  onMount?: boolean;
  fromSilence?: boolean;
};

export function announce(message: string | null | undefined, options: AnnounceOptions = {}) {
  if (!message) return;
  if (options.liveRegion && Platform.OS !== "ios") return;
  AccessibilityInfo.announceForAccessibility(message);
}

export function useAnnounce(message: string | null | undefined, options: UseAnnounceOptions = {}) {
  const previous = useRef(options.onMount ? null : message);
  const { liveRegion, fromSilence = true } = options;

  useEffect(() => {
    const before = previous.current;
    previous.current = message;
    if (!message || message === before) return;
    if (!before && !fromSilence) return;
    announce(message, { liveRegion });
  }, [message, liveRegion, fromSilence]);
}

export function spokenSentence(...parts: (string | null | undefined)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .reduce((said, part) => (said === "" ? part : `${said}${/[.!?:;…]$/.test(said) ? "" : "."} ${part}`), "");
}

export function spokenText(node: ReactNode): string | null {
  const found: string[] = [];
  let waiting = false;

  const visit = (child: ReactNode) => {
    if (waiting || child === null || child === undefined || typeof child === "boolean") return;
    if (typeof child === "string" || typeof child === "number") {
      const said = String(child).trim();
      if (said) found.push(said);
      return;
    }
    if (Array.isArray(child)) {
      child.forEach(visit);
      return;
    }
    if (isValidElement<{ children?: ReactNode; streaming?: boolean }>(child)) {
      if (child.props.streaming === true) {
        waiting = true;
        return;
      }
      visit(child.props.children);
    }
  };

  visit(node);
  if (waiting) return null;
  return found.length > 0 ? found.join(" ") : null;
}
