import { useEffect, useRef } from "react";

export function useArrivals(keys: readonly string[]): (key: string) => boolean {
  const seen = useRef(new Map<string, boolean>());
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
  }, []);

  useEffect(() => {
    for (const key of seen.current.keys()) {
      if (!keys.includes(key)) seen.current.delete(key);
    }
  });

  return (key) => {
    const known = seen.current.get(key);
    if (known !== undefined) return known;
    const arrived = mounted.current;
    seen.current.set(key, arrived);
    return arrived;
  };
}
