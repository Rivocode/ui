export type Scheduled<Args extends unknown[]> = {
  run: (...args: Args) => void;
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
};

export function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number | (() => number),
): Scheduled<Args> {
  const delay = () => (typeof wait === "function" ? wait() : wait);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting: Args | undefined;

  const fire = () => {
    const args = waiting;
    timer = undefined;
    waiting = undefined;
    if (args) callback(...args);
  };

  return {
    run: (...args) => {
      waiting = args;
      clearTimeout(timer);
      timer = setTimeout(fire, delay());
    },
    cancel: () => {
      clearTimeout(timer);
      timer = undefined;
      waiting = undefined;
    },
    flush: () => {
      clearTimeout(timer);
      fire();
    },
    isPending: () => timer !== undefined,
  };
}

export function throttle<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number | (() => number),
): Scheduled<Args> {
  const delay = () => (typeof wait === "function" ? wait() : wait);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting: Args | undefined;

  const release = () => {
    const args = waiting;
    waiting = undefined;
    if (!args) {
      timer = undefined;
      return;
    }
    callback(...args);
    timer = setTimeout(release, delay());
  };

  return {
    run: (...args) => {
      if (timer === undefined) {
        callback(...args);
        timer = setTimeout(release, delay());
        return;
      }
      waiting = args;
    },
    cancel: () => {
      clearTimeout(timer);
      timer = undefined;
      waiting = undefined;
    },
    flush: () => {
      const args = waiting;
      clearTimeout(timer);
      timer = undefined;
      waiting = undefined;
      if (args) callback(...args);
    },
    isPending: () => waiting !== undefined,
  };
}
