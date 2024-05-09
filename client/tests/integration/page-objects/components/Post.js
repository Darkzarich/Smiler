import AbstractComponent from './AbstractComponent';

export default class Post extends AbstractComponent {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {boolean} isMobile
   */
  constructor(page, isMobile) {
    super(page);
    this.isMobile = isMobile;
  }

  getTitleById(id) {
    return this.page.getByTestId(`post-${id}-title`);
  }

  getFollowTagBtn() {
    return this.findContextMenuOption('Follow tag');
  }

  getUnfollowTagBtn() {
    return this.findContextMenuOption('Unfollow tag');
  }

  async clickTag(postId = '', tag = '') {
    await this.page.getByTestId(`post-${postId}-tag-${tag}`).click();
  }

  async followTag(postId = '', tag = '') {
    await this.clickTag(postId, tag);
    await this.getFollowTagBtn().click();
  }

  async unfollowTag(postId = '', tag = '') {
    await this.clickTag(postId, tag);
    await this.getUnfollowTagBtn().click();
  }
}
