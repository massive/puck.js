export const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};

export function blink(led: Pin, duration: number) {
  let intervals: Map<Pin, NodeJS.Timeout> = new Map<Pin, NodeJS.Timeout>();

  return function() {
    let on = false;
    const interval = setInterval(function() {
      on = !on;
      led.write(on)
    }, 200);
    intervals.set(led, interval);
    setTimeout(() => {
      if (intervals.get(led)) clearInterval(intervals.get(led));
    }, duration)
  }
}
