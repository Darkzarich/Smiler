// The test prosemirror-keymap uses to bind `Mod`, so the name shown is the key the editor listens for
const isApple =
  typeof navigator !== 'undefined' &&
  /Mac|iP(hone|[oa]d)/.test(navigator.platform);

const appleSymbols: Record<string, string> = {
  Control: '⌃',
  Alt: '⌥',
  Shift: '⇧',
  Meta: '⌘',
};
const otherNames: Record<string, string> = {
  Control: 'Ctrl',
  Alt: 'Alt',
  Shift: 'Shift',
  Meta: 'Win',
};
// Apple's menus list modifiers in this order whatever order they were pressed in
const appleOrder = ['Control', 'Alt', 'Shift', 'Meta'];

/**
 * Turns a shortcut in tiptap's notation (`Mod-Shift-s`, where `Mod` is ⌘ on Apple devices and
 * Ctrl elsewhere) into what a tooltip shows (`⇧⌘S`, `Ctrl+Shift+S`) and the value of
 * `aria-keyshortcuts` (`Meta+Shift+S`, `Control+Shift+S`)
 */
export function describeShortcut(shortcut: string, apple = isApple) {
  const parts = shortcut.split('-');
  const key = parts.pop()!.toUpperCase();
  const modifiers = parts.map((part) =>
    part === 'Mod' ? (apple ? 'Meta' : 'Control') : part,
  );

  const text = apple
    ? appleOrder
        .filter((modifier) => modifiers.includes(modifier))
        .map((modifier) => appleSymbols[modifier])
        .join('') + key
    : [...modifiers.map((modifier) => otherNames[modifier]), key].join('+');

  return { text, aria: [...modifiers, key].join('+') };
}
