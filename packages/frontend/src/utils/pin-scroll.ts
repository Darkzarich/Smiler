const READER_INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

/** Scrolls the window to `top()` and keeps it there while the page changes size,
 * until the reader scrolls or clicks themselves, `duration` ms pass or `signal`
 * aborts. Post pictures reserve no space and are lazy, so a single scroll lands
 * short: the page is still too short to reach the target, and every picture
 * that loads above it pushes it further down.
 */
export function pinScroll(
  top: () => number,
  duration: number,
  signal: AbortSignal,
) {
  if (signal.aborted) {
    return;
  }

  const stop = () => {
    observer.disconnect();
    clearTimeout(timer);
    signal.removeEventListener('abort', stop);

    for (const type of READER_INPUT) {
      window.removeEventListener(type, stop, { capture: true });
    }
  };

  // Observing starts with a callback, which makes the first scroll
  const observer = new ResizeObserver(() => window.scrollTo({ top: top() }));
  const timer = setTimeout(stop, duration);

  signal.addEventListener('abort', stop);

  for (const type of READER_INPUT) {
    window.addEventListener(type, stop, { capture: true, passive: true });
  }

  observer.observe(document.body);
}
