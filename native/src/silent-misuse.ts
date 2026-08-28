import { useEffect } from "react";

export function useSilentMisuse(wrong: boolean, message: string, after = 0) {
  useEffect(() => {
    if (!wrong || !__DEV__) return;
    if (after === 0) {
      console.warn(message);
      return;
    }

    const waiting = setTimeout(() => console.warn(message), after);
    return () => clearTimeout(waiting);
  }, [wrong, message, after]);
}
