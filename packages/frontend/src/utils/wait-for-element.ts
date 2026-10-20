/** Resolves with the element once it is in the document, or with `null` after
 * `timeout` ms. Views render most of their content only after a fetch, so an
 * element a URL hash points to is often not there yet when the route changes.
 */
export function waitForElementById(
  id: string,
  timeout: number,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const existing = document.getElementById(id);

    if (existing) {
      resolve(existing);
      return;
    }

    const finish = (el: HTMLElement | null) => {
      observer.disconnect();
      clearTimeout(timer);
      resolve(el);
    };

    const observer = new MutationObserver(() => {
      const el = document.getElementById(id);

      if (el) {
        finish(el);
      }
    });

    const timer = setTimeout(() => finish(null), timeout);

    observer.observe(document.body, { childList: true, subtree: true });
  });
}
