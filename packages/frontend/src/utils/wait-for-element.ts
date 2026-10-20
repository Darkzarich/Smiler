/** Resolves with the element once it is in the document, or with `null` when
 * `signal` aborts. Views render most of their content only after a fetch, so an
 * element a URL hash points to is often not there yet when the route changes,
 * and on a slow network not for a good while.
 */
export function waitForElementById(
  id: string,
  signal: AbortSignal,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const existing = document.getElementById(id);

    if (existing || signal.aborted) {
      resolve(existing);
      return;
    }

    const finish = (el: HTMLElement | null) => {
      observer.disconnect();
      signal.removeEventListener('abort', onAbort);
      resolve(el);
    };

    const onAbort = () => finish(null);

    const observer = new MutationObserver(() => {
      const el = document.getElementById(id);

      if (el) {
        finish(el);
      }
    });

    signal.addEventListener('abort', onAbort);
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
