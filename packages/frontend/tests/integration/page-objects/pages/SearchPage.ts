import { type Locator, type Page } from '@playwright/test';
import AbstractPage from './AbstractPage';

interface DateRange {
  from: string;
  to: string;
}

export default class SearchPage extends AbstractPage {
  readonly title = AbstractPage.formatTitle('Search');

  readonly searchInput: Locator;
  readonly dateFrom: Locator;
  readonly dateTo: Locator;
  readonly ratingFrom: Locator;
  readonly ratingTo: Locator;

  readonly url = '/posts/search';

  constructor(page: Page) {
    super(page);

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

  pageHasDateQueryParams({ from, to }: DateRange) {
    const normalizedFrom = encodeURIComponent(from);
    const normalizedTo = encodeURIComponent(to);
    const regexp = new RegExp(
      `${this.url}?.*dateFrom=${normalizedFrom}&dateTo=${normalizedTo}`,
    );

    return regexp.test(this.page.url());
  }

  pageHasRatingQueryParams({ from, to }: DateRange) {
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
