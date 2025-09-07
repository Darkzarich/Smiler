import type { Page, BrowserContext } from '@playwright/test';

export enum Method {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
  PUT = 'PUT',
}

export default class Route {
  url: string;
  method: Method;
  context: BrowserContext | undefined;
  page: Page | undefined;

  constructor(url = '', method = Method.GET) {
    this.url = url;
    this.method = method;
  }

  setContext(context: BrowserContext) {
    this.context = context;
  }

  setPage(page: Page) {
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

  async mock({
    body = undefined,
    status = 200,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: Record<string, any> | undefined;
    status?: number;
  }) {
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
   * @param options
   * @param options.preRequestAction - An optional function to be executed
   * before waiting for the request.
   * @param options.page - Some tests open another tab and then
   * the context set in the init will not work. This option allows to provide a page
   * instead of this.page
   */
  async waitForRequest({
    preRequestAction = () => undefined,
    page,
  }: {
    preRequestAction?: () => void;
    page?: Page;
  }) {
    const currentPage = page || this.page;

    if (!currentPage) {
      throw new Error('Page is not set');
    }

    const request = currentPage.waitForRequest(
      (res) =>
        this.getURLRegExp().test(res.url()) && res.method() === this.method,
    );

    await preRequestAction();

    return request;
  }

  /**
   * Watches if a request was called and if it was changes the flag that can be checked
   * by calling the returned callback
   */
  watchIfRequestWasCalled() {
    let wasRequestSent = false;

    if (!this.page) {
      throw new Error('Page is not set');
    }

    this.page.on('request', (req) => {
      if (req.url().includes(`api${this.url}`)) {
        wasRequestSent = true;
      }
    });

    return () => {
      return wasRequestSent;
    };
  }
}
