export default class PostsPage {
  // TODO: Move "| Smiler" part in the base class
  titles = {
    today: 'Today | Smiler',
    all: 'All Posts | Smiler',
  };

  urls = {
    today: '/',
    all: '/posts/all',
  };

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async goto(url = this.urls.today) {
    await this.page.goto(url);
  }
}
