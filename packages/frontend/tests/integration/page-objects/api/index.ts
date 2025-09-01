import { BrowserContext, Page } from '@playwright/test';
import routes from './routes';

export default class Api {
  context: BrowserContext | undefined;
  page: Page | undefined;
  routes: typeof routes;

  /**
   * @param {import('@playwright/test').BrowserContext} context
   * @param {import('@playwright/test').Page} page
   */
  constructor(page, context) {
    this.page = page;
    this.context = context;
    this.routes = routes;

    const controllers = Object.keys(routes);

    controllers.forEach((controller) => {
      const endPoints = Object.keys(routes[controller]);

      endPoints.forEach((endPoint) => {
        routes[controller][endPoint].setContext(context);
        routes[controller][endPoint].setPage(page);
      });
    });
  }
}
