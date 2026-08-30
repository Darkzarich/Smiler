import { Test } from 'supertest';
import Config from '@config/index';

const testsWithoutOrigin = new WeakSet<Test>();

/** Browsers always send `Origin` on state-changing requests and the CSRF
 * middleware now requires it, so supertest has to behave like one by default.
 */
export function useBrowserOriginByDefault() {
  const { end } = Test.prototype;

  Test.prototype.end = function endWithBrowserOrigin(
    this: Test,
    ...args: Parameters<Test['end']>
  ) {
    if (
      !testsWithoutOrigin.has(this) &&
      !this.get('Origin') &&
      !this.get('Referer')
    ) {
      this.set('Origin', Config.FRONT_ORIGIN_LOCAL);
    }

    return end.apply(this, args);
  };
}

/** Opts a single request out of the default `Origin` to act as a client that
 * is not a browser.
 */
export function withoutBrowserOrigin(test: Test) {
  testsWithoutOrigin.add(test);

  return test;
}
