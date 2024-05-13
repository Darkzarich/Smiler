export default class PostsPage {
  // TODO: Move "| Smiler" part in the base class
  titles = {
    today: 'Today | Smiler',
    all: 'All Posts | Smiler',
    blowing: 'Blowing | Smiler',
    topThisWeek: 'Top This Week | Smiler',
    new: 'Recent | Smiler',
    feed: 'My Feed | Smiler',
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
    this.page = page;
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
