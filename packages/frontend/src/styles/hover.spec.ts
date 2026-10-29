import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import postcss, { AtRule, type Node, type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';

const src = path.resolve(import.meta.dirname, '..');

function stylesOf(file: string) {
  const source = readFileSync(path.join(src, file), 'utf8');

  if (file.endsWith('.css')) {
    return [source];
  }

  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    ([, css]) => css,
  );
}

function isInsideHoverMedia(rule: Rule) {
  for (let node: Node | undefined = rule.parent; node; node = node.parent) {
    if (
      node instanceof AtRule &&
      node.name === 'media' &&
      node.params.includes('--hover')
    ) {
      return true;
    }
  }

  return false;
}

describe('Hover styles', () => {
  it('Sit inside @media (--hover), so a tap on a touch screen does not leave them on', () => {
    const outside: string[] = [];

    for (const file of globSync('**/*.{vue,css}', { cwd: src })) {
      for (const css of stylesOf(file)) {
        postcss.parse(css).walkRules((rule) => {
          if (rule.selector.includes(':hover') && !isInsideHoverMedia(rule)) {
            outside.push(`${file}: ${rule.selector}`);
          }
        });
      }
    }

    expect(outside).toEqual([]);
  });
});
