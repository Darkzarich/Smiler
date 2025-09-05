import type { BrowserContext, Page } from '@playwright/test';
import { routes, type Routes } from './routes';

export default class Api {
  context: BrowserContext | undefined;
  page: Page | undefined;
  routes: Routes;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.routes = routes;

    const controllers = Object.keys(routes) as (keyof Routes)[];

    controllers.forEach((controller) => {
      const endPoints = Object.keys(
        routes[controller],
      ) as (keyof Routes['auth'])[];

      endPoints.forEach((endPoint) => {
        routes[controller as 'auth'][endPoint].setContext(context);
        routes[controller as 'auth'][endPoint].setPage(page);
      });
    });
  }
}
