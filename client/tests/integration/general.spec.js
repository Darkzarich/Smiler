/* eslint-disable no-await-in-loop */

import { expect } from '@playwright/test';
import createRandomAuth from './factory/auth';
import test from './page-objects';

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });
});

test('Redirects to 404 page if page does not exist', async ({
  page: currentPage,
  NotFoundPage,
}) => {
  await currentPage.goto('100-percent/not/existing/page');

  await expect(currentPage).toHaveURL(NotFoundPage.url);
  await expect(currentPage).toHaveTitle(NotFoundPage.title);
});
