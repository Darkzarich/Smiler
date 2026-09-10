import { useMediaQuery as useMediaQueryString } from '@vueuse/core';
import { effectScope } from 'vue';
import type { ComputedRef } from 'vue';
import mediaDefinitions from '@/styles/media.css?raw';

export type Breakpoint =
  | 'phone-only'
  | 'tablet-portrait-up'
  | 'tablet-landscape-up'
  | 'desktop-up'
  | 'big-desktop-up';

function resolveQuery(breakpoint: Breakpoint) {
  const declaration = new RegExp(
    `@custom-media\\s+--${breakpoint}\\s+([^;]+);`,
  ).exec(mediaDefinitions);

  if (!declaration) {
    throw new Error(`No "--${breakpoint}" breakpoint in src/styles/media.css`);
  }

  return declaration[1].trim();
}

// One listener per breakpoint rather than one per caller — a feed mounts a Post
// per item, and they all ask for the same query. The scope is detached because
// VueUse ties its `change` listener to whichever scope is active: bound to the
// first component to ask, the shared ref would stop updating once that
// component unmounted.
const scope = effectScope(true);

const watched = new Map<Breakpoint, ComputedRef<boolean>>();

/** The JS half of `@media (--breakpoint)`, reading the same `media.css`. */
export function useMediaQuery(breakpoint: Breakpoint) {
  const cached = watched.get(breakpoint);

  if (cached) {
    return cached;
  }

  const matches = scope.run(() =>
    useMediaQueryString(resolveQuery(breakpoint)),
  );

  if (!matches) {
    throw new Error('The breakpoint effect scope has been stopped');
  }

  watched.set(breakpoint, matches);

  return matches;
}
