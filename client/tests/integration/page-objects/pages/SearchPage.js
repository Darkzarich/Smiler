export default class SearchPage {
  title = 'Search | Smiler';

  url = '/posts/search';

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.searchInput = page.getByTestId('search-form-input');
    this.dateFrom = page.getByTestId('search-form-date-from');
    this.dateTo = page.getByTestId('search-form-date-to');
    this.ratingFrom = page.getByTestId('search-form-rating-from');
    this.ratingTo = page.getByTestId('search-form-rating-to');
  }

  async goto(query = '') {
    const urlQuery = query ? `?${query}` : '';

    await this.page.goto(`${this.url}${urlQuery}`);
  }

  pageHasTitleQueryParam(title = '') {
    const normalizedTitle = encodeURIComponent(title);
    const regexp = new RegExp(`${this.url}?.*title=${normalizedTitle}`);

    return regexp.test(this.page.url());
  }

  pageHasDateQueryParams({ from, to }) {
    const normalizedFrom = encodeURIComponent(from);
    const normalizedTo = encodeURIComponent(to);
    const regexp = new RegExp(
      `${this.url}?.*dateFrom=${normalizedFrom}&dateTo=${normalizedTo}`,
    );

    return regexp.test(this.page.url());
  }

  pageHasRatingQueryParams({ from, to }) {
    const regexp = new RegExp(
      `${this.url}?.*ratingFrom=${from}&ratingTo=${to}`,
    );

    return regexp.test(this.page.url());
  }

  pageHasTagsQueryParams(tags = []) {
    const urlTags = tags.map((t) => `tags=${t}`).join('&');
    const regexp = new RegExp(`${this.url}?.*${urlTags}`);

    return regexp.test(this.page.url());
  }

  async submitSearch() {
    await this.searchInput.press('Enter');
  }
}
