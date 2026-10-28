import { describe, expect, it } from 'vitest';
import { describeShortcut } from './describe-shortcut';

describe('describeShortcut', () => {
  it('names Mod as Ctrl off Apple devices', () => {
    expect(describeShortcut('Mod-b', false)).toEqual({
      text: 'Ctrl+B',
      aria: 'Control+B',
    });
    expect(describeShortcut('Mod-Shift-s', false)).toEqual({
      text: 'Ctrl+Shift+S',
      aria: 'Control+Shift+S',
    });
  });

  it('names Mod as ⌘ on Apple devices, with the symbols in the menu order', () => {
    expect(describeShortcut('Mod-b', true)).toEqual({
      text: '⌘B',
      aria: 'Meta+B',
    });
    expect(describeShortcut('Mod-Alt-1', true)).toEqual({
      text: '⌥⌘1',
      aria: 'Meta+Alt+1',
    });
    expect(describeShortcut('Mod-Shift-8', true)).toEqual({
      text: '⇧⌘8',
      aria: 'Meta+Shift+8',
    });
  });
});
