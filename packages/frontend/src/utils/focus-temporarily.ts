/** Focuses an element that takes no focus of its own, such as a card, without
 * leaving it a tab stop: a lasting tabindex would also focus it on every click
 * inside it */
export function focusTemporarily(element: HTMLElement) {
  element.tabIndex = -1;
  element.addEventListener('blur', () => element.removeAttribute('tabindex'), {
    once: true,
  });
  element.focus();
}
