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

interface PinMap {
  [key: number]: NodeJS.Timeout;
}

export function ledOnOff(led: Pin, duration = 500) {
  led.write(true);
  setTimeout(() => led.write(false), duration);
}

export function blink(led: Pin, duration: number): void {
  let intervals: PinMap = {};
  // @ts-ignore
  const pinId: number = led.getInfo().num;

  const fn = () => {
    let on = false;
    const interval = setInterval(() => {
      on = !on;
      led.write(on)
    }, 500);

    intervals[pinId] = interval;
    setTimeout(() => {
      const i = intervals[pinId];
      if (i) clearInterval(i);
    }, duration)
  }
  fn();
}
