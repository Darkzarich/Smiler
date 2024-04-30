// @ts-check

import { template } from 'lodash';

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

  processTemplate(params = {}) {
    const compile = template(this.url);

    return compile(params);
  }

  /**
   * @param {Object} [options]
   * @param {Object} [options.body]
   * @param {Number} [options.status]
   * @param {Object} [options.params] - Params to pass in the url template
   */
  async mock({ body = undefined, status = 200, params } = {}) {
    if (!this.context) {
      throw new Error('Context is not set');
    }

    const url = params ? this.processTemplate(params) : this.url;

    await this.context.route(
      // Matches any query param if present
      new RegExp(`${url}(\\?{1}.*)?$`, 'm'),
      async (route) => {
        if (route.request().method() === this.method) {
          route.fulfill({
            json: body,
            status,
          });

          return;
        }

        route.fallback();
      },
    );
  }

  /**
   * Wait for the request to be fulfilled.
   *
   * @param {Object} [options]
   * @param {Function} [options.beforeAction] - An optional function to be executed
   * before waiting for the request.
   * @param {Object} [options.params] - Params to pass in the url template
   */
  async waitForRequest({ beforeAction = () => undefined, params } = {}) {
    const url = params ? this.processTemplate(params) : this.url;

    const request = this.page.waitForRequest(
      (res) =>
        // Matches any query param if present
        new RegExp(`${url}(\\?{1}.*)?$`, 'm').test(res.url()) &&
        res.method() === this.method,
    );

    await beforeAction();

    return request;
  }
}
