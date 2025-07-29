import { isMobile } from './is-mobile';

export function isDesktop(): boolean {
  return !isMobile();
}
