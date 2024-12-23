import AbstractPage from './AbstractPage';

export default class PostsPage extends AbstractPage {
  titles = {
    today: AbstractPage.formatTitle('Today'),
    all: AbstractPage.formatTitle('All Posts'),
    blowing: AbstractPage.formatTitle('Blowing'),
    topThisWeek: AbstractPage.formatTitle('Top This Week'),
    new: AbstractPage.formatTitle('Recent'),
    feed: AbstractPage.formatTitle('My Feed'),
  };

  urls = {
    today: '/',
    all: '/posts/all',
    blowing: '/posts/blowing',
    topThisWeek: '/posts/top-this-week',
    new: '/posts/new',
    feed: '/posts/feed',
  };

  groups = {
    today: 'today-link',
    all: 'all-link',
    blowing: 'blowing-link',
    topThisWeek: 'top-this-week-link',
    new: 'new-link',
    feed: 'feed-link',
  };

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page, isMobile) {
    super(page);
    this.isMobile = isMobile;
  }

  getFeedLink() {
    return this.page.getByTestId(this.groups.feed);
  }

  async goto(url = this.urls.today) {
    await this.page.goto(url);
  }

  async selectPostGroup(group = this.groups.all) {
    await this.page.getByTestId(group).click();
  }
}
