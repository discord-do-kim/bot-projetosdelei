export function interval(
  callback: (clear: (...args: unknown[]) => unknown, iterations: number) => void,
  ms = 1000
) {
  return new Promise<void>((resolve) => {
    function clear() {
      clearInterval(id);
      return resolve();
    }

    let counter = 0;

    const id = setInterval(() => {
      callback(clear, counter);
      counter++;
    }, ms);
  });
}
