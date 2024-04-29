// @ts-check

import { test } from '@playwright/test';
import Api from './api';

// Extend base test by providing common page objects
export default test.extend({
  Api: async ({ page, context }, use) => {
    const api = new Api(page, context);

    // Use the fixture value in the test.
    await use(api);
  },
});
