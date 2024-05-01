// @ts-check

export default class Route {
  /**
   *
   * @param {String} url
   * @param {'GET'|'POST'|'DELETE'|'PUT'} [method]
   */
  constructor(url = '', method = 'GET') {
    this.url = url;
    this.method = method;
  }

  /**
   * @param {import('@playwright/test').BrowserContext} context
   */
  setContext(context) {
    this.context = context;
  }

  /**
   * @param {import('@playwright/test').Page} page
   */
  setPage(page) {
    this.page = page;
  }

  /**
   * Replaces all * to prepare URL for regexp to catch request with any URL param
   */
  getPreparedUrl() {
    return this.url.replace(/\*/g, '[-a-zA-Z0-9_.~]+');
  }

  /**
   * Returns a RegExp that will match set url with any query params
   * @example
   * const route = new Route('/post/*', 'DELETE');
   * const regexp = route.getURLRegexp();
   *
   * regexp.test('/post/1?foo=bar') // true
   * regexp.test('/post/1') // true
   * regexp.test('/post/something') // true
   * regexp.test('/post/something/test') // false
   */
  getURLRegExp() {
    return new RegExp(`${this.getPreparedUrl()}(\\?.*)?$`, 'm');
  }

  /**
   * @param {Object} [options]
   * @param {Object} [options.body]
   * @param {Number} [options.status]
   */
  async mock({ body = undefined, status = 200 } = {}) {
    if (!this.context) {
      throw new Error('Context is not set');
    }

    await this.context.route(this.getURLRegExp(), async (route) => {
      if (route.request().method() === this.method) {
        route.fulfill({
          json: body,
          status,
        });

        return;
      }

      route.fallback();
    });
  }

  /**
   * Wait for the request to be fulfilled.
   *
   * @param {Object} [options]
   * @param {Function} [options.beforeAction] - An optional function to be executed
   * before waiting for the request.
   */
  async waitForRequest({ beforeAction = () => undefined } = {}) {
    const request = this.page.waitForRequest(
      (res) =>
        this.getURLRegExp().test(res.url()) && res.method() === this.method,
    );

    await beforeAction();

    return request;
  }
}
